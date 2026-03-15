# Data & connectivity: IndexedDB, Supabase, Backend

This doc describes how the frontend connects to **IndexedDB**, **Supabase** (via backend), and the **backend API**, and how data is fetched and persisted.

---

## 1. Backend API (Express)

- **Base URL**: Set via `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_URL_LOCAL` (default `http://localhost:4000`). See `src/api/apiClient.ts`.
- **Endpoints used by frontend**:
  - `GET /health` – backend up
  - `GET /health/db` – Supabase configured and games table reachable (returns `gamesCount`)
  - `GET /games/:type` – fetch games by type (`addition`, `subtraction`, `multiplication`, `division`, `mixed`)
  - `POST /users` – ensure user exists (body: `{ user_id: "<uuid>" }`)
  - `PATCH /users/:userId` – update score (body: `{ score: number }`)
- **Verification**: Footer shows **"· API ✓ DB ✓"** when both `/health` and `/health/db` succeed. Use `useBackendHealth()` or `checkBackendHealth()` from `lib/connectivity.ts` for custom checks.

---

## 2. Supabase (via backend only)

- The **frontend never talks to Supabase directly**. All Supabase access is through the backend.
- **Backend** uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` to connect. See `backend/src/database/supabaseClient.ts` and `backend/src/config/env.ts`.
- **Tables**:
  - **games**: `id`, `game_type`, `question`, `correct_answer`, `difficulty`, `created_at`, `expires_at`. Backend reads active games and writes generated ones.
  - **users**: `user_id`, `score`, `last_sync`, etc. Backend creates/updates users when frontend calls `POST /users` and `PATCH /users/:userId`.
- **Verification**: Call backend `GET /health/db`. If Supabase is configured and the `games` table exists, response is `200` with `configured: true` and `gamesCount`.

---

## 3. IndexedDB (frontend, two DBs)

### 3.1 Game cache & meta (`lib/db.ts` – Dexie, DB name: `mathy-games-db`)

- **gameCache** (key: `gameType`): Cached games from backend and `lastFetchAt`. Used by `useGameLoader`: if cache is fresh (< 1 hour), use cache; else fetch from backend and write here.
- **meta** (key: string): Key-value. Used for:
  - `lastLeftAt` – inactive user detection
  - `mathSessionMax` – max games per math session (e.g. 20)
  - `mathSessionPlayed` – number of math questions completed this session
- **Verification**: Games load on Play; after 1h the “Reload” button clears cache and next load fetches from backend. Math “X / Y played · Z remaining” on the home page is read from this DB.

### 3.2 User & score (`lib/indexeddb.ts` – Dexie, DB name: `mathy-user-db`)

- **game_store** (single record, id: `default`): `user_uuid`, `score`, `last_sync`.
- **Flow**: `useUserUUID` resolves UUID from here (or creates one, stores it, then calls `POST /users` so Supabase has the user). `useScore` reads/writes `score` here and calls `syncScoreToSupabase()` (which uses `PATCH /users/:userId`) to push score to backend/Supabase.
- **Verification**: Score persists across reloads; total appears in math game; sync runs on load and every 5 minutes.

---

## 4. Data flow summary

| Data            | Where it lives        | How frontend gets/updates it |
|-----------------|------------------------|------------------------------|
| Games list      | Supabase → Backend     | Frontend: `fetchGamesByType()` → backend `GET /games/:type`; result cached in IndexedDB (`lib/db.ts`) |
| User UUID       | IndexedDB (user db)    | `useUserUUID`: read/create, then `POST /users` to ensure row in Supabase |
| Score           | IndexedDB (user db)    | `useScore`: add locally, then `syncScoreToSupabase()` → `PATCH /users/:userId` |
| Math session    | IndexedDB (meta)       | `mathSessionMax`, `mathSessionPlayed` read/written from `lib/db.ts` and landing/game components |
| Plays reset     | localStorage           | `useAttempts`: `ag_attempts_used`, `ag_hour_start` |
| Game refresh TTL| IndexedDB (game cache) | `getGlobalLastFetchAt()` / `lastFetchAt` in store; used by `useGameTimer` and reload logic |

---

## 5. Env and running

- **Backend** (`.env`): `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL` / `FRONTEND_URL_LOCAL`, optional `AI_API_KEY`.
- **Frontend** (`.env.local`): `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_URL_LOCAL` (e.g. `http://localhost:4000`).
- **CORS**: Backend allows `FRONTEND_URL` and `FRONTEND_URL_LOCAL` (e.g. `http://localhost:3000`).

If the footer shows **API ✓ DB ✓**, the backend and Supabase are connected and the frontend is fetching data correctly. IndexedDB is used automatically for games cache, user UUID, score, and math session progress.
