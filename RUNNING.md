# Running the project (Frontend, Backend, Database)

This document explains how to run the Retail Management frontend (FE), backend (BE) and the database (DB) locally on macOS (zsh). It covers the recommended Docker approach and alternatives (Homebrew MySQL / local dotnet). Use these commands from the repository root unless noted otherwise.

## Prerequisites

- Node.js 18+ and npm (for frontend)
- .NET 9 SDK (for backend)
- Docker Desktop (recommended) or MySQL 8.0 installed locally (Homebrew)
- Optional: jq and curl for quick API checks

Confirm versions:

```zsh
node --version
dotnet --info
docker --version
docker compose version
```

---

## Quick start (recommended)

1) Start the database (Docker Compose)

```zsh
cd retail
docker compose up -d
docker compose logs --follow mysql
# Wait until the init SQL import completes and the container shows "ready for connections"
```

The compose file (`retail/docker-compose.yml`) will initialize the `store_management` database using `retail/db-retail/store_management_full.sql`.

2) Run the backend (Development)

```zsh
cd retail/be_retail
export ASPNETCORE_ENVIRONMENT=Development
dotnet restore
dotnet build
dotnet run
```

The backend listens on `http://localhost:5260` (see `Properties/launchSettings.json`). Swagger UI is available at `http://localhost:5260/swagger/index.html` when in Development.

3) Run the frontend (dev)

```zsh
cd retail/fe-retail
npm install
# By default this repo includes a .env that enables mock API. To use the real backend change VITE_USE_MOCK_API to false.
npm run dev
```

Frontend dev server default URL: `http://localhost:3000`.

If you want the frontend to call the running backend, update `retail/fe-retail/.env`:

```
VITE_API_BASE_URL=http://localhost:5260/api
VITE_USE_MOCK_API=false
```

---

## Alternative: run MySQL locally (no Docker)

Install and start MySQL via Homebrew:

```zsh
brew install mysql@8.0
brew services start mysql@8.0
```

Create the DB and import the provided SQL:

```zsh
mysql -u root -e "CREATE DATABASE IF NOT EXISTS store_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root store_management < $(pwd)/retail/db-retail/store_management_full.sql
```

If your MySQL root has a password, use `-p` or set the connection string environment variable before running the backend:

```zsh
export ConnectionStrings__DefaultConnection="Server=localhost;Database=store_management;User=root;Password=yourpassword;Charset=utf8mb4;"
export ASPNETCORE_ENVIRONMENT=Development
dotnet run --project retail/be_retail
```

---

## Environment variables (quick reference)

- Frontend (`retail/fe-retail/.env` or `.env.local`)
  - `VITE_API_BASE_URL` — base URL for API calls (e.g. `http://localhost:5260/api`)
  - `VITE_USE_MOCK_API` — `true` to use UI mock data, `false` to use real API

- Backend
  - `ASPNETCORE_ENVIRONMENT` — set to `Development` to use `appsettings.Development.json`
  - `ConnectionStrings__DefaultConnection` — override DB connection string if needed

Example: set backend connection to a passworded local DB

```zsh
export ConnectionStrings__DefaultConnection="Server=localhost;Database=store_management;User=root;Password=secret;Charset=utf8mb4;"
export ASPNETCORE_ENVIRONMENT=Development
dotnet run --project retail/be_retail
```

## Verifying everything is up

- Check containers & service status:

```zsh
cd retail
docker compose ps
```

- Check DB tables inside the container:

```zsh
docker exec -it mysql_db mysql -u root -e "USE store_management; SHOW TABLES;"
```

- Confirm backend is reachable and Swagger is available:

```zsh
open http://localhost:5260/swagger/index.html
curl http://localhost:5260/api/v1/products | jq .
```

- Confirm frontend:

```zsh
open http://localhost:3000
```

## Troubleshooting & common issues

- Docker connect errors: make sure Docker Desktop is running (`open -a Docker`) and `docker info` returns data.
- Port conflicts: backend defaults to `5260`. Override with `ASPNETCORE_URLS` env var:

```zsh
export ASPNETCORE_URLS="http://localhost:5261"
dotnet run
```

- DB connection refused: ensure MySQL container is healthy and listening on `3306`, or point to your local MySQL instance and import the SQL.
- EF / seeder: the repo includes `DbSeeder` that inserts default rows; the provided SQL file initializes full schema and data.
- Dev HTTPS certificate: to use https locally, run `dotnet dev-certs https --trust` and follow the prompts.

## Useful commands

- Stop and remove the DB container:

```zsh
cd retail
docker compose down
```

- Show logs for backend (if started with `dotnet run`, logs are printed in that terminal). For docker logs:

```zsh
docker compose logs --follow mysql
```

## Files of interest

- Frontend: `retail/fe-retail/` (main dev commands `npm run dev`)
- Backend: `retail/be_retail/` (run with `dotnet run`)
- Database init SQL: `retail/db-retail/store_management_full.sql`
- Docker compose: `retail/docker-compose.yml`

---

If you want, I can also:

- update `retail/fe-retail/.env` to point to `http://localhost:5260/api` and set `VITE_USE_MOCK_API=false`;
- remove the deprecated `version` line from `retail/docker-compose.yml` to silence the warning;
- add a convenience script or `Makefile` to run the three steps with one command.

Feel free to tell me which of those you'd like me to add.
