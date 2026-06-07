// ============================================================
//  FOOD CATALOG  —  Admin editable
//
//  To ADD a food:
//    1. (Optional) Put a photo in  images/foods/yourfood.jpg
//    2. Add an entry below. Set photo: null to use the emoji instead.
//
//  Nutrition values are PER 100 GRAMS (cooked weight where relevant).
// ============================================================

const FOODS = [
  {
    id: "egg",
    name: "Egg",
    emoji: "🥚",
    photo: null,                        // e.g. "images/foods/egg.jpg"
    cardColor: "#FFF8E1",
    per100g: { kcal: 155, protein: 13.0, carbs: 1.1, fat: 11.0 },
  },
  {
    id: "chicken",
    name: "Chicken Breast",
    emoji: "🍗",
    photo: null,
    cardColor: "#FFF3E0",
    per100g: { kcal: 165, protein: 31.0, carbs: 0.0, fat: 3.6 },
  },
  {
    id: "salmon",
    name: "Salmon",
    emoji: "🐟",
    photo: null,
    cardColor: "#FBE9E7",
    per100g: { kcal: 208, protein: 20.0, carbs: 0.0, fat: 13.0 },
  },
  {
    id: "rice",
    name: "White Rice",
    emoji: "🍚",
    photo: null,
    cardColor: "#FFFFF0",
    per100g: { kcal: 130, protein: 2.7, carbs: 28.0, fat: 0.3 },
  },
  {
    id: "bread",
    name: "White Bread",
    emoji: "🍞",
    photo: null,
    cardColor: "#FFF9C4",
    per100g: { kcal: 265, protein: 9.0, carbs: 49.0, fat: 3.2 },
  },
  {
    id: "potato",
    name: "Boiled Potato",
    emoji: "🥔",
    photo: null,
    cardColor: "#FFFDE7",
    per100g: { kcal: 87, protein: 1.9, carbs: 20.0, fat: 0.1 },
  },
  {
    id: "lentils",
    name: "Cooked Lentils",
    emoji: "🫘",
    photo: null,
    cardColor: "#F9FBE7",
    per100g: { kcal: 116, protein: 9.0, carbs: 20.0, fat: 0.4 },
  },
  {
    id: "apple",
    name: "Apple",
    emoji: "🍎",
    photo: null,
    cardColor: "#FCE4EC",
    per100g: { kcal: 52, protein: 0.3, carbs: 14.0, fat: 0.2 },
  },
  {
    id: "banana",
    name: "Banana",
    emoji: "🍌",
    photo: null,
    cardColor: "#FFFDE7",
    per100g: { kcal: 89, protein: 1.1, carbs: 23.0, fat: 0.3 },
  },
  {
    id: "yogurt",
    name: "Plain Yogurt",
    emoji: "🥛",
    photo: null,
    cardColor: "#E3F2FD",
    per100g: { kcal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  },
  {
    id: "avocado",
    name: "Avocado",
    emoji: "🥑",
    photo: null,
    cardColor: "#F1F8E9",
    per100g: { kcal: 160, protein: 2.0, carbs: 9.0, fat: 15.0 },
  },
  {
    id: "olive_oil",
    name: "Olive Oil",
    emoji: "🫒",
    photo: null,
    cardColor: "#F9FBE7",
    per100g: { kcal: 884, protein: 0.0, carbs: 0.0, fat: 100.0 },
  },
];
