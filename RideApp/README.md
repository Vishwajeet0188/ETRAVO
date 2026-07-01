# RideApp

RideApp is an Expo mobile app with a Node/Express API and PostgreSQL database.

## Run PostgreSQL and the backend

Docker Desktop must be running.

```powershell
docker compose up -d
cd backend
npm install
npm run dev
```

The database is created automatically from `backend/db/init.sql`. Check the API
and database connection at `http://localhost:4000/health`.

Backend configuration is stored in `backend/.env`. Use
`backend/.env.example` as the template for other environments and replace
`JWT_SECRET` before deployment.

## Run the mobile app

From the project root:

```powershell
npm install
npm start
```

The Android emulator automatically connects to the host through `10.0.2.2`.
Web and the iOS simulator use `localhost`.

For Expo Go on a physical phone, create `.env.local` with the computer's LAN
address:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api
```

The phone and computer must be on the same network. Restart Expo after changing
an environment variable.

## Authentication endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` with a Bearer token

Registration and login both require a role of `driver` or `passenger`.
