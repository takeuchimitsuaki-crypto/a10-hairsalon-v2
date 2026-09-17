# A10 Hairsalon v2

Simplified monorepo with LiME-based design for hair salon management.

## Project Structure

```
apps/
├── api/      - Cloudflare Workers backend
├── salon/    - Salon admin dashboard
├── stylist/  - Stylist app with karte management
└── customer/ - Customer app (PWA) with LINE integration

packages/
└── shared/   - Shared types and utilities
```

## Getting Started

### Install dependencies
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Type check
```bash
npm run type-check
```

## Architecture

- **Frontend**: Vite + React + TypeScript
- **Backend**: Cloudflare Workers + D1 SQLite
- **Hosting**: Vercel (frontend), Cloudflare (backend)

## Implementation Phases

| Phase | Content | Status |
|-------|---------|--------|
| 0 | Infrastructure Setup | In Progress |
| 1 | Customer App Base + LINE Webhook | Pending |
| 2 | Stylist App Refactor | Pending |
| 3 | Admin Dashboard Enhancement | Pending |
| 4 | DB & API Integration | Pending |
| 5 | Testing & Production | Pending |
