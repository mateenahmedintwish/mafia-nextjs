This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mafia Game Setup

### 1. Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
# Vercel Postgres
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# Pusher (Get these from pusher.com)
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="your_cluster"

NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
```

### 2. Database Setup

After configuring `.env`, push the schema to your database:

```bash
npx prisma db push
```

### 3. Run Development Server

```bash
npm run dev
```

