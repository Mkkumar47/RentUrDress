"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, PencilLine, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminTableSkeleton } from "@/components/ui/admin-table-skeleton";
import { LoadingScene } from "@/components/ui/loading-scene";
import { fetchWithLoader } from "@/lib/client-api";
import { clearClientSessionStorage } from "@/lib/client-session";

const ITEMS_PER_PAGE = 15;

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  avatarUrl?: string;
  role: "user" | "admin";
  listedDressCount: number;
  collectionCount: number;
  activeRentalCount: number;
  totalTransactionAmount: number;
};

type AdminDress = {
  _id: string;
  title: string;
  brand: string;
  category: string;
  dailyRent: number;
  isAvailable: boolean;
  location: {
    city: string;
    state: string;
  };
};

type AdminOrder = {
  _id: string;
  orderStatus: "placed" | "active" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  totalAmount: number;
  trackingCity: string;
  rentalStart: string;
  rentalEnd: string;
  dress?: {
    _id: string;
    title: string;
  };
  renter?: {
    _id: string;
    name: string;
    email: string;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
};

type AdminTransaction = {
  _id: string;
  merchantTransactionId: string;
  providerTransactionId?: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  simulated: boolean;
  createdAt: string;
  order?: {
    _id: string;
    orderStatus: "placed" | "active" | "completed" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
    totalAmount: number;
    trackingCity: string;
    dress?: {
      _id: string;
      title: string;
    };
  };
};

type AdminCollection = {
  _id: string;
  title: string;
  material: string;
  category: string;
  description: string;
  imageUrl: string;
  isPublic: boolean;
  owner: {
    _id: string;
    name: string;
    city: string;
    avatarUrl: string;
  };
  createdAt: string;
};

type AdminUserDetails = {
  user: {
    _id: string;
    name: string;
    email: string;
    city: string;
    phone: string;
    avatarUrl: string;
    role: "user" | "admin";
    createdAt: string;
  };
  listedDresses: AdminDress[];
  orders: AdminOrder[];
  transactions: AdminTransaction[];
  collections: AdminCollection[];
};

type EditUserForm = {
  name: string;
  email: string;
  city: string;
  phone: string;
  role: "user" | "admin";
};

type EditCollectionForm = {
  title: string;
  material: string;
  category: string;
  description: string;
  imageUrl: string;
};

function getOrderStatusTone(status: AdminOrder["orderStatus"]) {
  if (status === "completed") {
    return "success";
  }
  if (status === "cancelled") {
    return "warning";
  }
  return "primary";
}

function getPaymentStatusTone(status: AdminOrder["paymentStatus"]) {
  if (status === "paid") {
    return "success";
  }
  if (status === "failed") {
    return "warning";
  }
  return "neutral";
}

function getTransactionStatusTone(status: AdminTransaction["status"]) {
  if (status === "SUCCESS") {
    return "success";
  }
  if (status === "FAILED") {
    return "warning";
  }
  return "neutral";
}

export function AdminClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<AdminUserDetails | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionForm, setCollectionForm] = useState<EditCollectionForm | null>(null);
  const [savingCollectionId, setSavingCollectionId] = useState<string | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [userCityFilter, setUserCityFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionMaterialFilter, setCollectionMaterialFilter] = useState("all");
  const [collectionCategoryFilter, setCollectionCategoryFilter] = useState("all");
  const [collectionPage, setCollectionPage] = useState(1);

  const loadUserDetails = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setDetailsLoading(true);
    setEditingCollectionId(null);
    setCollectionForm(null);
    setCollectionSearch("");
    setCollectionMaterialFilter("all");
    setCollectionCategoryFilter("all");
    setCollectionPage(1);

    try {
      const response = await fetchWithLoader(`/api/admin/users/${userId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        message?: string;
        user?: AdminUserDetails["user"];
        listedDresses?: AdminDress[];
        orders?: AdminOrder[];
        transactions?: AdminTransaction[];
        collections?: AdminCollection[];
      };

      if (!response.ok || !data.user) {
        setSelectedUserDetails(null);
        setMessage(data.message ?? "Failed to load user details.");
        return;
      }

      setSelectedUserDetails({
        user: data.user,
        listedDresses: data.listedDresses ?? [],
        orders: data.orders ?? [],
        transactions: data.transactions ?? [],
        collections: data.collections ?? [],
      });
      setMessage("");
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const usersResponse = await fetchWithLoader("/api/admin/users", {
        cache: "no-store",
      });
      const usersData = (await usersResponse.json()) as {
        message?: string;
        users?: AdminUser[];
      };

      if (!usersResponse.ok || !usersData.users) {
        setUsers([]);
        setSelectedUserDetails(null);
        setMessage(usersData.message ?? "Failed to load users.");
        return;
      }

      const nextUsers = usersData.users;
      setUsers(nextUsers);

      if (nextUsers.length === 0) {
        setSelectedUserId(null);
        setSelectedUserDetails(null);
        return;
      }

      const selectedStillExists = selectedUserId
        ? nextUsers.some((user) => user._id === selectedUserId)
        : false;
      const nextSelectedUserId =
        selectedStillExists && selectedUserId ? selectedUserId : nextUsers[0]._id;
      await loadUserDetails(nextSelectedUserId);
    } finally {
      setUsersLoading(false);
    }
  }, [loadUserDetails, selectedUserId]);

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !normalizedUserSearch ||
        user.name.toLowerCase().includes(normalizedUserSearch) ||
        user.email.toLowerCase().includes(normalizedUserSearch) ||
        user.city.toLowerCase().includes(normalizedUserSearch);
      const matchesRole = userRoleFilter === "all" || user.role === userRoleFilter;
      const matchesCity = userCityFilter === "all" || user.city === userCityFilter;
      return matchesSearch && matchesRole && matchesCity;
    });
  }, [normalizedUserSearch, userCityFilter, userRoleFilter, users]);

  const userCities = useMemo(() => {
    const citySet = new Set(users.map((user) => user.city));
    return Array.from(citySet).sort();
  }, [users]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentUserPage = Math.min(userPage, totalUserPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentUserPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentUserPage, filteredUsers]);

  const selectedCollections = useMemo(
    () => selectedUserDetails?.collections ?? [],
    [selectedUserDetails],
  );
  const collectionMaterials = useMemo(() => {
    const materialSet = new Set(selectedCollections.map((collection) => collection.material));
    return Array.from(materialSet).sort();
  }, [selectedCollections]);
  const collectionCategories = useMemo(() => {
    const categorySet = new Set(selectedCollections.map((collection) => collection.category));
    return Array.from(categorySet).sort();
  }, [selectedCollections]);
  const normalizedCollectionSearch = collectionSearch.trim().toLowerCase();
  const filteredCollections = useMemo(() => {
    return selectedCollections.filter((collection) => {
      const matchesSearch =
        !normalizedCollectionSearch ||
        collection.title.toLowerCase().includes(normalizedCollectionSearch) ||
        collection.material.toLowerCase().includes(normalizedCollectionSearch) ||
        collection.category.toLowerCase().includes(normalizedCollectionSearch) ||
        collection.description.toLowerCase().includes(normalizedCollectionSearch);
      const matchesMaterial =
        collectionMaterialFilter === "all" || collection.material === collectionMaterialFilter;
      const matchesCategory =
        collectionCategoryFilter === "all" || collection.category === collectionCategoryFilter;
      return matchesSearch && matchesMaterial && matchesCategory;
    });
  }, [
    collectionCategoryFilter,
    collectionMaterialFilter,
    normalizedCollectionSearch,
    selectedCollections,
  ]);
  const totalCollectionPages = Math.max(
    1,
    Math.ceil(filteredCollections.length / ITEMS_PER_PAGE),
  );
  const currentCollectionPage = Math.min(collectionPage, totalCollectionPages);
  const paginatedCollections = useMemo(() => {
    const start = (currentCollectionPage - 1) * ITEMS_PER_PAGE;
    return filteredCollections.slice(start, start + ITEMS_PER_PAGE);
  }, [currentCollectionPage, filteredCollections]);

  useEffect(() => {
    async function checkSession() {
      const response = await fetchWithLoader("/api/admin/me", { cache: "no-store" });
      const data = (await response.json()) as { authenticated: boolean };
      if (data.authenticated) {
        setAuthenticated(true);
        await loadUsers();
      }
      setLoading(false);
    }

    checkSession().catch(() => {
      setMessage("Unable to verify admin session.");
      setLoading(false);
    });
  }, [loadUsers]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const response = await fetchWithLoader("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json()) as { message?: string };
    setMessage(data.message ?? "");

    if (response.ok) {
      setAuthenticated(true);
      setPassword("");
      await loadUsers();
    }
  }

  async function handleLogout() {
    await Promise.all([
      fetchWithLoader("/api/admin/logout", { method: "POST" }),
      fetchWithLoader("/api/auth/logout", { method: "POST" }),
    ]);
    clearClientSessionStorage();
    setAuthenticated(false);
    setUsers([]);
    setSelectedUserId(null);
    setSelectedUserDetails(null);
    setEditingUserId(null);
    setEditForm(null);
    setEditingCollectionId(null);
    setCollectionForm(null);
    setMessage("Admin logged out.");
  }

  function handleEditStart(user: AdminUser) {
    setEditingUserId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      city: user.city,
      phone: user.phone,
      role: user.role,
    });
    setMessage("");
  }

  function handleEditCancel() {
    setEditingUserId(null);
    setEditForm(null);
  }

  function updateEditField<K extends keyof EditUserForm>(key: K, value: EditUserForm[K]) {
    setEditForm((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, [key]: value };
    });
  }

  async function handleEditSave(userId: string) {
    if (!editForm) {
      return;
    }

    setSavingUserId(userId);
    try {
      const response = await fetchWithLoader(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = (await response.json()) as {
        message?: string;
        user?: Omit<
          AdminUser,
          "listedDressCount" | "collectionCount" | "activeRentalCount" | "totalTransactionAmount"
        >;
      };

      if (!response.ok || !data.user) {
        setMessage(data.message ?? "Failed to update user.");
        return;
      }

      setUsers((previous) =>
        previous.map((user) => {
          if (user._id !== userId) {
            return user;
          }
          return {
            ...user,
            ...data.user,
          };
        }),
      );

      if (selectedUserId === userId) {
        await loadUserDetails(userId);
      }

      setEditingUserId(null);
      setEditForm(null);
      setMessage(data.message ?? "User updated successfully.");
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Delete ${user.name} and all related dresses, collections, orders, and transactions?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingUserId(user._id);
    try {
      const response = await fetchWithLoader(`/api/admin/users/${user._id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(data.message ?? "Failed to delete user.");
        return;
      }

      setUsers((previous) => previous.filter((item) => item._id !== user._id));

      if (selectedUserId === user._id) {
        setSelectedUserId(null);
        setSelectedUserDetails(null);
      }
      if (editingUserId === user._id) {
        setEditingUserId(null);
        setEditForm(null);
      }
      if (selectedUserId === user._id) {
        setEditingCollectionId(null);
        setCollectionForm(null);
      }

      setMessage(data.message ?? "User deleted successfully.");
      await loadUsers();
    } finally {
      setDeletingUserId(null);
    }
  }

  function handleCollectionEditStart(collection: AdminCollection) {
    setEditingCollectionId(collection._id);
    setCollectionForm({
      title: collection.title,
      material: collection.material,
      category: collection.category,
      description: collection.description,
      imageUrl: collection.imageUrl,
    });
    setMessage("");
  }

  function handleCollectionEditCancel() {
    setEditingCollectionId(null);
    setCollectionForm(null);
  }

  function updateCollectionField<K extends keyof EditCollectionForm>(
    key: K,
    value: EditCollectionForm[K],
  ) {
    setCollectionForm((previous) => {
      if (!previous) {
        return previous;
      }
      return { ...previous, [key]: value };
    });
  }

  async function handleCollectionSave(collectionId: string) {
    if (!collectionForm || !selectedUserId) {
      return;
    }

    setSavingCollectionId(collectionId);
    try {
      const response = await fetchWithLoader(`/api/admin/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectionForm),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Failed to update collection.");
        return;
      }

      setMessage(data.message ?? "Collection updated successfully.");
      setEditingCollectionId(null);
      setCollectionForm(null);
      await loadUserDetails(selectedUserId);
      await loadUsers();
    } finally {
      setSavingCollectionId(null);
    }
  }

  async function handleCollectionDelete(collection: AdminCollection) {
    const confirmed = window.confirm(
      `Delete collection "${collection.title}" from ${collection.owner.name}?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingCollectionId(collection._id);
    try {
      const response = await fetchWithLoader(`/api/admin/collections/${collection._id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Failed to delete collection.");
        return;
      }

      setMessage(data.message ?? "Collection deleted successfully.");
      if (selectedUserId) {
        await loadUserDetails(selectedUserId);
      }
      await loadUsers();
    } finally {
      setDeletingCollectionId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingScene
          compact
          title="Loading admin panel"
          message="Syncing user and consumer details..."
        />
        <Card>
          <CardHeader>
            <CardTitle>Users & Consumer Details</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <AdminTableSkeleton rows={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Use the hardcoded credentials provided for this challenge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Username</span>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter Username"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Password</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter Password"
                  required
                />
              </label>
              <Button type="submit" className="w-full">
                Sign in as Admin
              </Button>
            </form>
            {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-300">
            Manage users, collections, edit/delete records, and inspect complete order & transaction history.
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Users & Consumer Details</CardTitle>
          <CardDescription>
            Click View to inspect complete user data. Use Edit/Delete to modify users and collections from UI.
          </CardDescription>
        </CardHeader>
        {usersLoading ? (
          <CardContent>
            <AdminTableSkeleton rows={6} />
          </CardContent>
        ) : (
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-300">
                  Search user
                </span>
                <Input
                  value={userSearch}
                  onChange={(event) => {
                    setUserSearch(event.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Name, email, city"
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-300">
                  Filter by role
                </span>
                <select
                  value={userRoleFilter}
                  onChange={(event) => {
                    setUserRoleFilter(event.target.value as "all" | "user" | "admin");
                    setUserPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                >
                  <option value="all">All roles</option>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-300">
                  Filter by city
                </span>
                <select
                  value={userCityFilter}
                  onChange={(event) => {
                    setUserCityFilter(event.target.value);
                    setUserPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                >
                  <option value="all">All cities</option>
                  {userCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Showing {paginatedUsers.length} of {filteredUsers.length} filtered users.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-300">
                    <th className="px-2 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">City</th>
                    <th className="px-2 py-2 font-medium">Phone</th>
                    <th className="px-2 py-2 font-medium">Listed Dresses</th>
                    <th className="px-2 py-2 font-medium">Collections</th>
                    <th className="px-2 py-2 font-medium">Active Rentals</th>
                    <th className="px-2 py-2 font-medium">Total Transactions</th>
                    <th className="px-2 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                  const isEditing = editingUserId === user._id && editForm;
                  const saving = savingUserId === user._id;
                  const deleting = deletingUserId === user._id;

                  return (
                    <tr
                      key={user._id}
                      className="border-b border-white/10"
                      aria-selected={selectedUserId === user._id}
                    >
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.name}
                              onChange={(event) => updateEditField("name", event.target.value)}
                            />
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(event) => updateEditField("email", event.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <select
                            className="h-9 w-28 rounded-xl border border-white/20 bg-slate-900/70 px-3 text-slate-100 outline-none"
                            value={editForm.role}
                            onChange={(event) =>
                              updateEditField("role", event.target.value as "user" | "admin")
                            }
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <Badge tone={user.role === "admin" ? "primary" : "neutral"}>
                            {user.role}
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <Input
                            value={editForm.city}
                            onChange={(event) => updateEditField("city", event.target.value)}
                          />
                        ) : (
                          user.city
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        {isEditing ? (
                          <Input
                            value={editForm.phone}
                            onChange={(event) => updateEditField("phone", event.target.value)}
                          />
                        ) : (
                          user.phone
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">{user.listedDressCount}</td>
                      <td className="px-2 py-2 align-top">{user.collectionCount}</td>
                      <td className="px-2 py-2 align-top">{user.activeRentalCount}</td>
                      <td className="px-2 py-2 align-top">
                        ₹{user.totalTransactionAmount.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadUserDetails(user._id)}
                            disabled={deleting}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEditSave(user._id)}
                                disabled={saving || deleting}
                              >
                                <Save className="mr-1 h-3.5 w-3.5" />
                                {saving ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleEditCancel}
                                disabled={saving || deleting}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditStart(user)}
                              disabled={deleting}
                            >
                              <PencilLine className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            disabled={saving || deleting}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td className="px-2 py-3 text-slate-400" colSpan={9}>
                        No users match the current search and filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                Page {currentUserPage} of {totalUserPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUserPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentUserPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setUserPage((previous) => Math.min(totalUserPages, previous + 1))
                  }
                  disabled={currentUserPage >= totalUserPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Data & Transactions</CardTitle>
          <CardDescription>
            Complete selected user profile, dresses, collections, orders, and transaction history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {detailsLoading ? (
            <LoadingScene compact title="Loading user details" message="Fetching full records..." />
          ) : selectedUserDetails ? (
            <>
              <div className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="font-medium text-white">{selectedUserDetails.user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-white">{selectedUserDetails.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">City</p>
                  <p className="font-medium text-white">{selectedUserDetails.user.city}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-white">{selectedUserDetails.user.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Listed Dresses</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="px-2 py-2">Title</th>
                        <th className="px-2 py-2">Brand</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2">City</th>
                        <th className="px-2 py-2">Rent/Day</th>
                        <th className="px-2 py-2">Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetails.listedDresses.length > 0 ? (
                        selectedUserDetails.listedDresses.map((dress) => (
                          <tr key={dress._id} className="border-b border-white/10">
                            <td className="px-2 py-2 text-white">{dress.title}</td>
                            <td className="px-2 py-2">{dress.brand}</td>
                            <td className="px-2 py-2">{dress.category}</td>
                            <td className="px-2 py-2">{dress.location.city}</td>
                            <td className="px-2 py-2">₹{dress.dailyRent.toLocaleString()}</td>
                            <td className="px-2 py-2">
                              <Badge tone={dress.isAvailable ? "success" : "warning"}>
                                {dress.isAvailable ? "available" : "not available"}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-2 py-3 text-slate-400" colSpan={6}>
                            No dresses listed by this user.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Collections</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <label>
                    <span className="mb-1 block text-sm font-medium text-slate-300">
                      Search collection
                    </span>
                    <Input
                      value={collectionSearch}
                      onChange={(event) => {
                        setCollectionSearch(event.target.value);
                        setCollectionPage(1);
                      }}
                      placeholder="Title, material, category"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-sm font-medium text-slate-300">
                      Filter by material
                    </span>
                    <select
                      value={collectionMaterialFilter}
                      onChange={(event) => {
                        setCollectionMaterialFilter(event.target.value);
                        setCollectionPage(1);
                      }}
                      className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                    >
                      <option value="all">All materials</option>
                      {collectionMaterials.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-sm font-medium text-slate-300">
                      Filter by category
                    </span>
                    <select
                      value={collectionCategoryFilter}
                      onChange={(event) => {
                        setCollectionCategoryFilter(event.target.value);
                        setCollectionPage(1);
                      }}
                      className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                    >
                      <option value="all">All categories</option>
                      {collectionCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  Showing {paginatedCollections.length} of {filteredCollections.length} filtered
                  collections.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="px-2 py-2">Title</th>
                        <th className="px-2 py-2">Material</th>
                        <th className="px-2 py-2">Category</th>
                        <th className="px-2 py-2">Description</th>
                        <th className="px-2 py-2">Image</th>
                        <th className="px-2 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCollections.length > 0 ? (
                        paginatedCollections.map((collection) => {
                          const isEditingCollection =
                            editingCollectionId === collection._id && collectionForm;
                          const savingCollection = savingCollectionId === collection._id;
                          const deletingCollection = deletingCollectionId === collection._id;

                          return (
                            <tr key={collection._id} className="border-b border-white/10">
                              <td className="px-2 py-2 align-top">
                                {isEditingCollection ? (
                                  <Input
                                    value={collectionForm.title}
                                    onChange={(event) =>
                                      updateCollectionField("title", event.target.value)
                                    }
                                  />
                                ) : (
                                  <p className="text-white">{collection.title}</p>
                                )}
                              </td>
                              <td className="px-2 py-2 align-top">
                                {isEditingCollection ? (
                                  <Input
                                    value={collectionForm.material}
                                    onChange={(event) =>
                                      updateCollectionField("material", event.target.value)
                                    }
                                  />
                                ) : (
                                  collection.material
                                )}
                              </td>
                              <td className="px-2 py-2 align-top">
                                {isEditingCollection ? (
                                  <Input
                                    value={collectionForm.category}
                                    onChange={(event) =>
                                      updateCollectionField("category", event.target.value)
                                    }
                                  />
                                ) : (
                                  collection.category
                                )}
                              </td>
                              <td className="px-2 py-2 align-top">
                                {isEditingCollection ? (
                                  <textarea
                                    className="w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                                    rows={3}
                                    value={collectionForm.description}
                                    onChange={(event) =>
                                      updateCollectionField("description", event.target.value)
                                    }
                                  />
                                ) : (
                                  <p className="line-clamp-2 max-w-xs">{collection.description}</p>
                                )}
                              </td>
                              <td className="px-2 py-2 align-top">
                                {isEditingCollection ? (
                                  <Input
                                    value={collectionForm.imageUrl}
                                    onChange={(event) =>
                                      updateCollectionField("imageUrl", event.target.value)
                                    }
                                  />
                                ) : (
                                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={collection.imageUrl}
                                      alt={collection.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 align-top">
                                <div className="flex flex-wrap gap-2">
                                  {isEditingCollection ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleCollectionSave(collection._id)}
                                        disabled={savingCollection || deletingCollection}
                                      >
                                        <Save className="mr-1 h-3.5 w-3.5" />
                                        {savingCollection ? "Saving..." : "Save"}
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCollectionEditCancel}
                                        disabled={savingCollection || deletingCollection}
                                      >
                                        <X className="mr-1 h-3.5 w-3.5" />
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleCollectionEditStart(collection)}
                                      disabled={deletingCollection}
                                    >
                                      <PencilLine className="mr-1 h-3.5 w-3.5" />
                                      Edit
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCollectionDelete(collection)}
                                    disabled={savingCollection || deletingCollection}
                                  >
                                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                                    {deletingCollection ? "Deleting..." : "Delete"}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-2 py-3 text-slate-400" colSpan={6}>
                            No collections match the current search and filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Page {currentCollectionPage} of {totalCollectionPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setCollectionPage((previous) => Math.max(1, previous - 1))
                      }
                      disabled={currentCollectionPage <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setCollectionPage((previous) =>
                          Math.min(totalCollectionPages, previous + 1),
                        )
                      }
                      disabled={currentCollectionPage >= totalCollectionPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="px-2 py-2">Dress</th>
                        <th className="px-2 py-2">Renter</th>
                        <th className="px-2 py-2">Owner</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Payment</th>
                        <th className="px-2 py-2">Amount</th>
                        <th className="px-2 py-2">Tracking City</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetails.orders.length > 0 ? (
                        selectedUserDetails.orders.map((order) => (
                          <tr key={order._id} className="border-b border-white/10">
                            <td className="px-2 py-2 text-white">{order.dress?.title ?? "—"}</td>
                            <td className="px-2 py-2">{order.renter?.name ?? "—"}</td>
                            <td className="px-2 py-2">{order.owner?.name ?? "—"}</td>
                            <td className="px-2 py-2">
                              <Badge tone={getOrderStatusTone(order.orderStatus)}>
                                {order.orderStatus}
                              </Badge>
                            </td>
                            <td className="px-2 py-2">
                              <Badge tone={getPaymentStatusTone(order.paymentStatus)}>
                                {order.paymentStatus}
                              </Badge>
                            </td>
                            <td className="px-2 py-2">₹{order.totalAmount.toLocaleString()}</td>
                            <td className="px-2 py-2">{order.trackingCity}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-2 py-3 text-slate-400" colSpan={7}>
                            No orders for this user.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white">Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-300">
                        <th className="px-2 py-2">Merchant Txn Id</th>
                        <th className="px-2 py-2">Order</th>
                        <th className="px-2 py-2">Amount</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Mode</th>
                        <th className="px-2 py-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserDetails.transactions.length > 0 ? (
                        selectedUserDetails.transactions.map((transaction) => (
                          <tr key={transaction._id} className="border-b border-white/10">
                            <td className="px-2 py-2 text-white">
                              {transaction.merchantTransactionId}
                            </td>
                            <td className="px-2 py-2">
                              {transaction.order?.dress?.title ?? transaction.order?._id ?? "—"}
                            </td>
                            <td className="px-2 py-2">
                              ₹{transaction.amount.toLocaleString()} {transaction.currency}
                            </td>
                            <td className="px-2 py-2">
                              <Badge tone={getTransactionStatusTone(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </td>
                            <td className="px-2 py-2">
                              <Badge tone={transaction.simulated ? "warning" : "success"}>
                                {transaction.simulated ? "mock" : "real"}
                              </Badge>
                            </td>
                            <td className="px-2 py-2">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-2 py-3 text-slate-400" colSpan={6}>
                            No transactions for this user.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Select a user from the table to view full data and transactions.
            </p>
          )}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
