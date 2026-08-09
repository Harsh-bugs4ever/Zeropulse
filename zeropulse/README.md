# ⚡ ZeroPulse

> Real-time uptime monitoring & status page platform. Built to keep developer APIs and services rock-solid.

[![WeMakeDevs × Zerops Hackathon](https://img.shields.io/badge/WeMakeDevs_×_Zerops-Hackathon_Project-00FF88?style=for-the-badge&logo=rocket)](https://www.wemakedevs.org/hackathons/zerops)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Valkey / Redis](https://img.shields.io/badge/Valkey-Redis_Queue-FF4438?style=for-the-badge&logo=redis)](https://valkey.io/)
[![Deployed on Zerops](https://img.shields.io/badge/Deployed_on-Zerops_Cloud-00E5FF?style=for-the-badge)](https://zerops.io)

---

## 🚀 Features

- ⏱️ **Real-Time Uptime Monitoring**: Automatic HTTP/HTTPS pings scheduled with BullMQ & Valkey.
- 📈 **Latency & Streak Visualizations**: Interactive response-time charts and consecutive uptime streak tracking.
- ⚡ **Embeddable SVG Status Badges (`/api/badge/[slug]`)**: Dynamic SVG status badges with live uptime percentages & animated pulsing indicators for GitHub READMEs.
- 🌐 **Global System Status Dashboard (`/status`)**: Comprehensive multi-tenant system overview page summarizing operational vs. degraded services.
- ⏸️ **Pause & Resume Controls**: Pause monitoring schedules on-demand without losing check histories.
- 🚨 **Incident Tracking & Instant Alerts**: Automatic state machine tracking down events & incidents with instant transactional email alerts via Resend.
- 💎 **Modern Dark UI**: Designed with glassmorphic cards, custom dark mode, and zero layout shift loading states (`loading.tsx` / `not-found.tsx`).

---

## 🏛️ Architecture

ZeroPulse runs **4 Zerops microservices** orchestrated over Zerops' high-speed private network:

```
                    ┌─────────────────────────────────┐
  Browser ──HTTPS──▶│       web  (Next.js 14)         │
                    │  Dashboard, API routes, Status   │
                    └──────────────┬──────────────────┘
                                   │ Private Network
                    ┌──────────────▼──────────────────┐
                    │       db  (PostgreSQL 16)       │
                    │  Monitors, Checks, Incidents    │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      cache  (Valkey/Redis)      │
                    │  BullMQ repeatable job queue    │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │     worker  (Node.js 22)        │
                    │  BullMQ worker, pings endpoints │
                    │  & sends Resend email alerts    │
                    └─────────────────────────────────┘
```

### Microservice Breakdown

| Service | Component | Tech Stack | Responsibility |
|---|---|---|---|
| `web` | Frontend & API | Next.js 14, Tailwind CSS, Prisma | Dashboard, Status pages, REST API, Badge SVG generator |
| `worker` | Background Processing | Node.js 22, BullMQ, Resend | Executes endpoint checks, updates incidents, triggers alerts |
| `db` | Database | PostgreSQL 16 | Stores monitors, historical check logs, and open/closed incidents |
| `cache` | Queue Broker | Valkey (Redis 8) | High-performance broker for BullMQ repeatable monitoring jobs |

---

## 🌐 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check endpoint for Zerops monitoring (`{"status":"ok"}`) |
| `/api/monitors` | `GET` | Fetch all monitors with live status and 24h uptime statistics |
| `/api/monitors` | `POST` | Create a new monitor & auto-schedule BullMQ background job |
| `/api/monitors/[id]` | `GET` | Fetch single monitor details |
| `/api/monitors/[id]` | `PATCH` | Toggle monitor active state (`isActive: boolean`) |
| `/api/monitors/[id]` | `DELETE` | Delete monitor & cancel BullMQ repeatable job |
| `/api/monitors/[id]/checks` | `GET` | Paginated check history for latency charts |
| `/api/monitors/[id]/stats` | `GET` | Uptime percentages (24h/7d), avg response time, & incidents |
| `/api/badge/[slug]` | `GET` | Renders a live SVG status badge for embedding in markdown |

---

## 💻 Local Development Quickstart

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **Docker**: For running local PostgreSQL & Valkey containers

```bash
# 1. Clone repository
git clone https://github.com/Harsh-bugs4ever/Zeropulse.git
cd Zeropulse/zeropulse

# 2. Start PostgreSQL & Valkey containers
docker compose up -d

# 3. Install dependencies
npm install

# 4. Initialize Database
npx prisma generate --schema=packages/db/prisma/schema.prisma
npx prisma migrate dev --name init --schema=packages/db/prisma/schema.prisma

# 5. Start Development Servers (Turbo runs web & worker concurrently)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## ☁️ Deployment on Zerops

ZeroPulse is fully pre-configured for **Zerops Cloud** via `zerops.yaml`.

```bash
# 1. Install Zerops CLI
npm install -g @zerops/zcli

# 2. Login to your Zerops Account
zcli login <YOUR_ZEROPS_TOKEN>

# 3. Build & Deploy
zcli push
```

### Environment Variables
Configure the following in your Zerops Project Settings:
- `DATABASE_URL`: Secret connection string to Zerops PostgreSQL.
- `REDIS_URL`: Private network string to Zerops Valkey (`redis://${cache_hostname}:${cache_port}`).
- `RESEND_API_KEY`: *(Optional)* Your Resend API key for transactional email alerts.
- `NEXT_PUBLIC_APP_URL`: Your Zerops production domain URL.

---

## 🤖 AI Disclosure (Hackathon Policy Compliance)

In accordance with the WeMakeDevs × Zerops AI-use policy:
- **AI Coding Agent**: Antigravity (Google DeepMind)
- **Role**: Pair programming assistant for refactoring, test script setup, and UI component styling.
- All application architecture, database designs, and code have been validated, tested, and understood by the author.

---

## 📄 License

[MIT](LICENSE) © [Harsh](https://github.com/Harsh-bugs4ever)
