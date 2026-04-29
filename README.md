# AppForge — Config-Driven App Generator

> Turn JSON configurations into fully working web applications — like base44.com

## 🏗 Architecture

```
appforge/
├── frontend/        Next.js 14 + TypeScript + Tailwind CSS
├── backend/         Node.js + Express + TypeScript
└── docker-compose.yml
```

### Key Design Decisions

**Config-Driven Runtime** — The system never hardcodes app logic. Every UI component, API route, and data structure is derived at runtime from the stored JSON config. Changing the config changes the app instantly.

**Graceful Degradation** — Unknown field types render as text inputs. Missing collections show helpful error states. Incomplete configs get defaults filled in via `sanitizeConfig()`. The system never crashes on bad input.

**Extensibility** — Adding a new UI component type requires only:
1. Add a new `case` in `ComponentRenderer.tsx`
2. Create the component file
3. No other changes needed

## 🚀 Quick Start

### With Docker (recommended)

```bash
git clone <your-repo>
cd appforge
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Postgres: localhost:5432

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # Edit DATABASE_URL, JWT_SECRET
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```

## 📦 Features Implemented

### ✅ Core (Mandatory)
- **Dynamic UI** — Forms, tables, dashboards rendered from config
- **Dynamic APIs** — CRUD endpoints auto-generated per collection
- **Config sanitization** — Handles missing/invalid fields gracefully
- **Auth** — JWT email/password, user-scoped data
- **Extensibility** — New component types plug in without touching core logic

### ✅ Feature 1: CSV Import System
- 3-step flow: Upload → Map fields → Import
- Auto-suggests field mappings based on column names
- Validates required fields per row
- Reports success/failure counts with row-level errors
- Import history log

### ✅ Feature 2: Multi-language / i18n
- English, Hindi (हिंदी), Spanish (Español)
- Locale switcher in sidebar
- Config-level translation support (app-specific strings)
- Persisted in localStorage + user profile

### ✅ Feature 3: Mobile-Ready PWA
- Fully responsive layout
- Mobile sidebar drawer
- PWA manifest + next-pwa
- Installable on iOS/Android

## 📐 Config Format

```json
{
  "name": "My App",
  "collections": [
    {
      "name": "tasks",
      "label": "Tasks",
      "fields": [
        { "name": "title", "type": "text", "required": true },
        { "name": "status", "type": "select", "options": [
          { "value": "todo", "label": "To Do" },
          { "value": "done", "label": "Done" }
        ]},
        { "name": "due_date", "type": "date" }
      ]
    }
  ],
  "pages": [
    {
      "id": "p1",
      "path": "/",
      "title": "Tasks",
      "auth": true,
      "components": [
        { "id": "c1", "type": "table", "collection": "tasks" }
      ]
    }
  ],
  "i18n": {
    "defaultLocale": "en",
    "supportedLocales": ["en", "es"]
  }
}
```

### Supported Field Types
`text` · `email` · `password` · `number` · `boolean` · `date` · `datetime` · `select` · `multiselect` · `textarea` · `json`

### Supported Component Types
`table` · `form` · `dashboard` · `chart`

> Unknown types render a "not yet supported" message instead of crashing.

## 🧪 Edge Cases Handled

| Scenario | Behavior |
|---|---|
| Unknown field type in config | Falls back to text input |
| Missing collection in component | Shows yellow warning, doesn't crash |
| Invalid JSON config on save | Shows error, blocks save |
| Duplicate app slug | Auto-appends random suffix |
| CSV row missing required fields | Skipped with per-row error log |
| JWT expired | Redirects to login |
| Unknown component type | Renders placeholder message |
| Empty collections array | System works, shows empty state |

## 🔌 API Reference

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Apps
- `GET /api/apps` — List apps
- `POST /api/apps` — Create app from config
- `GET /api/apps/:id` — Get app
- `PUT /api/apps/:id` — Update config
- `PATCH /api/apps/:id/publish` — Toggle publish
- `DELETE /api/apps/:id` — Delete

### Dynamic Data
- `GET /api/dynamic/:appId/:collection` — List records
- `POST /api/dynamic/:appId/:collection` — Create record
- `PUT /api/dynamic/:appId/:collection/:id` — Update
- `DELETE /api/dynamic/:appId/:collection/:id` — Delete

### CSV
- `POST /api/csv/:appId/:collection/preview` — Preview + suggest mappings
- `POST /api/csv/:appId/:collection/import` — Execute import

### Notifications
- `GET /api/notifications` — List
- `GET /api/notifications/unread-count` — Count
- `PATCH /api/notifications/:id/read` — Mark read
