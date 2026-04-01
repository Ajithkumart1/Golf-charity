# Golf Charity Platform — Complete Folder Structure

```
golf-charity-platform/
│
├── package.json                          # Root workspace config
├── vercel.json                           # Vercel deployment config
├── README.md
├── DEPLOYMENT.md                         # Full deployment guide
│
├── supabase/
│   └── schema.sql                        # All tables, RLS, triggers, seed data
│
├── server/                               # Node.js + Express API
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                      # Express app entry, all middleware
│       ├── config/
│       │   ├── supabase.js               # Supabase service-role client
│       │   └── stripe.js                 # Stripe client
│       ├── middleware/
│       │   ├── auth.js                   # authenticate, requireActiveSubscription, requireAdmin
│       │   └── validate.js               # express-validator error handler
│       ├── routes/
│       │   ├── auth.js                   # POST /register, /login, /refresh, /logout
│       │   ├── users.js                  # GET /me, PATCH /me, GET /me/dashboard
│       │   ├── scores.js                 # GET, POST, DELETE scores
│       │   ├── subscriptions.js          # GET /my, POST /cancel
│       │   ├── charities.js              # Full CRUD (admin) + public read
│       │   ├── draws.js                  # List, get, create, simulate, publish
│       │   ├── winners.js                # My winnings, proof upload, admin verify/pay
│       │   ├── admin.js                  # Admin-only user/sub management + reports
│       │   └── stripe.js                 # Checkout, portal, webhook
│       ├── controllers/
│       │   ├── authController.js         # Register, login, refresh, forgot-password
│       │   ├── usersController.js        # Profile, dashboard aggregation
│       │   ├── scoresController.js       # Add/delete scores (trigger enforces max 5)
│       │   ├── subscriptionsController.js # Get/cancel subscription
│       │   ├── charitiesController.js    # CRUD + search/filter
│       │   ├── drawsController.js        # Create, simulate, publish draws
│       │   ├── winnersController.js      # Proof upload, verify, mark paid
│       │   ├── adminController.js        # User mgmt, score editing, reports
│       │   └── stripeController.js       # Checkout, portal, webhook handler
│       └── services/
│           └── drawEngine.js             # randomDraw, algorithmicDraw, processDraw,
│                                         # computePrizePool, assignPrizes
│
└── client/                               # React + Vite + Tailwind frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx                      # React entry, BrowserRouter, Toaster
        ├── App.jsx                       # All routes (public, dashboard, admin)
        ├── index.css                     # Tailwind + custom component classes
        ├── context/
        │   └── AuthContext.jsx           # JWT state, login/register/logout
        ├── lib/
        │   └── api.js                    # Axios instance with JWT interceptors
        ├── layouts/
        │   ├── PublicLayout.jsx          # Navbar + footer
        │   ├── DashboardLayout.jsx       # Sidebar navigation for subscribers
        │   └── AdminLayout.jsx           # Sidebar navigation for admins
        └── pages/
            ├── HomePage.jsx              # Hero, stats, how-it-works, CTA
            ├── PricingPage.jsx           # Monthly/Yearly plans + Stripe checkout
            ├── CharitiesPage.jsx         # Search + filter charity listing
            ├── CharityDetailPage.jsx     # Charity profile + donation widget
            ├── DrawsPage.jsx             # Public draw history + prize breakdown
            ├── LoginPage.jsx             # JWT login form
            ├── RegisterPage.jsx          # 3-step registration with charity picker
            ├── NotFoundPage.jsx          # 404
            ├── dashboard/
            │   ├── DashboardPage.jsx     # Overview: scores, charity, draw result
            │   ├── ScoresPage.jsx        # Add/delete Stableford scores
            │   ├── MyCharityPage.jsx     # Change charity + percentage slider
            │   ├── MyDrawsPage.jsx       # Draw history + match visualization
            │   ├── WinningsPage.jsx      # Winnings + proof upload workflow
            │   └── SubscriptionPage.jsx  # Plan info, Stripe portal, cancel
            └── admin/
                ├── AdminDashboard.jsx    # KPI cards + quick actions
                ├── AdminUsers.jsx        # User table with search
                ├── AdminUserDetail.jsx   # Edit user, manage scores
                ├── AdminSubscriptions.jsx # Sub management + status override
                ├── AdminCharities.jsx    # Add/edit/deactivate charities
                ├── AdminDraws.jsx        # Create/simulate/publish draws
                ├── AdminWinners.jsx      # Verify proof, approve/reject, mark paid
                └── AdminReports.jsx      # Prize pools, charity totals, draw stats
```

## Key Data Flows

### Subscription Flow
```
User registers → Stripe Checkout → Webhook fires → subscription row created
→ User gains access to scores/draws
```

### Score → Draw Flow
```
User adds score (1-45) → Trigger keeps max 5 per user
→ Admin runs monthly draw → drawEngine generates 5 numbers
→ processDraw compares each subscriber's scores to drawn numbers
→ Winners assigned prize tiers → Winners upload proof
→ Admin verifies → Admin marks paid
```

### Prize Pool Calculation
```
Active subscriptions revenue
- charity amounts
+ rollover from previous month (if no 5-match winner)
= total prize pool

40% → 5-match pot (or rollover to next month)
35% → 4-match pot
25% → 3-match pot
```

## Environment Variables Summary

### Server
| Variable | Description |
|---|---|
| `PORT` | Server port (default 3001) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Frontend URL for CORS |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) |
| `SUPABASE_ANON_KEY` | Public anon key |
| `JWT_SECRET` | Min 32 chars, random |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `STRIPE_SECRET_KEY` | `sk_test_` or `sk_live_` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe |
| `STRIPE_MONTHLY_PRICE_ID` | `price_...` for monthly plan |
| `STRIPE_YEARLY_PRICE_ID` | `price_...` for yearly plan |
| `SUPABASE_PROOF_BUCKET` | Storage bucket name |

### Client
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_` or `pk_live_` |