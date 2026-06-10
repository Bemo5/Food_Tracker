# Food Tracker

A simple calorie & nutrition tracker built for easy daily use. Runs entirely in the
browser — no server, no login. Works offline and installs on iPhone from Safari.

---

## How to use

1. Open the link (see *Deploy* below) in Safari on the iPhone.
2. Tap **Share → Add to Home Screen** to install it as an app icon.
3. Enter your name and daily calorie goal — remembered on that phone.
4. Tap **Add Food**, pick a food, choose a portion (e.g. "1 egg") or
   adjust the grams, tap **Add**.
5. Calories update instantly. Recently used foods appear under
   **Quick add** on the Today screen. Tap any logged item to edit its
   amount, or ✕ to delete it. Tap a day in **History** to see what
   was eaten.

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
  serving:    { label: "1 cup", grams: 80 },   // optional portion shortcut
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

**Quick way (in the app):** Tap ⚙️ Settings → change numbers → Save Changes.  
Note: goals set in-app are saved per device. If you want to change the defaults
shown on the onboarding screen of a fresh phone, edit `config.js`:

```js
const DEFAULTS = {
  goalKcal:    1800,
  goalProtein: 80,
  goalCarbs:   200,
  goalFat:     60,
};
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
Nothing is ever sent to a server — each phone keeps its own data.

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
