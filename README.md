# CuteMoney (Web) 🌷

Hi this is Isaac I am trying to make a money tracker for my girlfriend but I kinda
want to build in a cute way for her so there here is A cute, simple money tracker that runs
entirely as a static site — perfect for hosting free on **GitHub Pages**. No
backend, no build step, no dependencies to install.

## How data storage works

All your income/expense entries and settings (daily budget,
currency) are saved in the browser's **`localStorage`** — a small
built-in storage area every browser provides per-website.

That means:
- ✅ Your data stays **only on your device**, in that browser. It is
  never sent to a server (there isn't one).
- ✅ It works offline once the page has loaded once.
- ✅ It's free to host — GitHub Pages just serves static files.
- ⚠️ Data is per-browser, per-device. Opening the site on your phone
  and your laptop gives you two separate sets of data — they don't
  sync. Clearing your browser's site data/cache will also erase it.
- ⚠️ If you need your data backed up or moved elsewhere, use the
  **Export** tab to download CSV files anytime.

## Files

```
index.html   — page structure, all 4 tabs, both modals
style.css    — the cute pastel design system
app.js       — all logic: localStorage, rendering, charts, CSV export
```

The only external resources loaded are two Google Fonts (Baloo 2 +
Nunito) and Chart.js from a public CDN — both are just `<link>`/
`<script>` tags, no install step required.

## Run it locally first (optional)

Any static file server works, e.g. from this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html` to open it directly in a browser
(some browsers restrict localStorage on `file://` URLs — a local
server avoids that).

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `cutemoney`).
2. Push these three files (`index.html`, `style.css`, `app.js`) —
   and this `README.md` if you'd like — to the repo's root, on the
   `main` branch:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: CuteMoney web app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cutemoney.git
   git push -u origin main
   ```

3. On GitHub: go to your repo → **Settings** → **Pages** (left
   sidebar).
4. Under "Build and deployment", set **Source** to
   **Deploy from a branch**, branch **main**, folder **/ (root)**.
   Save.
5. Wait ~1 minute, then refresh — GitHub shows your live URL, usually:

   ```
   https://YOUR_USERNAME.github.io/cutemoney/
   ```


## Customizing

- **Daily budget & currency** — tap the ⚙️ icon in the top bar.
- **Categories** — edit the `EXPENSE_CATEGORIES` / `INCOME_CATEGORIES`
  arrays near the top of `app.js`.
- **Colors** — edit the CSS custom properties at the top of
  `style.css` (`:root { --coral: ...; --mint: ...; }` etc).
