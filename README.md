# SkillWill E-commerce Frontend

A full-featured e-commerce frontend built with React, TypeScript, and Vite as a final project for the SkillWill frontend course.

## Tech Stack

- **React 19** — UI library
- **TypeScript** — type safety
- **Vite** — build tool
- **React Router v7** — routing, URL-based filter state
- **TanStack Query v5** — server state, caching
- **React Hook Form + Zod** — form handling and validation
- **Lucide React** — icons

## Features

- **Authentication** — register, login, forgot password (3-step flow with email code)
- **Catalog** — product grid with server-driven filters, sort, search, pagination — all state in URL
- **Product page** — image gallery, specs table, related products, add to cart
- **Cart** — server-side cart, quantity stepper, live totals
- **Checkout** — shipping + card form, 3D-Secure-style code confirmation, order confirmation page
- **Profile** — edit name, email, password; manage delivery addresses
- **Favorites** — save and remove products
- **Orders** — order history and order detail page
- **i18n** — Georgian / English language switcher

## Project Structure

```
src/
├── app/              # App entry, routing, layout (Nav)
├── features/         # Feature modules (auth, cart, catalog, checkout, profile, …)
│   └── <feature>/
│       ├── api/      # API call functions
│       ├── components/
│       ├── pages/
│       ├── hooks.ts  # TanStack Query hooks
│       └── types.ts
└── shared/
    ├── api/          # HTTP client, error types, server error helpers
    ├── auth/         # Session context, ProtectedRoute, token storage
    ├── i18n/         # Translation files (en.ts, ka.ts)
    ├── lib/          # Utilities (format, useDocumentTitle)
    ├── styles/       # Global CSS, design tokens
    └── ui/           # Shared component library (Button, Input, …)
```

## Architecture Decisions

See [`docs/adr/`](docs/adr/) for recorded decisions:

- [001 — Auth token storage](docs/adr/001-auth-token-storage.md)
- [002 — Profile edit current password strategy](docs/adr/002-profile-edit.md)
- [003 — Cart stepper rapid click handling](docs/adr/003-stepper-rapid-clicks.md)
- [004 — Checkout order ID storage](docs/adr/004-checkout-order-id-storage.md)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```
VITE_API_URL=https://shop-api-kbe6.onrender.com/api
```

## API

Base URL: `https://shop-api-kbe6.onrender.com/api`  
Swagger docs: `https://shop-api-kbe6.onrender.com/docs`
