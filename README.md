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

## 秘密情報の管理

- LINE のチャネルID・シークレット・アクセストークンなどの秘密情報は、`wrangler.toml` や `.env.example` に書かない。
- 本番: Cloudflare Workers Secrets に登録する（ダッシュボードの Worker → Settings → Variables and Secrets、または `npx wrangler secret put <名前> --env production`）。
- ローカル: `apps/api/.dev.vars.example` を `apps/api/.dev.vars` にコピーして値を入れる（`.dev.vars` は Git 管理外）。
- `VITE_` で始まる変数はブラウザ向けのJSに埋め込まれて誰でも読めるため、秘密情報には使わない。
