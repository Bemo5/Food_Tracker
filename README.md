# Food Tracker

A simple calorie & nutrition tracker built for easy daily use. Runs entirely in the
browser — no server, no login. Works offline and installs on iPhone from Safari.

---

## How to use

1. Open the link (see *Deploy* below) in Safari on the iPhone.
2. Tap **Share → Add to Home Screen** to install it as an app icon.
3. Pick a profile (Mom or Dad) — that choice is remembered on that phone.
4. Tap **Add Food**, pick a food photo, enter the grams eaten, tap **Add**.
5. Calories update instantly. Progress ring turns amber when close to goal,
   red when over.

---

## As admin — Adding a new food

1. **Open** `data/foods.js` in any text editor.
2. **Copy** one of the existing entries and paste it inside the `const FOODS = [...]` array.
3. **Fill in** the fields:

```js
{
  id:         "oats",           // unique short ID, no spaces
  name:       "Rolled Oats",    // name shown in the app
  emoji:      "🌾",             // shown when no photo
  photo:      null,             // or: "images/foods/oats.jpg"
  cardColor:  "#FFFDE7",        // background color of the card (optional, any light color)
  per100g: {
    kcal:    389,
    protein: 17,
    carbs:   66,
    fat:     7,
  },
},
```

4. **(Optional)** To add a real photo:
   - Save it in `images/foods/oats.jpg` (or .png, .webp).
   - Set `photo: "images/foods/oats.jpg"` in the entry.
   - Photo will be shown instead of the emoji.

5. **Save** the file and push to GitHub (see *Deploy*). Done!

---

## Changing daily goals

**Quick way (in the app):** Tap ⚙️ Settings → change numbers → Save Goals.  
Note: goals set in-app are saved per device. If you want to change the default
that appears on a fresh phone, edit `config.js`:

```js
const PROFILES = [
  { id: "mom", name: "Mom", goalKcal: 1600, goalProtein: 70, goalCarbs: 180, goalFat: 55, color: "#B71C1C" },
  { id: "dad", name: "Dad", goalKcal: 2000, goalProtein: 90, goalCarbs: 225, goalFat: 65, color: "#0D47A1" },
];
```

---

## Deploy to GitHub Pages

1. Create a new **public** GitHub repository (e.g. `food-tracker`).
2. Push this entire folder to the `main` branch.
3. Go to **Settings → Pages → Source → Deploy from branch** → select `main` / `/ (root)`.
4. GitHub Pages gives you a URL like `https://yourusername.github.io/food-tracker/`.
5. Share that link with your parents. They open it in Safari and tap
   **Share → Add to Home Screen**.

After the first load, the app works **offline** too (service worker caches everything).

---

## Data & privacy

All data is stored **only on the device** using browser localStorage.  
Nothing is ever sent to a server. Mom's phone has Mom's data; Dad's phone has Dad's.

---

## File overview

```
index.html          — app shell (all screens)
styles.css          — all styling (big text, high contrast, mobile-first)
app.js              — all logic (profiles, logging, totals, routing)
config.js           — profile names and daily goals ← edit this
data/foods.js       — food catalog                 ← edit this
images/foods/       — put food photos here
icons/              — home-screen icons
manifest.webmanifest — makes it installable as a PWA
service-worker.js   — offline caching
```
