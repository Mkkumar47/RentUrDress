"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { PencilLine, Save, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingScene } from "@/components/ui/loading-scene";
import { fetchWithLoader } from "@/lib/client-api";
import { ApiCollection, ApiUser } from "@/types/api";

const ITEMS_PER_PAGE = 15;

type CollectionsResponse = {
  collections: ApiCollection[];
};

type CollectionFormState = {
  title: string;
  material: string;
  category: string;
  description: string;
  imageUrl: string;
};

type AuthMeResponse = {
  authenticated: boolean;
  user: ApiUser | null;
};

const initialFormState: CollectionFormState = {
  title: "",
  material: "",
  category: "",
  description: "",
  imageUrl: "",
};

export function CollectionsClient() {
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CollectionFormState>(initialFormState);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingCollectionId, setSavingCollectionId] = useState<string | null>(null);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [materialFilter, setMaterialFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const isAdmin = currentUser?.role === "admin";

  async function loadCollections() {
    const [authResponse, collectionsResponse] = await Promise.all([
      fetchWithLoader("/api/auth/me", { cache: "no-store" }),
      fetchWithLoader("/api/collections", { cache: "no-store" }),
    ]);

    const authData = (await authResponse.json()) as AuthMeResponse;
    const collectionsData = (await collectionsResponse.json()) as CollectionsResponse;
    setCurrentUser(authData.user);
    setCollections(collectionsData.collections ?? []);
  }

  useEffect(() => {
    let active = true;

    async function initializeCollections() {
      const [authResponse, collectionsResponse] = await Promise.all([
        fetchWithLoader("/api/auth/me", { cache: "no-store" }),
        fetchWithLoader("/api/collections", { cache: "no-store" }),
      ]);

      const authData = (await authResponse.json()) as AuthMeResponse;
      const collectionsData = (await collectionsResponse.json()) as CollectionsResponse;

      if (!active) {
        return;
      }

      setCurrentUser(authData.user);
      setCollections(collectionsData.collections ?? []);
      setLoading(false);
    }

    initializeCollections().catch(() => {
      if (!active) {
        return;
      }
      setMessage("Unable to load collections right now.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  function handleImageFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setForm((previous) => ({ ...previous, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  function updateForm<K extends keyof CollectionFormState>(key: K, value: CollectionFormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleEdit(collection: ApiCollection) {
    setEditingCollectionId(collection._id);
    setForm({
      title: collection.title,
      material: collection.material,
      category: collection.category,
      description: collection.description,
      imageUrl: collection.imageUrl,
    });
    setMessage("");
  }

  function resetForm() {
    setForm(initialFormState);
    setEditingCollectionId(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    const endpoint = editingCollectionId
      ? `/api/collections/${editingCollectionId}`
      : "/api/collections";
    const method = editingCollectionId ? "PATCH" : "POST";

    const response = await fetchWithLoader(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "Failed to save collection.");
      setSubmitting(false);
      return;
    }

    await loadCollections();
    resetForm();
    setMessage(data.message ?? "Collection saved.");
    setSubmitting(false);
  }

  async function handleDelete(collection: ApiCollection) {
    const confirmed = window.confirm(`Delete collection "${collection.title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingCollectionId(collection._id);
    const endpoint = isAdmin ? `/api/admin/collections/${collection._id}` : `/api/collections/${collection._id}`;
    const response = await fetchWithLoader(endpoint, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setMessage(data.message ?? "Failed to delete collection.");
      setDeletingCollectionId(null);
      return;
    }

    await loadCollections();
    setMessage(data.message ?? "Collection deleted.");
    setDeletingCollectionId(null);
  }

  async function handleAdminSave(collectionId: string) {
    setSavingCollectionId(collectionId);
    const response = await fetchWithLoader(`/api/admin/collections/${collectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(data.message ?? "Failed to update collection.");
      setSavingCollectionId(null);
      return;
    }

    await loadCollections();
    resetForm();
    setMessage(data.message ?? "Collection updated.");
    setSavingCollectionId(null);
  }

  const groupedStats = useMemo(() => {
    return collections.reduce<Record<string, number>>((acc, collection) => {
      acc[collection.material] = (acc[collection.material] ?? 0) + 1;
      return acc;
    }, {});
  }, [collections]);

  const materials = useMemo(() => {
    const materialSet = new Set(collections.map((collection) => collection.material));
    return Array.from(materialSet).sort();
  }, [collections]);

  const categories = useMemo(() => {
    const categorySet = new Set(collections.map((collection) => collection.category));
    return Array.from(categorySet).sort();
  }, [collections]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const matchesSearch =
        !normalizedSearch ||
        collection.title.toLowerCase().includes(normalizedSearch) ||
        collection.material.toLowerCase().includes(normalizedSearch) ||
        collection.category.toLowerCase().includes(normalizedSearch) ||
        collection.description.toLowerCase().includes(normalizedSearch) ||
        collection.owner.name.toLowerCase().includes(normalizedSearch) ||
        collection.owner.city.toLowerCase().includes(normalizedSearch);
      const matchesMaterial = materialFilter === "all" || collection.material === materialFilter;
      const matchesCategory = categoryFilter === "all" || collection.category === categoryFilter;
      return matchesSearch && matchesMaterial && matchesCategory;
    });
  }, [categoryFilter, collections, materialFilter, normalizedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCollections.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCollections.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredCollections]);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingScene title="Loading collections" message="Fetching community materials..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Community Collections</h1>
        <p className="text-slate-300">
          Upload your materials and curated dress collections. Every collection is visible to all users.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{editingCollectionId ? "Edit Collection" : "Add New Collection"}</CardTitle>
          <CardDescription>
            Add title, material, image and description to publish your collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-300">Title</span>
                <Input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  required
                />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-300">Material</span>
                <Input
                  value={form.material}
                  onChange={(event) => updateForm("material", event.target.value)}
                  placeholder="Silk, Chiffon, Velvet..."
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">Category</span>
              <Input
                value={form.category}
                onChange={(event) => updateForm("category", event.target.value)}
                placeholder="Bridal, Partywear, Festive..."
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-300">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-300">Image URL</span>
                <Input
                  value={form.imageUrl}
                  onChange={(event) => updateForm("imageUrl", event.target.value)}
                  placeholder="https://... or upload a file below"
                  required
                />
              </label>
              <label className="flex items-end">
                <span className="sr-only">Upload image file</span>
                <Input type="file" accept="image/*" onChange={handleImageFileUpload} />
              </label>
            </div>

            {form.imageUrl ? (
              <div className="w-full max-w-xs overflow-hidden rounded-xl border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="Collection preview" className="h-40 w-full object-cover" />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {editingCollectionId && isAdmin ? (
                <Button
                  type="button"
                  onClick={() => handleAdminSave(editingCollectionId)}
                  disabled={savingCollectionId === editingCollectionId}
                >
                  <Save className="mr-1 h-4 w-4" />
                  {savingCollectionId === editingCollectionId ? "Saving..." : "Save as Admin"}
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  <Upload className="mr-1 h-4 w-4" />
                  {submitting
                    ? "Saving..."
                    : editingCollectionId
                      ? "Update Collection"
                      : "Publish Collection"}
                </Button>
              )}

              {editingCollectionId ? (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-wrap gap-2">
        {Object.entries(groupedStats).map(([material, count]) => (
          <Badge key={material} tone="primary">
            {material}: {count}
          </Badge>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Explore collections with search and filters, 15 items per page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-300">Search</span>
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Title, material, owner, city..."
              />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium text-slate-300">
                Filter by material
              </span>
              <select
                value={materialFilter}
                onChange={(event) => {
                  setMaterialFilter(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
              >
                <option value="all">All materials</option>
                {materials.map((material) => (
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
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/55 px-3 text-sm text-slate-100 outline-none focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400/35"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
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
        </CardContent>
      </Card>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {paginatedCollections.map((collection) => {
          const isOwner = collection.owner._id === currentUser?._id;
          const canManage = isOwner || isAdmin;

          return (
            <Card key={collection._id}>
              <CardContent className="space-y-3 pt-5">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collection.imageUrl}
                    alt={collection.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white">{collection.title}</h2>
                  <p className="text-xs text-slate-400">
                    by {collection.owner.name} • {collection.owner.city}
                  </p>
                  <p className="text-sm text-slate-200">
                    {collection.material} • {collection.category}
                  </p>
                </div>

                <p className="text-sm text-slate-300">{collection.description}</p>

                {canManage ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(collection)}>
                      <PencilLine className="mr-1 h-3.5 w-3.5" />
                      {isAdmin && !isOwner ? "Admin Edit" : "Edit"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(collection)}
                      disabled={deletingCollectionId === collection._id}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      {deletingCollectionId === collection._id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
        {paginatedCollections.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="pt-5 text-sm text-slate-300">
              No collections found for the current search and filters.
            </CardContent>
          </Card>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
