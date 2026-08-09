# ⚡ ZeroPulse

> Real-time API and uptime monitoring for developers. Know the moment something goes down.

Built for the **[WeMakeDevs × Zerops Hackathon](https://www.wemakedevs.org/hackathons/zerops)** — August 8–9, 2026.

---

## What it does

ZeroPulse watches your APIs and endpoints around the clock. The moment something goes wrong, you know — via email alert and a live status page you can share with your users.

- **Monitor any URL** — add an endpoint in seconds, checks start immediately
- **Live dashboard** — real-time status, uptime %, and response time across all monitors
- **Response time charts** — visualise latency trends over the last 24 hours
- **Public status pages** — shareable URL at `/status/[slug]` for each monitor
- **Email alerts** — instant notification on down + recovery via Resend
- **Incident tracking** — automatic incident open/close with full history
- **Auto-refresh** — dashboard updates every 30 seconds without a page reload

---

## Architecture

ZeroPulse runs **5 Zerops services** wired together over a private network:

```
                    ┌─────────────────────────────────┐
  Browser ──HTTPS──▶│       web  (Next.js 14)         │
                    │  Dashboard, API routes, Status   │
                    └──────────────┬──────────────────┘
                                   │ private network
                    ┌──────────────▼──────────────────┐
                    │       db  (PostgreSQL)           │
                    │  Monitors, Checks, Incidents     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      cache  (Valkey/Redis)       │
                    │  BullMQ job queue                │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │     worker  (Node.js)            │
                    │  BullMQ processor, pings URLs    │
                    │  sends email alerts via Resend   │
                    └─────────────────────────────────┘
```

| Service  | Technology      | Role                              |
|----------|-----------------|-----------------------------------|
| `web`    | Next.js 14      | Frontend + REST API               |
| `worker` | Node.js + BullMQ| Background monitor processor      |
| `db`     | PostgreSQL      | Persistent data store             |
| `cache`  | Valkey          | Job queue broker                  |

---

## Tech stack

- **Next.js 14** — App Router, TypeScript, Server Components
- **Prisma** — type-safe ORM with migration support
- **BullMQ** — reliable job queue with repeatable jobs
- **Recharts** — response time visualisation
- **Resend** — transactional email for alerts
- **Tailwind CSS** — custom design system
- **Zerops** — infrastructure: runtimes, PostgreSQL, Valkey, networking

---

## Local development

```bash
# 1. Clone
git clone https://github.com/your-username/zeropulse
cd zeropulse

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Fill in DATABASE_URL and REDIS_URL

# 4. Run database migrations
cd packages/db && npx prisma db push

# 5. Start web app
cd apps/web && npm run dev

# 6. Start worker (separate terminal)
cd apps/worker && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy on Zerops

1. Create a Zerops account at [zerops.io](https://zerops.io)
2. Create a new project and add services: `web` (Node.js), `worker` (Node.js), `db` (PostgreSQL), `cache` (Valkey)
3. Add environment secrets: `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`
4. Push via ZeropsYAML — `zerops.yaml` is already configured
5. ZCP handles the rest: install → build → migrate → deploy

---

## AI tools used

- **Claude** (Anthropic) — architecture planning, component generation, debugging
- All code reviewed, modified, and understood before use

---

## License

MIT
