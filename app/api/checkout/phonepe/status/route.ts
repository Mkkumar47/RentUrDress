import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createXVerifyForStatus, getPhonePeConfig } from "@/lib/phonepe";
import { getAuthenticatedUserFromCookies } from "@/lib/user-auth";
import DressModel from "@/models/Dress";
import OrderModel from "@/models/Order";
import TransactionModel from "@/models/Transaction";

export async function GET(request: NextRequest) {
  const authenticatedUser = await getAuthenticatedUserFromCookies();
  if (!authenticatedUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const merchantTransactionId = request.nextUrl.searchParams
    .get("merchantTransactionId")
    ?.trim();

  if (!merchantTransactionId) {
    return NextResponse.json(
      { message: "merchantTransactionId is required." },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const transaction = await TransactionModel.findOne({
    merchantTransactionId,
    user: authenticatedUser._id,
  })
    .lean();

  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  if (transaction.simulated) {
    return NextResponse.json({
      message: "This transaction is simulated and already settled.",
      status: transaction.status,
      transaction,
    });
  }

  const config = getPhonePeConfig();
  const apiPath = `/pg/v1/status/${config.merchantId}/${merchantTransactionId}`;
  const xVerify = createXVerifyForStatus(apiPath, config.saltKey, config.saltIndex);

  const statusResponse = await fetch(`${config.hostUrl}${apiPath}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
      "X-MERCHANT-ID": config.merchantId,
    },
    cache: "no-store",
  });

  const phonePeStatusData = (await statusResponse.json()) as {
    success?: boolean;
    code?: string;
    message?: string;
    data?: {
      state?: "COMPLETED" | "PENDING" | "FAILED";
      transactionId?: string;
      amount?: number;
      responseCode?: string;
    };
  };

  const state = phonePeStatusData.data?.state;
  const providerTransactionId = phonePeStatusData.data?.transactionId;
  const orderId = String(transaction.order);

  if (state === "COMPLETED") {
    await Promise.all([
      TransactionModel.updateOne(
        { _id: transaction._id },
        {
          $set: {
            status: "SUCCESS",
            providerTransactionId,
            paymentResponse: phonePeStatusData,
          },
        },
      ),
      OrderModel.updateOne(
        { _id: orderId },
        { $set: { paymentStatus: "paid", orderStatus: "active" } },
      ),
    ]);
  } else if (state === "FAILED") {
    const linkedOrder = await OrderModel.findById(orderId).lean();
    await Promise.all([
      TransactionModel.updateOne(
        { _id: transaction._id },
        {
          $set: {
            status: "FAILED",
            providerTransactionId,
            paymentResponse: phonePeStatusData,
          },
        },
      ),
      OrderModel.updateOne(
        { _id: orderId },
        { $set: { paymentStatus: "failed", orderStatus: "cancelled" } },
      ),
      linkedOrder?.dress
        ? DressModel.updateOne(
            { _id: String(linkedOrder.dress) },
            { $set: { isAvailable: true } },
          )
        : Promise.resolve(),
    ]);
  } else {
    await TransactionModel.updateOne(
      { _id: transaction._id },
      {
        $set: {
          status: "PENDING",
          providerTransactionId,
          paymentResponse: phonePeStatusData,
        },
      },
    );
  }

  const latestTransaction = await TransactionModel.findById(transaction._id).lean();

  return NextResponse.json({
    message: "PhonePe status fetched successfully.",
    state: state ?? "UNKNOWN",
    transaction: latestTransaction,
    phonePeStatusData,
  });
}
