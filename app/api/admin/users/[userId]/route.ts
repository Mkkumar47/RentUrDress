import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { isAdminAccessGranted } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import CollectionModel from "@/models/Collection";
import DressModel from "@/models/Dress";
import OrderModel from "@/models/Order";
import TransactionModel from "@/models/Transaction";
import UserModel from "@/models/User";

type Context = {
  params: Promise<{ userId: string }>;
};

type UpdateUserBody = {
  name?: string;
  email?: string;
  city?: string;
  phone?: string;
  role?: "user" | "admin";
};

function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function normalizeOptionalText(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function GET(_: Request, context: Context) {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return unauthorizedResponse();
  }

  const { userId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return badRequest("Invalid user id.");
  }

  await connectToDatabase();

  const user = await UserModel.findById(userId)
    .select("_id name email city phone avatarUrl role createdAt")
    .lean();

  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const [listedDresses, orders, transactions, collections] = await Promise.all([
    DressModel.find({ owner: userId })
      .select(
        "_id title brand category size color dailyRent securityDeposit location isAvailable featured createdAt",
      )
      .sort({ createdAt: -1 })
      .lean(),
    OrderModel.find({ $or: [{ renter: userId }, { owner: userId }] })
      .populate("dress", "_id title imageUrl location")
      .populate("renter", "_id name email")
      .populate("owner", "_id name email")
      .sort({ createdAt: -1 })
      .lean(),
    TransactionModel.find({ user: userId })
      .populate({
        path: "order",
        select: "_id orderStatus paymentStatus totalAmount rentalStart rentalEnd trackingCity dress",
        populate: { path: "dress", select: "_id title imageUrl location" },
      })
      .sort({ createdAt: -1 })
      .lean(),
    CollectionModel.find({ owner: userId, isPublic: true })
      .populate("owner", "_id name city avatarUrl")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return NextResponse.json({
    user,
    listedDresses,
    orders,
    transactions,
    collections,
  });
}

export async function PATCH(request: Request, context: Context) {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return unauthorizedResponse();
  }

  const { userId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return badRequest("Invalid user id.");
  }

  const body = (await request.json()) as UpdateUserBody;
  const name = normalizeOptionalText(body.name);
  const emailRaw = normalizeOptionalText(body.email);
  const email = emailRaw?.toLowerCase();
  const city = normalizeOptionalText(body.city);
  const phone = normalizeOptionalText(body.phone);
  const role = body.role;

  if (body.role && role !== "user" && role !== "admin") {
    return badRequest("Role must be either 'user' or 'admin'.");
  }

  const updateData: {
    name?: string;
    email?: string;
    city?: string;
    phone?: string;
    role?: "user" | "admin";
  } = {};

  if (name) {
    updateData.name = name;
  }
  if (email) {
    updateData.email = email;
  }
  if (city) {
    updateData.city = city;
  }
  if (phone) {
    updateData.phone = phone;
  }
  if (role) {
    updateData.role = role;
  }

  if (Object.keys(updateData).length === 0) {
    return badRequest("At least one valid field is required for update.");
  }

  await connectToDatabase();
  const existingUser = await UserModel.findById(userId).select("_id email").lean();
  if (!existingUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  if (email && email !== existingUser.email) {
    const conflictUser = await UserModel.findOne({
      email,
      _id: { $ne: userId },
    })
      .select("_id")
      .lean();
    if (conflictUser) {
      return NextResponse.json(
        { message: "Another user already uses this email." },
        { status: 409 },
      );
    }
  }

  const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  })
    .select("_id name email city phone avatarUrl role createdAt")
    .lean();

  if (!updatedUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    message: "User updated successfully.",
    user: updatedUser,
  });
}

export async function DELETE(_: Request, context: Context) {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return unauthorizedResponse();
  }

  const { userId } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return badRequest("Invalid user id.");
  }

  await connectToDatabase();

  const user = await UserModel.findById(userId).select("_id").lean();
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const ownedDresses = await DressModel.find({ owner: userId }).select("_id").lean();
  const ownedDressIds = ownedDresses.map((dress) => dress._id);

  const orderFilter =
    ownedDressIds.length > 0
      ? {
          $or: [
            { renter: userId },
            { owner: userId },
            { dress: { $in: ownedDressIds } },
          ],
        }
      : { $or: [{ renter: userId }, { owner: userId }] };

  const relatedOrders = await OrderModel.find(orderFilter).select("_id").lean();
  const relatedOrderIds = relatedOrders.map((order) => order._id);

  const transactionFilter =
    relatedOrderIds.length > 0
      ? {
          $or: [
            { user: userId },
            { order: { $in: relatedOrderIds } },
          ],
        }
      : { user: userId };

  const [transactionsDeleteResult, ordersDeleteResult, dressesDeleteResult, collectionsDeleteResult] =
    await Promise.all([
      TransactionModel.deleteMany(transactionFilter),
      OrderModel.deleteMany(orderFilter),
      DressModel.deleteMany({ owner: userId }),
      CollectionModel.deleteMany({ owner: userId }),
    ]);

  await UserModel.deleteOne({ _id: userId });

  return NextResponse.json({
    message: "User and related records (dresses, collections, orders, transactions) deleted successfully.",
    deleted: {
      users: 1,
      dresses: dressesDeleteResult.deletedCount ?? 0,
      orders: ordersDeleteResult.deletedCount ?? 0,
      transactions: transactionsDeleteResult.deletedCount ?? 0,
      collections: collectionsDeleteResult.deletedCount ?? 0,
    },
  });
}
