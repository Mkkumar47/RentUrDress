import { NextResponse } from "next/server";
import { isAdminAccessGranted } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/db";
import CollectionModel from "@/models/Collection";
import DressModel from "@/models/Dress";
import OrderModel from "@/models/Order";
import TransactionModel from "@/models/Transaction";
import UserModel from "@/models/User";

export async function GET() {
  const authenticated = await isAdminAccessGranted();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const users = await UserModel.find({})
    .select("_id name email city phone role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((user) => user._id);

  const [dressCounts, activeOrderCounts, successfulTransactions, collectionCounts] = await Promise.all([
    DressModel.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      {
        $match: {
          renter: { $in: userIds },
          orderStatus: { $in: ["placed", "active"] },
        },
      },
      { $group: { _id: "$renter", count: { $sum: 1 } } },
    ]),
    TransactionModel.aggregate([
      { $match: { user: { $in: userIds }, status: "SUCCESS" } },
      { $group: { _id: "$user", totalPaid: { $sum: "$amount" } } },
    ]),
    CollectionModel.aggregate([
      { $match: { owner: { $in: userIds }, isPublic: true } },
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]),
  ]);

  const dressesByUser = new Map(
    dressCounts.map((item) => [String(item._id), item.count as number]),
  );
  const ordersByUser = new Map(
    activeOrderCounts.map((item) => [String(item._id), item.count as number]),
  );
  const amountByUser = new Map(
    successfulTransactions.map((item) => [
      String(item._id),
      item.totalPaid as number,
    ]),
  );
  const collectionsByUser = new Map(
    collectionCounts.map((item) => [String(item._id), item.count as number]),
  );

  const usersWithDetails = users.map((user) => ({
    ...user,
    listedDressCount: dressesByUser.get(String(user._id)) ?? 0,
    activeRentalCount: ordersByUser.get(String(user._id)) ?? 0,
    totalTransactionAmount: amountByUser.get(String(user._id)) ?? 0,
    collectionCount: collectionsByUser.get(String(user._id)) ?? 0,
  }));

  return NextResponse.json({ users: usersWithDetails });
}
