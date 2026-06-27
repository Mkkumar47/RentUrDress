export type ApiUser = {
  _id: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  avatarUrl: string;
  role: "user" | "admin";
};

export type ApiDress = {
  _id: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  description: string;
  imageUrl: string;
  dailyRent: number;
  securityDeposit: number;
  location: {
    city: string;
    state: string;
    landmark: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  owner: Pick<ApiUser, "_id" | "name" | "city">;
  isAvailable: boolean;
  featured: boolean;
};

export type ApiOrder = {
  _id: string;
  dress: Pick<ApiDress, "_id" | "title" | "imageUrl" | "location">;
  totalAmount: number;
  orderStatus: "placed" | "active" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  rentalStart: string;
  rentalEnd: string;
  trackingCity: string;
  trackingLocation: {
    latitude: number;
    longitude: number;
  };
};

export type ApiTransaction = {
  _id: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  merchantTransactionId: string;
  createdAt: string;
};

export type ApiCollection = {
  _id: string;
  title: string;
  material: string;
  category: string;
  description: string;
  imageUrl: string;
  isPublic: boolean;
  owner: Pick<ApiUser, "_id" | "name" | "city" | "avatarUrl">;
  createdAt: string;
};
