# GolfGive — Full-Stack Platform

A subscription-driven golf performance tracking platform with monthly prize draws and charity giving.

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Framework  | Next.js 14 (App Router)     |
| Database   | Supabase (Postgres + Auth)  |
| Payments   | Stripe                      |
| Styling    | Tailwind CSS                |
| Deployment | Vercel                      |

---

## Project Structure

```
src/
├── app/
│   ├── page.js                        # Homepage
│   ├── auth/
│   │   ├── login/page.js             # Login
│   │   └── signup/page.js            # Signup + plan selection
│   ├── dashboard/page.js             # User dashboard
│   ├── admin/page.js                 # Admin dashboard
│   └── api/
│       ├── auth/
│       │   ├── callback/route.js     # Supabase OAuth callback
│       │   └── signout/route.js      # Sign out
│       ├── scores/route.js           # POST/DELETE scores
│       ├── subscriptions/
│       │   ├── checkout/route.js     # Stripe checkout session
│       │   ├── portal/route.js       # Stripe billing portal
│       │   └── webhook/route.js      # Stripe webhook handler
│       ├── winners/
│       │   └── proof/route.js        # Upload winner proof
│       └── admin/
│           ├── draws/run/route.js    # Run/simulate draw
│           ├── users/route.js        # Manage users
│           ├── winners/route.js      # Verify/pay winners
│           └── charities/route.js   # CRUD charities
├── components/
│   ├── ScoreManager.js              # Score entry UI
│   ├── SubscriptionCard.js          # Subscription status
│   ├── DrawResults.js               # Draw outcome display
│   ├── WinnersCard.js               # User winnings
│   └── admin/
│       ├── AdminDraw.js             # Draw management
│       ├── AdminUsers.js            # User management
│       ├── AdminWinners.js          # Winner verification
│       └── AdminCharities.js        # Charity CRUD
├── lib/
│   ├── supabase.js                  # Supabase clients
│   ├── stripe.js                    # Stripe client + helpers
│   └── draw.js                      # Draw engine (random + algorithmic)
supabase/
└── schema.sql                        # Full DB schema + RLS + seed
```

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd golf-platform
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of `supabase/schema.sql`
3. In **Storage**, create a bucket named `winner-proofs` and set it to **public**
4. In **Authentication → URL Configuration**, add your app URL to allowed redirect URLs:
   - `http://localhost:3000/**`
   - `https://your-vercel-domain.vercel.app/**`

### 3. Stripe Setup

1. Create a new account or use an existing one at [stripe.com](https://stripe.com)
2. Create two products:
   - **Monthly Plan** — recurring, monthly billing (e.g. £10/month)
   - **Yearly Plan**  — recurring, yearly billing (e.g. £96/year)
3. Copy each product's **Price ID** (`price_xxx`)
4. Set up a webhook endpoint pointing to:
   `https://your-domain.com/api/subscriptions/webhook`
   with these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx

NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

### 5. Create Admin User

After signing up on the platform, go to Supabase **Table Editor → profiles** and manually set `role = 'admin'` for your user, or run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 6. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Core Feature Reference

### Score Logic
- Users enter Stableford scores (1–45) with a date
- One score per date (duplicate dates rejected)
- Only the latest 5 scores are kept (DB trigger auto-removes oldest)

### Draw Engine
- **Random**: 5 numbers drawn from 1–45 by lottery
- **Algorithmic**: Weighted by least-frequent user scores
- Simulation mode available before publishing
- Jackpot (5-match, 40% pool) rolls over if unclaimed

### Prize Distribution
| Match | Pool Share | Rollover |
|-------|-----------|----------|
| 5-Number | 40% | ✅ Yes |
| 4-Number | 35% | ❌ No  |
| 3-Number | 25% | ❌ No  |

Prize split equally among multiple winners in same tier.

### Charity
- Minimum 10% of subscription fee
- User selectable at signup, adjustable on dashboard
- Charity directory managed by admin
