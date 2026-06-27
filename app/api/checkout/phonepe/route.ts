import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createPhonePePayRequest } from "@/lib/phonepe";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";
import DressModel from "@/models/Dress";
import OrderModel from "@/models/Order";
import TransactionModel from "@/models/Transaction";

type CheckoutMode = "mock" | "real";

type CheckoutBody = {
  dressId?: string;
  rentalStart?: string;
  rentalEnd?: string;
  deliveryLocation?: string;
  mode?: CheckoutMode;
  mobileNumber?: string;
};

function computeRentalDays(start: Date, end: Date) {
  const difference = end.getTime() - start.getTime();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

function buildMerchantTransactionId() {
  return `RUD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutBody;
  const dressId = body.dressId?.trim();
  const deliveryLocation = body.deliveryLocation?.trim();
  const mode = body.mode ?? "mock";

  if (mode !== "mock" && mode !== "real") {
    return NextResponse.json(
      { message: "mode must be either 'mock' or 'real'." },
      { status: 400 },
    );
  }

  if (!dressId || !deliveryLocation) {
    return NextResponse.json(
      { message: "dressId and deliveryLocation are required." },
      { status: 400 },
    );
  }

  if (!mongoose.Types.ObjectId.isValid(dressId)) {
    return NextResponse.json({ message: "Invalid dress ID." }, { status: 400 });
  }

  const authenticatedUser = await getAuthenticatedUserFromCookies();
  if (!authenticatedUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rentalStart = body.rentalStart ? new Date(body.rentalStart) : new Date();
  const rentalEnd = body.rentalEnd
    ? new Date(body.rentalEnd)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (Number.isNaN(rentalStart.getTime()) || Number.isNaN(rentalEnd.getTime())) {
    return NextResponse.json(
      { message: "Invalid rentalStart or rentalEnd date." },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const dress = await DressModel.findById(dressId).lean();

  if (!dress) {
    return NextResponse.json({ message: "Dress not found." }, { status: 404 });
  }

  if (!dress.owner || !dress.location?.city || !dress.location?.coordinates) {
    return NextResponse.json(
      { message: "Dress data is incomplete for checkout." },
      { status: 422 },
    );
  }

  if (!dress.isAvailable) {
    return NextResponse.json(
      { message: "This dress is currently unavailable." },
      { status: 409 },
    );
  }

  const days = computeRentalDays(rentalStart, rentalEnd);
  const totalAmount = days * dress.dailyRent;
  const merchantTransactionId = buildMerchantTransactionId();

  if (mode === "mock") {
    const order = await OrderModel.create({
      renter: authenticatedUser._id,
      owner: dress.owner,
      dress: dress._id,
      rentalStart,
      rentalEnd,
      days,
      totalAmount,
      paymentStatus: "paid",
      orderStatus: "placed",
      deliveryLocation,
      trackingCity: dress.location.city,
      trackingLocation: {
        latitude: dress.location.coordinates.latitude,
        longitude: dress.location.coordinates.longitude,
      },
    });

    const transaction = await TransactionModel.create({
      order: order._id,
      user: authenticatedUser._id,
      provider: "PHONEPE",
      merchantTransactionId,
      amount: totalAmount,
      currency: "INR",
      status: "SUCCESS",
      simulated: true,
      paymentResponse: {
        message: "Sandbox mock payment successful",
        phonePeHostUrl: process.env.NEXT_PUBLIC_PHONE_PAY_HOST_URL,
        merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID,
        saltIndex: process.env.NEXT_PUBLIC_SALT_INDEX,
      },
    });

    await DressModel.updateOne({ _id: dress._id }, { $set: { isAvailable: false } });

    return NextResponse.json({
      mode: "mock",
      message:
        "Mock PhonePe transaction successful. Order and transaction have been created.",
      order,
      transaction,
    });
  }

  const order = await OrderModel.create({
    renter: authenticatedUser._id,
    owner: dress.owner,
    dress: dress._id,
    rentalStart,
    rentalEnd,
    days,
    totalAmount,
    paymentStatus: "pending",
    orderStatus: "placed",
    deliveryLocation,
    trackingCity: dress.location.city,
    trackingLocation: {
      latitude: dress.location.coordinates.latitude,
      longitude: dress.location.coordinates.longitude,
    },
  });

  const transaction = await TransactionModel.create({
    order: order._id,
    user: authenticatedUser._id,
    provider: "PHONEPE",
    merchantTransactionId,
    amount: totalAmount,
    currency: "INR",
    status: "PENDING",
    simulated: false,
    paymentResponse: {},
  });

  await DressModel.updateOne({ _id: dress._id }, { $set: { isAvailable: false } });

  try {
    const phonePeRequest = createPhonePePayRequest({
      merchantTransactionId,
      merchantUserId: String(authenticatedUser._id),
      amountInPaise: totalAmount * 100,
      mobileNumber: body.mobileNumber?.trim() || undefined,
    });

    const response = await fetch(`${phonePeRequest.config.hostUrl}${phonePeRequest.apiPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        "X-VERIFY": phonePeRequest.xVerify,
      },
      body: JSON.stringify({ request: phonePeRequest.base64Payload }),
      cache: "no-store",
    });

    const phonePeResponse = (await response.json()) as {
      success?: boolean;
      code?: string;
      message?: string;
      data?: {
        merchantId?: string;
        merchantTransactionId?: string;
        instrumentResponse?: {
          type?: string;
          redirectInfo?: {
            url?: string;
            method?: string;
          };
        };
      };
    };

    await TransactionModel.updateOne(
      { _id: transaction._id },
      { $set: { paymentResponse: phonePeResponse } },
    );

    if (!response.ok || !phonePeResponse.success) {
      await Promise.all([
        TransactionModel.updateOne(
          { _id: transaction._id },
          { $set: { status: "FAILED" } },
        ),
        OrderModel.updateOne(
          { _id: order._id },
          { $set: { paymentStatus: "failed", orderStatus: "cancelled" } },
        ),
        DressModel.updateOne({ _id: dress._id }, { $set: { isAvailable: true } }),
      ]);

      return NextResponse.json(
        {
          mode: "real",
          message:
            phonePeResponse.message ??
            "PhonePe initiation failed. Verify callback URLs and sandbox setup.",
          phonePeResponse,
        },
        { status: 502 },
      );
    }

    const redirectUrl = phonePeResponse.data?.instrumentResponse?.redirectInfo?.url;

    return NextResponse.json({
      mode: "real",
      message: "PhonePe payment initiated with signed payload.",
      merchantTransactionId,
      orderId: order._id,
      transactionId: transaction._id,
      redirectUrl,
      phonePeResponse,
    });
  } catch (error) {
    await Promise.all([
      TransactionModel.updateOne({ _id: transaction._id }, { $set: { status: "FAILED" } }),
      OrderModel.updateOne(
        { _id: order._id },
        { $set: { paymentStatus: "failed", orderStatus: "cancelled" } },
      ),
      DressModel.updateOne({ _id: dress._id }, { $set: { isAvailable: true } }),
    ]);

    const errorMessage = error instanceof Error ? error.message : "PhonePe initiation failed.";
    return NextResponse.json({ message: errorMessage, mode: "real" }, { status: 500 });
  }
}
