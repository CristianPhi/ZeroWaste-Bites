# Deploy to Render

This project is now configured to deploy on Render with persistent JSON storage.

## 1) Push to GitHub

Push this repository to GitHub.

## 2) Create Web Service on Render

- In Render dashboard: **New** -> **Blueprint** (recommended)
- Select your GitHub repo
- Render will detect `render.yaml`

If you choose manual setup instead of Blueprint:
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Environment: `Node`

## 3) Persistent storage

This app reads/writes JSON files (`users.json`, `otps.json`, `favorites.json`, `payments.json`).

Use a persistent disk mounted at:

`/opt/render/project/src/data`

The app reads this via env var:

`DATA_DIR=/opt/render/project/src/data`

## 4) Optional env vars for OTP sending

If you want real OTP delivery, configure one of these:

### Twilio SMS
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

### Gmail SMTP
- `GMAIL_USER`
- `GMAIL_PASS`

If not set, OTP route falls back to returning OTP code in API response (dev mode).

## 5) Verify after deploy

- Open deployed URL
- Register/login flow
- Create payment and confirm
- Save favorites/deals
- Restart service and confirm data persists
