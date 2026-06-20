# Deploy to Render

This project is configured to deploy on Render with persistent JSON storage.
A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the project on every push
and can optionally trigger a Render deploy automatically.

## 1) Code is already on GitHub ✅

Your code is on GitHub. Now follow the steps below to deploy.

## 2) Create Web Service on Render

### Option A — Blueprint (recommended, uses `render.yaml`)

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub account and select this repository
4. Render will detect `render.yaml` and configure everything automatically
5. Click **Apply** — Render will build and deploy the app

### Option B — Manual setup

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Fill in:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment:** `Node`
   - **Node Version:** `20`

## 3) Persistent storage

This app reads/writes JSON files (`users.json`, `otps.json`, `favorites.json`, `payments.json`).

Add a persistent disk in Render:
- **Mount Path:** `/opt/render/project/src/data`
- **Size:** 1 GB

Then add this environment variable in Render:

| Key | Value |
|-----|-------|
| `DATA_DIR` | `/opt/render/project/src/data` |

## 4) Optional env vars for OTP sending

If you want real OTP delivery, add one of these sets of environment variables in Render:

### Twilio SMS
| Key | Value |
|-----|-------|
| `TWILIO_ACCOUNT_SID` | your Twilio account SID |
| `TWILIO_AUTH_TOKEN` | your Twilio auth token |
| `TWILIO_FROM` | your Twilio phone number |

### Gmail SMTP
| Key | Value |
|-----|-------|
| `GMAIL_USER` | your Gmail address |
| `GMAIL_PASS` | your Gmail app password |

If not set, the OTP route returns the OTP code in the API response (development mode only).

## 5) Auto-deploy on push (GitHub Actions)

The workflow in `.github/workflows/deploy.yml` automatically builds the project on every push
to `main`/`master`. To also trigger a Render redeploy from GitHub Actions:

1. In Render, go to your service → **Settings** → **Deploy Hook** → copy the URL
2. In your GitHub repo, go to **Settings** → **Secrets and variables** → **Actions**
3. Add a new secret: `RENDER_DEPLOY_HOOK_URL` = the URL you copied

From now on, every push to `main`/`master` will build the project and trigger a fresh deploy on Render.

> **Note:** Render's `autoDeploy: true` in `render.yaml` will also trigger a deploy directly
> whenever you push to GitHub (without needing the deploy hook secret). The GitHub Actions
> workflow adds a build-verification step before the deploy fires.

## 6) Verify after deploy

- Open the deployed URL shown in your Render dashboard
- Register / login flow
- Create a payment and confirm
- Save favorites / deals
- Restart the service and confirm data persists
