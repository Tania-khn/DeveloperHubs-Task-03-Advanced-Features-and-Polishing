# Pulse — Realtime Social Feed

A polished realtime social feed demo with live likes, comments, notifications, and smooth animations. Built with Next.js 16, Socket.io, Framer Motion, and shadcn/ui.

![Pulse](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Socket.io](https://img.shields.io/badge/Socket.io-4-white) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)

---

## Features

- **Real-time updates** — likes and comments sync instantly across all connected clients via Socket.io
- **Push notifications** — uses the Web Notifications API to fire OS-level notifications when someone likes/comments on your posts
- **In-app notification bell** — dropdown with unread badge, "mark all read" button, and toast popups
- **Smooth animations** — heart-burst on like, spring counters, staggered feed entry, animated badges (Framer Motion)
- **Responsive design** — works on mobile (375px), tablet, and desktop
- **Performance optimized** — `React.memo`, `useCallback`, `useMemo`, debounced localStorage draft saving, throttled like clicks
- **Error handling** — React error boundary, realtime connection-loss banner, graceful image-broken fallback
- **Loading states** — skeleton loaders during initial socket handshake
- **Simulated activity bot** — auto-fires a random like/comment every ~7s so realtime features are always demonstrably alive

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Animations | Framer Motion 12 |
| Realtime | Socket.io 4 |
| Icons | lucide-react |
| Toasts | sonner |

---

## Prerequisites

Make sure you have these installed:

- **Node.js** v18 or newer — [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **bun** — [bun install](https://bun.sh/)
- **VSCode** — [Download](https://code.visualstudio.com/)

Verify your install:
```bash
node --version    # should print v18.x or higher
npm --version     # should print 9.x or higher
```

---

## Setup & Run (in VSCode)

### 1. Unzip the project

```bash
unzip pulse-social-feed.zip
cd pulse-social-feed
```

### 2. Open in VSCode

```bash
code .
```

(Or open VSCode → File → Open Folder → select `pulse-social-feed`)

### 3. Install all dependencies (root + socket service)

```bash
npm run install:all
```

This runs `npm install` in both the root project and the `mini-services/feed-service` folder.

### 4. Start both servers (web + socket) with one command

```bash
npm run dev:all
```

This uses `concurrently` to launch:
- **Web app** on http://localhost:3000 (Next.js dev server)
- **Socket.io server** on http://localhost:3003 (the realtime backend)

You'll see colored logs in your terminal:
- `[web]` → cyan
- `[socket]` → magenta

### 5. Open the app

Visit **http://localhost:3000** in your browser.

That's it — you should see the feed load with 8 seeded posts, the notification bell showing unread count, and within ~7 seconds the bot will start generating realtime likes/comments.

---

## Run the two services separately (optional)

If you prefer separate terminal windows:

**Terminal 1 — Socket.io server:**
```bash
npm run dev:server
```

**Terminal 2 — Next.js web app:**
```bash
npm run dev
```

---

## Try these features

1. **Like a post** — click the heart icon, watch the particle burst animation
2. **Comment** — click the comment bubble, type something, hit Enter or click send
3. **Create a post** — type in the composer at the top, optionally add a photo
4. **Notifications** — click the bell icon to see realtime notifications dropdown
5. **Enable push** — click "Enable push" in the header to authorize OS-level notifications
6. **Mobile view** — resize your browser window to < 640px width to see the responsive layout

---

## Project Structure

```
pulse-social-feed/
├── mini-services/
│   └── feed-service/
│       ├── index.js              # Socket.io realtime backend
│       └── package.json
├── prisma/
│   └── schema.prisma             # Prisma schema (optional — not used in demo)
├── public/
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx            # Root layout with Sonner + shadcn toasters
│   │   └── page.tsx              # Main feed page
│   ├── components/
│   │   ├── social/
│   │   │   ├── comment-list.tsx       # Comment list with composer
│   │   │   ├── composer.tsx           # New post composer
│   │   │   ├── feed-error-boundary.tsx
│   │   │   ├── feed-header.tsx        # Sticky header with bell + avatar
│   │   │   ├── feed-skeleton.tsx      # Loading skeletons
│   │   │   ├── like-button.tsx        # Animated heart with burst
│   │   │   ├── notification-bell.tsx  # Bell dropdown with unread badge
│   │   │   └── post-card.tsx          # Single post component
│   │   └── ui/                   # shadcn/ui component library
│   ├── hooks/
│   │   └── social/
│   │       ├── use-browser-notifications.ts  # Web push API hook
│   │       └── use-realtime-feed.ts          # Socket.io client hook
│   └── lib/
│       ├── social/
│       │   ├── types.ts          # Shared TypeScript types
│       │   └── utils.ts          # timeAgo, formatCount, debounce
│       ├── db.ts                 # Prisma client (optional)
│       └── utils.ts              # cn() class merge helper
├── .env.example
├── .gitignore
├── components.json               # shadcn/ui config
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

---

## Configuration

### Environment variables

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
cp .env.example .env.local
```

The default `.env.example` is:
```env
# Socket.io server URL. Defaults to http://localhost:3003
# Change this if you deploy the socket service elsewhere.
NEXT_PUBLIC_SOCKET_URL=http://localhost:3003
```

### Ports

| Service | Default port | Change via |
|---------|--------------|------------|
| Next.js web | 3000 | `package.json` script: `next dev -p 3001` |
| Socket.io | 3003 | `mini-services/feed-service/index.js`: `const PORT = ...` |

If you change the socket port, also update `NEXT_PUBLIC_SOCKET_URL` in `.env.local`.

---

## What's next?

Ideas to extend the demo:
- Swap the in-memory store for Prisma + SQLite/Postgres
- Add NextAuth.js for real user authentication
- Add a service worker for true background push notifications
- Add image upload (e.g. via Cloudinary or S3)
- Add a profile page per user

---

## License

MIT — feel free to use this for learning, portfolios, or your own projects.
