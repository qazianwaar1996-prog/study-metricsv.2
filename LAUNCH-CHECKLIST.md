# Study Metrics — Launch Checklist

Work top to bottom. Each phase depends on the one before it.

---

## Phase 0 — Prep the files (before anything goes live)

- [ ] Put all files in ONE folder. Rename the landing page to **`index.html`** (this is the homepage).
- [ ] Convert **favicon.svg → favicon.png** (any free SVG-to-PNG converter). Keep both in the root.
- [ ] Convert **og-image.svg → og-image.png** at 1200×630. Keep in the root.
- [ ] Find-and-replace **`studymetrics.app`** with your real domain across ALL files (HTML, sitemap.xml, robots.txt).
- [ ] Replace **`hello@studymetrics.app`** with your real email (about, contact, privacy, terms).
- [ ] Confirm the folder has every file:
  - **HTML Pages:** index, gpa, cgpa, target-gpa, final-grade, grade-calculator, percentage-calculator, attendance-calculator, word-counter, about, contact, privacy-policy, terms-and-conditions, disclaimer, 404, blog.
  - **CSS:** style.css, gpa-converter.css.
  - **JS:** script.js, gpa.js, cgpa.js, target-gpa.js, final-grade.js, grade-calculator.js, percentage-calculator.js, attendance-calculator.js, word-counter.js, gpa-converter.js.
  - **Assets:** favicon.svg, favicon.png, og-image.png, sitemap.xml, robots.txt, manifest.json, service-worker.js.

## Phase 1 — Test locally

- [ ] Open `index.html` in a browser. Click every nav + footer link, confirm none 404.
- [ ] Open each tool, enter numbers, confirm the math works and results update live.
- [ ] Check the tab shows your favicon.
- [ ] Resize to phone width, confirm the hamburger menu and layouts work.

## Phase 2 — GitHub + go live (free)

- [ ] Create a free GitHub account.
- [ ] New repository → name it (e.g. `study-metrics`) → set **Public** → Create.
- [ ] **Add file → Upload files** → drag the whole folder in → Commit.
- [ ] **Settings → Pages** → Source: *Deploy from a branch* → Branch: **main** → Folder: **/ (root)** → Save.
- [ ] Wait ~1 min. Visit `https://YOURNAME.github.io/study-metrics/` and re-test everything.

## Phase 3 — Domain

- [ ] Buy the domain (Namecheap, Cloudflare, Porkbun are cheap and clean).
- [ ] In GitHub **Settings → Pages → Custom domain**, enter your domain, Save.
- [ ] At your registrar, add the DNS records GitHub shows (usually 4 A records + a CNAME).
- [ ] Tick **Enforce HTTPS** once it's available (may take an hour or two).

## Phase 4 — Search Console (do the day you're live)

- [ ] Add your site at **search.google.com/search-console** and verify ownership.
- [ ] Submit **sitemap.xml**.
- [ ] Use "URL Inspection" to request indexing on your homepage + top 3 tools.
- [ ] Test a tool page in the **Rich Results Test** to confirm the FAQ schema is detected.

## Phase 5 — AdSense (only AFTER the site is live + has real content)

- [ ] Sign up at **adsense.google.com** with your domain.
- [ ] Paste the AdSense loader `<script>` into the `<head>` of every page.
- [ ] Submit for review. **Don't panic if it takes days/weeks.**
- [ ] Once approved: replace each `.ad-slot` placeholder block with your real `<ins class="adsbygoogle">` ad unit.

> ⚠️ Do NOT apply to AdSense until the site is fully live with working tools and the legal pages filled in. 

## Phase 6 — SEO growth (ongoing)

- [ ] Write blog posts targeting long-tail searches: "how to convert CGPA to GPA", "how many classes can I skip at 75%", "what do I need on my final to get an A".
- [ ] Add internal links from blog posts to the relevant tool.
- [ ] Get a few backlinks (student subreddits, forums, your uni's resource pages).
- [ ] Check Search Console monthly, see what queries you rank for, and expand those pages.

---

## Your edge over Scholaro
- Genuinely free, no daily limit, no login, no paywall.
- Faster (single-file pages, instant load).
- FAQ schema = your Q&As show directly in Google results.
- Broader toolkit (GPA + attendance + percentage + word counter), not just GPA.

## Current status: site is BUILT
14 pages, 9 working tools, branded, SEO-loaded, AdSense-ready.
