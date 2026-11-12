<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Logo Overlay Pro

A mobile-first, true WYSIWYG web application to place, scale, rotate, crop, and brand photos with PNG logos, exporting exact high-resolution JPG images.

View your app in AI Studio: https://ai.studio/apps/5bd0d652-5bb4-43e0-a887-76ac61081cfa

---

## Deploy to GitHub Pages (Automatic via GitHub Actions)

This repository includes a preconfigured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that builds and deploys the app to GitHub Pages on every push to `main`.

### Important: Why You May See a Blank Page & How to Fix It

If your published GitHub Page is currently blank and viewing the source code shows `index.html` referencing `<script src="/src/main.tsx">`:

> **Cause:** By default, GitHub Pages is set to **"Deploy from a branch: main / (root)"**. This serves the raw, uncompiled repository root rather than the compiled output. Web browsers cannot execute raw `.tsx` files directly, which results in a blank page.

**Solution (Choose either option below):**

* **Option A (Recommended - GitHub Actions):**
  1. Go to **Settings** > **Pages** in your repository.
  2. Under **Build and deployment** > **Source**, change from *Deploy from a branch* to **GitHub Actions**.
  3. Go to the **Actions** tab, select **Deploy to GitHub Pages**, and click **Run workflow** (or simply make any commit to `main`).

* **Option B (Branch Deployment):**
  1. Once the GitHub Actions workflow runs, it automatically pushes the compiled site to the `gh-pages` branch.
  2. In **Settings** > **Pages**, under **Source**, leave *Deploy from a branch* selected.
  3. Under **Branch**, select **`gh-pages`** and folder **`/ (root)`**, then click **Save**.

---

## Run Locally

**Prerequisites:** Node.js (version 18 or newer)

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. (Optional) If using server-side Gemini features, set the `GEMINI_API_KEY` in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. Test production build locally:
   ```bash
   npm run build
   npm run preview
   ```
