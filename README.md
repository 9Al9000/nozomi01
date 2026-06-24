# Nozomy Website

Single-page website for Nozomy.ai with Resend email integration.

## Email flows

- **Assessment form** → `/api/send-assessment.js` → sends notification to you + beautiful result email to submitter
- **Contact form** → `/api/send-contact.js` → sends notification to you + confirmation email to submitter

Both use Resend. The site **must be deployed on Vercel** (not GitHub Pages) for the API routes to work.

---

## Deploy to Vercel (one-time setup)

### 1. Push to GitHub
Make sure this repo is on GitHub.

### 2. Import to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Framework Preset: **Other**
4. Root Directory: `/` (default)
5. Click **Deploy**

### 3. Add environment variables
In Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | `your_resend_api_key` |
| `NOZOMY_INTERNAL_EMAIL` | `info@nozomy.ai` (optional, this is the default) |

### 4. Connect your custom domain
In Vercel → your project → **Settings → Domains** → add `nozomy.ai`
Update your DNS to point to Vercel (they will show you the records).

### 5. Verify your domain in Resend
In [resend.com/domains](https://resend.com/domains) → Add `nozomy.ai` → add the DNS records they provide.
This lets you send from `info@nozomy.ai`.

---

## Local development
```bash
npm install
vercel dev
```
Then open http://localhost:3000
