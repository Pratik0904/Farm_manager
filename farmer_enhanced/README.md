# 🌾 FarmLedger — Crop Financial Intelligence

A clean, well-structured frontend web app for tracking farm expenses, sales, and profitability.

---

## 📁 Project Structure

```
farmledger/
│
├── index.html              ← Main entry point (HTML markup only)
│
├── css/
│   ├── variables.css       ← CSS custom properties (design tokens) & reset
│   ├── auth.css            ← Login & register page styles
│   ├── layout.css          ← App shell: sidebar, main content, header, responsive
│   ├── components.css      ← Reusable UI: forms, buttons, cards, modals, toasts, badges
│   └── pages.css           ← Page-specific styles: dashboard, crops, expenses, sales, compare
│
├── js/
│   ├── state.js            ← Global app state, demo data, constants (CROP_IMAGES, CAT_ICONS…)
│   ├── helpers.js          ← Pure utility functions (fmtNum, formatDate, animateCount, showToast…)
│   ├── auth.js             ← Navigation, login, register, logout, password validation
│   ├── modals.js           ← Modal open/close, crop-select population, FAB handler
│   ├── crops.js            ← Add crop form, renderCrops(), crop land preview
│   ├── expenses.js         ← Add expense form, renderExpenses(), category breakdown
│   ├── sales.js            ← Add sale form, updateSalePreview(), renderSales()
│   ├── dashboard.js        ← renderDashboard() + all SVG chart renderers + compare tab
│   └── app.js              ← DOMContentLoaded init, event listener wiring
│
└── assets/
    └── images/             ← Place any local images here (currently uses Unsplash CDN)
```

---

## 🚀 How to Run

Just open `index.html` in a browser — no build step needed.

**Demo login:**
- Email: `demo@farm.com`
- Password: `Demo@1234`

---

## 🏗️ How to Expand

| Goal | Where to touch |
|------|----------------|
| Add a new page/tab | Add HTML tab in `index.html`, add nav item in sidebar, add `renderXxx()` in a new `js/xxx.js`, wire it in `auth.js` → `renderTab()` |
| Add a new chart | Add SVG element in `index.html`, write render function in `dashboard.js` |
| Change design tokens | Edit `css/variables.css` |
| Add new crop categories | Edit the `<select>` in `index.html` and `CATEGORIES` / `CAT_ICONS` in `state.js` |
| Persist data (localStorage) | Wrap `state.users` reads/writes in `state.js` with `localStorage.getItem/setItem` |
| Add a backend API | Replace the in-memory `state.users` operations in `auth.js` with `fetch()` calls |
| Add more UI components | Add CSS to `components.css`, HTML to `index.html` |

---

## 📦 Tech Stack

- Vanilla HTML / CSS / JavaScript — zero dependencies, zero build tools
- Google Fonts: Playfair Display, DM Sans, DM Mono
- Unsplash CDN for crop imagery
- SVG-based charts (no chart library needed)
