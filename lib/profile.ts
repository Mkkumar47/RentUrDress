import CollectionModel from "@/models/Collection";
import DressModel from "@/models/Dress";
import OrderModel from "@/models/Order";
import TransactionModel from "@/models/Transaction";
import UserModel from "@/models/User";

export async function getProfileByUserId(userId: string) {
  const user = await UserModel.findById(userId)
    .select("_id name email city phone avatarUrl role")
    .lean();

  if (!user) {
    return null;
  }

  const [listedDresses, activeOrders, transactions, collections] = await Promise.all([
    DressModel.find({ owner: userId })
      .populate("owner", "name city")
      .sort({ createdAt: -1 })
      .lean(),
    OrderModel.find({
      $or: [{ renter: userId }, { owner: userId }],
      orderStatus: { $in: ["placed", "active"] },
    })
      .populate("dress", "title imageUrl location")
      .sort({ createdAt: -1 })
      .lean(),
    TransactionModel.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    CollectionModel.find({ owner: userId, isPublic: true })
      .populate("owner", "_id name city avatarUrl")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    user,
    listedDresses,
    activeOrders,
    transactions,
    collections,
  };
}
