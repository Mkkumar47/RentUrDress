# RentUrDress

Peer-to-peer dress rental marketplace built with Next.js App Router, MongoDB, Mongoose, and Tailwind CSS.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Update `.env.local`:
   - `MONGODB_URI` with your MongoDB connection string
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` for Google login

4. Seed database (wipes existing collections and inserts demo data):

```bash
npm run seed
```

5. Start development server:

```bash
npm run dev
```

Open http://localhost:3000

> Login is mandatory before accessing app pages (`/`, `/dashboard`, `/collections`, `/profile`).
> Navigation menu is role-based: `user` sees Home/Dashboard/Collections/Profile, `admin` also sees Admin.

## Demo Login

- Admin seeded user: `mani@renturdress.com` / `Mani@123`
- Normal seeded users: any seeded email / `Rent@123`
- Google login: use the login page One Tap/button after setting Google client IDs.

## Backend Endpoints (Next.js Route Handlers)

All backend APIs live in `app/api/**/route.ts`:

- `GET /api/dresses` - list dresses with optional `search` and `location` filters.
- `GET /api/users` - list users.
- `GET /api/profile/:userId` - profile data (listed dresses, collections, active orders, transactions).
- `GET /api/profile/me` - authenticated profile data for current user.
- `GET /api/collections` - list all public user collections/materials.
- `POST /api/collections` - create your collection with image upload/URL.
- `PATCH /api/collections/:collectionId` - owner/admin updates a collection.
- `DELETE /api/collections/:collectionId` - owner/admin deletes a collection.
- `POST /api/auth/login` - JWT login for normal users.
- `POST /api/auth/google` - Google One Tap / Google button login with auto sign-up.
- `POST /api/auth/logout` - clears user auth cookie.
- `GET /api/auth/me` - current logged-in user session.
- `POST /api/admin/login` - hardcoded admin login (`mani` / `Mani@123`).
- `POST /api/admin/logout` - clears admin session cookie.
- `GET /api/admin/me` - checks admin authentication.
- `GET /api/admin/users` - admin-only user/consumer management data.
- `GET /api/admin/users/:userId` - full user data (dresses, collections, all orders, transactions).
- `PATCH /api/admin/users/:userId` - admin edits user details/role from UI.
- `DELETE /api/admin/users/:userId` - admin deletes user with related dresses/orders/transactions.
- `PATCH /api/admin/collections/:collectionId` - admin edits any user collection.
- `DELETE /api/admin/collections/:collectionId` - admin deletes any user collection.
- `POST /api/checkout/phonepe` - checkout route supporting:
  - `mode: "mock"` for free simulated test flow
  - `mode: "real"` for signed PhonePe initiation request
- `GET /api/checkout/phonepe/status?merchantTransactionId=...` - verify real PhonePe transaction status and sync order state.
- `POST /api/checkout/phonepe/callback` - callback receiver endpoint.

> If you come from FastAPI: treat each `app/api/**/route.ts` file like a backend router module.  
> `export async function GET/POST/...` are your backend handlers, and they run server-side.

## Seed Data

Seed source file: `data/seed.json`.

Seed script: `scripts/seed.js` hashes user passwords and inserts `User`, `Dress`, `Order`, `Transaction`, and `Collection` data.
