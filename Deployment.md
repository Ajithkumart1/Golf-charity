# 🚀 Deployment Guide — GreenGive Golf Charity Platform

## Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Vercel](https://vercel.com) account

---

## Step 1 — Supabase Setup

### 1.1 Create Project
1. Go to [app.supabase.com](https://app.supabase.com) → **New Project**
2. Note your **Project URL** and **API keys** (Settings → API)

### 1.2 Run Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Paste and run the entire contents of `supabase/schema.sql`
3. Verify all tables appear in **Table Editor**

### 1.3 Create Storage Bucket
1. Go to **Storage** → **New Bucket**
2. Name: `proof-uploads`
3. Set to **Public** (or configure RLS for private)
4. Add a policy allowing authenticated users to upload

### 1.4 Configure Auth
1. **Authentication** → **Settings** → **Site URL**: set to your Vercel domain
2. **Email Auth** should be enabled by default
3. (Optional) Add social providers

### 1.5 Create Database Functions
Run this SQL for charity donation tracking:
```sql
CREATE OR REPLACE FUNCTION increment_charity_raised(charity_id_param UUID, amount_param NUMERIC)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charities
  SET total_raised = total_raised + amount_param
  WHERE id = charity_id_param;
END;
$$;
```

---

## Step 2 — Stripe Setup

### 2.1 Create Products & Prices
In Stripe Dashboard → **Products** → **Add Product**:

**Monthly Plan:**
- Name: GreenGive Monthly
- Price: £9.99 / month (recurring)
- Note the **Price ID** (e.g. `price_abc123`)

**Yearly Plan:**
- Name: GreenGive Yearly  
- Price: £99.99 / year (recurring)
- Note the **Price ID**

### 2.2 Configure Webhook
1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Note the **Webhook Signing Secret** (`whsec_…`)

### 2.3 Enable Customer Portal
Stripe Dashboard → **Settings** → **Billing** → **Customer portal** → Enable

---

## Step 3 — Local Development

### 3.1 Clone & Install
```bash
git clone <your-repo-url>
cd golf-charity-platform
npm install
npm install --workspace=client
npm install --workspace=server
```

### 3.2 Configure Environment Variables

**Server** (`server/.env`):
```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

JWT_SECRET=your-min-32-character-secret-key-here
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

SUPABASE_PROOF_BUCKET=proof-uploads
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3.3 Run Development Servers
```bash
# Root (runs both concurrently)
npm run dev

# OR individually:
cd server && npm run dev     # API on :3001
cd client && npm run dev     # Frontend on :5173
```

### 3.4 Test Stripe Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

## Step 4 — Deploy to Vercel

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/golf-charity-platform.git
git push -u origin main
```

### 4.2 Create Vercel Project
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. **Framework Preset**: Other
4. **Root Directory**: Leave as root
5. **Build Command**: `npm run build --workspace=client`
6. **Output Directory**: `client/dist`
7. **Install Command**: `npm install && npm install --workspace=client && npm install --workspace=server`

### 4.3 Set Environment Variables in Vercel
Go to Project → **Settings** → **Environment Variables** and add:

```
NODE_ENV=production
CLIENT_URL=https://your-project.vercel.app

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

JWT_SECRET=your-production-secret-min-32-chars
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

SUPABASE_PROOF_BUCKET=proof-uploads

VITE_API_URL=https://your-project.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4.4 Deploy
Click **Deploy**. Vercel will build and deploy automatically.

### 4.5 Update Stripe Webhook URL
After deployment, update your Stripe webhook endpoint to:
`https://your-actual-vercel-domain.vercel.app/api/stripe/webhook`

### 4.6 Update Supabase Auth URL
In Supabase → Authentication → Settings → **Site URL**:
`https://your-actual-vercel-domain.vercel.app`

---

## Step 5 — Create First Admin User

1. Register normally at `/register`
2. In Supabase SQL Editor, run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```
3. Log out and back in — you'll now see the Admin Panel

---

## Architecture Overview

```
golf-charity-platform/
├── client/                     # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx             # Routes
│   │   ├── context/
│   │   │   └── AuthContext.jsx # JWT auth state
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── PricingPage.jsx
│   │   │   ├── CharitiesPage.jsx
│   │   │   ├── CharityDetailPage.jsx
│   │   │   ├── DrawsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── ScoresPage.jsx
│   │   │   │   ├── MyCharityPage.jsx
│   │   │   │   ├── MyDrawsPage.jsx
│   │   │   │   ├── WinningsPage.jsx
│   │   │   │   └── SubscriptionPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminUserDetail.jsx
│   │   │       ├── AdminSubscriptions.jsx
│   │   │       ├── AdminCharities.jsx
│   │   │       ├── AdminDraws.jsx
│   │   │       ├── AdminWinners.jsx
│   │   │       └── AdminReports.jsx
│   │   └── lib/
│   │       └── api.js          # Axios instance with JWT
│   └── ...config files
│
├── server/                     # Node.js + Express API
│   └── src/
│       ├── index.js            # Express app
│       ├── config/
│       │   ├── supabase.js
│       │   └── stripe.js
│       ├── middleware/
│       │   ├── auth.js         # JWT + subscription check
│       │   └── validate.js
│       ├── routes/             # All API routes
│       ├── controllers/        # Business logic
│       └── services/
│           └── drawEngine.js   # Draw & prize logic
│
├── supabase/
│   └── schema.sql              # Full DB schema with RLS
│
├── vercel.json                 # Deployment config
└── package.json                # Workspace root
```

---

## Security Checklist
- [ ] JWT_SECRET is at least 32 random characters
- [ ] Using `sk_live_` Stripe keys in production
- [ ] Supabase RLS policies are active
- [ ] Stripe webhook signature verification enabled
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] File upload restricted to image/PDF, max 5MB
- [ ] Rate limiting active on all API routes
- [ ] Admin role only set manually via SQL
- [ ] All sensitive keys in Vercel env vars (never committed)

---

## Maintenance

### Running Monthly Draws
1. Log in as Admin → **Draw Engine**
2. Create draw for current month
3. Click **Simulate** to preview results
4. Review prize pool breakdown
5. Click **Publish** to finalise and assign winners

### Verifying Winners
1. Admin → **Winners** → filter by "Pending"
2. Review uploaded proof screenshot
3. Click **Approve** or **Reject** with notes
4. After approval, click **Mark as Paid** once transferred

### Monitoring
- Stripe Dashboard: payment health, failed charges
- Supabase Dashboard: database size, API usage
- Vercel Dashboard: function logs, performance