# DevPulse - Internal Tech Issue & Feature Tracker

A collaborative backend platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live URL

- API: `https://your-deployment-url.vercel.app`
- GitHub: `https://github.com/yourusername/devpulse`

## Features

- JWT-based authentication (signup / login)
- Two roles: `contributor` and `maintainer` with strict permission boundaries
- Create, read, update, and delete issues (bugs & feature requests)
- Filter issues by `type` and `status`, sort by `newest` / `oldest`
- Centralized error handling with standardized success/error response shape
- Modular architecture with clear separation of concerns
- Raw SQL via the native `pg` driver — no ORMs, no query builders, no JOINs

## Tech Stack

| Layer        | Choice                                    |
| ------------ | ----------------------------------------- |
| Runtime      | Node.js 24.x (LTS)                        |
| Language     | TypeScript 5.x (strict)                   |
| Framework    | Express.js 5                              |
| Database     | PostgreSQL (NeonDB / Supabase compatible) |
| DB driver    | `pg` (raw SQL only)                       |
| Auth         | `jsonwebtoken` + `bcrypt`                 |
| HTTP codes   | `http-status-codes`                       |
| Dev runner   | `tsx`                                     |

## Project Structure

```
devpulse/
├── app.ts                       # Express app wiring
├── server.ts                    # HTTP listener + DB init
├── src/
│   ├── config/index.ts          # Env config
│   ├── db/index.ts              # pg Pool + schema bootstrap
│   ├── middleware/
│   │   ├── auth.ts              # JWT verify + role guard
│   │   ├── globalErrorHandler.ts
│   │   ├── logger.ts
│   │   └── index.d.ts           # Express.Request augmentation
│   ├── modules/
│   │   ├── auth/                # signup, login
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.interface.ts
│   │   │   ├── auth.route.ts
│   │   │   └── auth.service.ts
│   │   └── issues/              # issues CRUD
│   │       ├── issue.controller.ts
│   │       ├── issue.interface.ts
│   │       ├── issue.route.ts
│   │       └── issue.service.ts
│   ├── routes/index.ts          # Module route mounter
│   ├── types/index.ts           # Shared types & role constants
│   └── utility/
│       ├── AppError.ts
│       ├── catchAsync.ts
│       └── sendResponse.ts
├── .env.example
├── package.json
├── tsconfig.json
└── vercel.json
```

## Setup

1. **Clone & install**

   ```bash
   git clone https://github.com/yourusername/devpulse.git
   cd devpulse
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   # then edit .env with your PostgreSQL URL and JWT secret
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Tables are created automatically on first boot via `initDB()`.

4. **Production build**

   ```bash
   npm run build
   npm start
   ```

## Database Schema

### `users`

| Column       | Type         | Notes                                                       |
| ------------ | ------------ | ----------------------------------------------------------- |
| `id`         | SERIAL PK    | Auto-incrementing                                           |
| `name`       | VARCHAR(255) | Required                                                    |
| `email`      | VARCHAR(255) | Required, UNIQUE                                            |
| `password`   | VARCHAR(255) | bcrypt hash, never returned                                 |
| `role`       | VARCHAR(50)  | Defaults to `contributor`. CHECK: `contributor`/`maintainer` |
| `created_at` | TIMESTAMP    | Default `CURRENT_TIMESTAMP`                                 |
| `updated_at` | TIMESTAMP    | Default `CURRENT_TIMESTAMP`                                 |

### `issues`

| Column         | Type         | Notes                                                              |
| -------------- | ------------ | ------------------------------------------------------------------ |
| `id`           | SERIAL PK    | Auto-incrementing                                                  |
| `title`        | VARCHAR(150) | Required, max 150 chars                                            |
| `description`  | TEXT         | Required, min 20 chars                                             |
| `type`         | VARCHAR(50)  | CHECK: `bug` / `feature_request`                                   |
| `status`       | VARCHAR(50)  | Defaults to `open`. CHECK: `open` / `in_progress` / `resolved`     |
| `reporter_id`  | INTEGER      | No FK constraint — validated in app logic                          |
| `created_at`   | TIMESTAMP    | Default `CURRENT_TIMESTAMP`                                        |
| `updated_at`   | TIMESTAMP    | Refreshed on update                                                |

## API Endpoints

All responses follow the shape:

```json
{ "success": true,  "message": "...", "data": "..." }
{ "success": false, "message": "...", "errors": "..." }
```

### Authentication

| Method | Endpoint            | Access | Description              |
| ------ | ------------------- | ------ | ------------------------ |
| POST   | `/api/auth/signup`  | Public | Register a new user      |
| POST   | `/api/auth/login`   | Public | Authenticate, get JWT    |

### Issues

| Method | Endpoint           | Access                                               | Description                |
| ------ | ------------------ | ---------------------------------------------------- | -------------------------- |
| POST   | `/api/issues`      | Auth (contributor / maintainer)                      | Create a new issue         |
| GET    | `/api/issues`      | Public                                               | List issues (sort/filter)  |
| GET    | `/api/issues/:id`  | Public                                               | Retrieve a single issue    |
| PATCH  | `/api/issues/:id`  | Maintainer (any) / Contributor (own, only if `open`) | Update an issue            |
| DELETE | `/api/issues/:id`  | Maintainer only                                      | Permanently delete         |

Query parameters on `GET /api/issues`:

- `sort` — `newest` (default) | `oldest`
- `type` — `bug` | `feature_request`
- `status` — `open` | `in_progress` | `resolved`

Authenticated requests must include the JWT in the `Authorization` header:

```
Authorization: <JWT_TOKEN>
```

## Standard HTTP Status Codes

| Code | Used for                                                |
| ---- | ------------------------------------------------------- |
| 200  | Successful GET / PATCH / DELETE                         |
| 201  | Successful POST (resource created)                      |
| 400  | Validation error / duplicate resource                   |
| 401  | Missing / expired / invalid JWT                         |
| 403  | Valid token but insufficient role permissions           |
| 404  | Resource not found                                      |
| 409  | Business-logic conflict (e.g., updating non-open issue) |
| 500  | Unexpected server or database error                     |

## Deployment

The project is deploy-ready for **Vercel** (`vercel.json` is included). Set the following environment variables in your deployment dashboard:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (optional, defaults to `7d`)
- `BCRYPT_SALT_ROUNDS` (optional, defaults to `10`)

You can also deploy to **Render** or **Railway** — both auto-detect the `npm start` script.
