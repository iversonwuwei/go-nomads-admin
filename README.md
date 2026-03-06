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

## Docker

Build and run locally:

```bash
npm run docker:build
npm run docker:run
# app on http://localhost:3000
```

Manual commands:

```bash
docker build -t go-nomads-admin .
docker run --rm -p 3000:3000 go-nomads-admin
```

Compose:

```bash
docker compose up --build
```

## Generate feature images with Tongyi Wanxiang

This repo ships a helper script that calls Tongyi Wanxiang (DashScope) to render the six feature card images and saves them to `public/funcs`.

1. Copy env template: `cp .env.local.example .env.local`.
2. Open `.env.local` and set `DASHSCOPE_API_KEY` (same value used by AIService under `Qwen:ApiKey` in the backend).
3. Run the generator: `node scripts/generate-func-images.js` (requires Node 18+ for built-in `fetch`).
4. Start the site (`npm run dev`) and the feature cards will load the generated images automatically.
