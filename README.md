# Inch Autos – China Purchase Tracker

A private web app for tracking everything about buying products from China:
suppliers, purchase orders, shipments, landed costs, problems/claims — plus
an **AI Import** page where you upload a screenshot and it fills in the
details for you.

This is a completely separate project from your Shopify store.

---

## 1. What's already built

- Full database schema (Supabase/Postgres) — `supabase/migrations/0001_init.sql`
- Next.js app with login (Supabase Auth)
- Suppliers, Products, Purchase Orders, Shipments, Problems/Claims — full CRUD
- **AI Import**: upload screenshots/photos → Claude reads them → you confirm → saved
- Landed cost calculator (allocate freight/customs by value, quantity, weight or CBM)
- Dashboard with a "Needs Attention" section
- Search across suppliers/products/orders/shipments
- CSV export (opens in Excel) for suppliers, products, orders, shipments
- Attachments (screenshots, photos, invoices) on every record, stored privately in Supabase Storage
- Black / white / gold theme, works on laptop and phone

**Not built yet** (told you so it's not a surprise): PDF report export, and
partial-quantity shipment splitting (right now a purchase order is
consolidated into a shipment as a whole). Both can be added later if you
want them.

---

## 2. One-time setup (do this once)

### Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign up / log in.
2. Click **New Project**.
3. Give it a name, e.g. `inch-autos-tracker`, pick a region close to Ireland
   (e.g. `eu-west-1`), set a database password (save it somewhere safe).
4. Wait ~2 minutes for it to finish setting up.

### Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/0001_init.sql` from this project, copy
   **all** of its contents, and paste into the SQL editor.
4. Click **Run**. You should see "Success. No rows returned."
   This creates all 10 tables, the views, security rules, and a private
   storage bucket called `attachments`.

### Step 3 — Get your Supabase API keys

1. In Supabase, click **Settings** (gear icon) → **API**.
2. Copy these three values, you'll need them in Step 5:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this one secret, never share it)

### Step 4 — Create your login

1. In Supabase, click **Authentication** → **Users** → **Add user**.
2. Enter your email and a password. Untick "Auto Confirm" only if you want
   to verify by email — otherwise leave it ticked so you can log in
   immediately.
3. This is the email/password you'll use to log into the app.

### Step 5 — Get an Anthropic API key (for AI Import)

1. Go to https://console.anthropic.com and sign up / log in.
2. Go to **Settings → API Keys → Create Key**.
3. Copy the key (starts with `sk-ant-...`). You'll add a small amount of
   credit to your Anthropic account to pay for usage — reading a few
   screenshots costs a fraction of a cent each.

---

## 3. Deploy to Vercel (recommended — no computer setup needed)

1. Push this project to a GitHub repository (already done if you're reading
   this from the repo).
2. Go to https://vercel.com, sign up/log in with GitHub.
3. Click **Add New → Project**, choose this repository (`importflow`).
4. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `ANTHROPIC_API_KEY` | your Anthropic API key |

5. Click **Deploy**. After a minute or two you'll get a live URL like
   `https://importflow.vercel.app`.
6. Open it, log in with the email/password you created in Step 4.

That's it — the app is live and usable from your laptop or your Samsung phone.

---

## 4. Running it on your own computer (optional, for development)

You only need this if you want to make changes yourself later.

1. Install [Node.js](https://nodejs.org) (LTS version).
2. In a terminal, inside this project folder:
   ```
   npm install
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and fill in the same 4 values from Step 3 above.
4. Run:
   ```
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.

---

## 5. How AI Import works

1. Go to **AI Import** in the left menu.
2. Upload one or more screenshots or photos (1688, Alibaba, WeChat chats,
   tracking screenshots, invoices, packing lists — anything).
3. Click **Extract with AI**. Claude reads the images and fills in a form:
   supplier, products, quantities, prices, order number, tracking number,
   shipping details, dates, and any costs it can find.
4. Check the form — it shows if it matched an existing supplier, product,
   order or shipment (so it updates instead of duplicating). Fix anything
   that's wrong.
5. Click **Confirm and Save**. It writes everything to the database and
   attaches your original screenshots to the order.

If you later upload a new tracking screenshot for the same order number or
tracking number, it will find the matching order/shipment and offer to
update it instead of creating a new one.

---

## 6. Project structure (for reference)

```
supabase/migrations/0001_init.sql   -- database schema, run this in Supabase
src/app/(app)/...                   -- pages (dashboard, suppliers, orders, etc.)
src/app/api/...                     -- API routes
src/components/...                  -- reusable UI pieces
src/lib/supabase/...                -- Supabase client setup
src/lib/utils/landed-cost.ts        -- true landed cost calculation
```
