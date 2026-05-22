# Content Gap Analysis Tool
### By Social Mishal

An AI-powered lead magnet that generates a personalized content gap report instantly.

---

## How to Deploy (Step by Step)

### Step 1: Upload to GitHub

1. Go to github.com and create a new repository
2. Name it `content-gap-analysis` (or anything you like)
3. Set it to **Public**
4. Upload all these files — drag and drop works fine

### Step 2: Deploy to Vercel

1. Go to vercel.com and log in
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your `content-gap-analysis` repo
5. Click **Deploy** — Vercel will auto-detect the config

### Step 3: Add Environment Variables

After deploying, go to your project in Vercel:
1. Click **Settings** → **Environment Variables**
2. Add these two variables:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Your key from aistudio.google.com |
| `BREVO_API_KEY` | Your key from brevo.com |

3. Click **Save** then go to **Deployments** and click **Redeploy**

### Step 4: Set up Brevo Sender

In your Brevo account:
1. Go to **Senders & IPs** → **Senders**
2. Add `mishalzafar0@gmail.com` as a sender
3. Verify it via the email they send you

That's it. Your tool is live!

---

## Your Live URL
After deployment: `https://content-gap-analysis.vercel.app` (or your custom domain)

---

## Files
- `public/index.html` — The full landing page and form UI
- `api/report.js` — Serverless function: calls Gemini AI + sends email via Brevo
- `vercel.json` — Deployment configuration
- `package.json` — Project metadata
