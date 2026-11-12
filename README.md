<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Logo Overlay Pro

A mobile-first, true WYSIWYG web application to place, scale, rotate, crop, and brand photos with PNG logos, exporting exact high-resolution JPG images.

View your app in AI Studio: https://ai.studio/apps/5bd0d652-5bb4-43e0-a887-76ac61081cfa

---

## Deploy to GitHub Pages (Automatic via GitHub Actions)

This repository includes a preconfigured GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that builds and deploys the app to GitHub Pages on every push to `main`.

### One-Time Setup in GitHub

1. Push this repository to GitHub.
2. In your GitHub repository, open **Settings** (top navigation tab).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** > **Source**, change the dropdown from *Deploy from a branch* to **GitHub Actions**.
5. That's it! Any push to `main` will automatically build and publish your site.

You can also trigger a deployment manually anytime by opening the **Actions** tab in GitHub, choosing **Deploy to GitHub Pages**, and clicking **Run workflow**.

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
