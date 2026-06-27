/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env.local or environment variables.");
}

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    city: String,
    phone: String,
    avatarUrl: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

const dressSchema = new mongoose.Schema(
  {
    title: String,
    brand: String,
    category: String,
    size: String,
    color: String,
    description: String,
    imageUrl: String,
    dailyRent: Number,
    securityDeposit: Number,
    location: {
      city: String,
      state: String,
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isAvailable: Boolean,
    featured: Boolean,
    tags: [String],
  },
  { timestamps: true },
);

const orderSchema = new mongoose.Schema(
  {
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dress: { type: mongoose.Schema.Types.ObjectId, ref: "Dress" },
    rentalStart: Date,
    rentalEnd: Date,
    days: Number,
    totalAmount: Number,
    paymentStatus: String,
    orderStatus: String,
    deliveryLocation: String,
    trackingCity: String,
    trackingLocation: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true },
);

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    provider: { type: String, default: "PHONEPE" },
    providerTransactionId: String,
    merchantTransactionId: String,
    amount: Number,
    currency: String,
    status: String,
    simulated: Boolean,
    paymentResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

const collectionSchema = new mongoose.Schema(
  {
    title: String,
    material: String,
    category: String,
    description: String,
    imageUrl: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Dress = mongoose.models.Dress || mongoose.model("Dress", dressSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
const Collection =
  mongoose.models.Collection || mongoose.model("Collection", collectionSchema);

async function runSeed() {
  await mongoose.connect(MONGODB_URI, {
    dbName: "renturdress",
    bufferCommands: false,
  });

  const seedPath = path.join(process.cwd(), "data", "seed.json");
  const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));

  await Promise.all([
    Collection.deleteMany({}),
    Transaction.deleteMany({}),
    Order.deleteMany({}),
    Dress.deleteMany({}),
    User.deleteMany({}),
  ]);

  const usersWithHashedPasswords = await Promise.all(
    seedData.users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })),
  );

  const users = await User.insertMany(usersWithHashedPasswords);
  const userByEmail = new Map(users.map((user) => [user.email, user]));

  const dressesToInsert = seedData.dresses.map((dress) => {
    const owner = userByEmail.get(dress.ownerEmail);
    if (!owner) {
      throw new Error(`Owner not found for dress "${dress.title}"`);
    }

    const dressWithoutOwnerEmail = { ...dress };
    delete dressWithoutOwnerEmail.ownerEmail;
    return {
      ...dressWithoutOwnerEmail,
      owner: owner._id,
    };
  });

  const dresses = await Dress.insertMany(dressesToInsert);
  const dressByTitle = new Map(dresses.map((dress) => [dress.title, dress]));

  const ordersToInsert = seedData.orders.map((order) => {
    const renter = userByEmail.get(order.renterEmail);
    const owner = userByEmail.get(order.ownerEmail);
    const dress = dressByTitle.get(order.dressTitle);

    if (!renter || !owner || !dress) {
      throw new Error(`Invalid order seed: ${order.dressTitle}`);
    }

    return {
      renter: renter._id,
      owner: owner._id,
      dress: dress._id,
      rentalStart: new Date(order.rentalStart),
      rentalEnd: new Date(order.rentalEnd),
      days: order.days,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      deliveryLocation: order.deliveryLocation,
      trackingCity: order.trackingCity,
      trackingLocation: {
        latitude:
          order.trackingLocation?.latitude ?? dress.location.coordinates.latitude,
        longitude:
          order.trackingLocation?.longitude ?? dress.location.coordinates.longitude,
      },
    };
  });

  const orders = await Order.insertMany(ordersToInsert);
  const orderByDressId = new Map(orders.map((order) => [String(order.dress), order]));

  const transactionsToInsert = seedData.transactions.map((transaction) => {
    const renter = userByEmail.get(transaction.renterEmail);
    const dress = dressByTitle.get(transaction.dressTitle);

    if (!renter || !dress) {
      throw new Error(`Invalid transaction seed: ${transaction.merchantTransactionId}`);
    }

    const linkedOrder = orderByDressId.get(String(dress._id));
    if (!linkedOrder) {
      throw new Error(`Order not found for transaction: ${transaction.merchantTransactionId}`);
    }

    return {
      order: linkedOrder._id,
      user: renter._id,
      provider: "PHONEPE",
      providerTransactionId: transaction.providerTransactionId,
      merchantTransactionId: transaction.merchantTransactionId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      simulated: transaction.simulated,
      paymentResponse: { seeded: true },
    };
  });

  await Transaction.insertMany(transactionsToInsert);

  const collectionsToInsert = (seedData.collections ?? []).map((collection) => {
    const owner = userByEmail.get(collection.ownerEmail);
    if (!owner) {
      throw new Error(`Owner not found for collection "${collection.title}"`);
    }

    const collectionWithoutOwnerEmail = { ...collection };
    delete collectionWithoutOwnerEmail.ownerEmail;

    return {
      ...collectionWithoutOwnerEmail,
      owner: owner._id,
      isPublic: true,
    };
  });

  if (collectionsToInsert.length > 0) {
    await Collection.insertMany(collectionsToInsert);
  }

  console.log("Seed completed successfully.");
  console.log(`Users: ${users.length}`);
  console.log(`Dresses: ${dresses.length}`);
  console.log(`Orders: ${orders.length}`);
  console.log(`Transactions: ${transactionsToInsert.length}`);
  console.log(`Collections: ${collectionsToInsert.length}`);
}

runSeed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
