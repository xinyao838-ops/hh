const state = {
  level: 100,
  mood: 0,
  sugar: 50,
  ice: 60,
  topping: "珍珠",
};

const milkTeaLevel = document.getElementById("milkTeaLevel");
const cupLabel = document.getElementById("cupLabel");
const moodText = document.getElementById("mood");
const recipeText = document.getElementById("recipeText");
const message = document.getElementById("message");

const sugar = document.getElementById("sugar");
const ice = document.getElementById("ice");
const topping = document.getElementById("topping");
const sipBtn = document.getElementById("sipBtn");
const bigSipBtn = document.getElementById("bigSipBtn");
const brewBtn = document.getElementById("brewBtn");

function getSugarLabel(value) {
  const map = { 0: "无糖", 30: "三分糖", 50: "五分糖", 70: "七分糖", 100: "全糖" };
  return map[value] || `${value}%糖`;
}

function getIceLabel(value) {
  const map = { 0: "去冰", 30: "微冰", 60: "少冰", 100: "正常冰" };
  return map[value] || `${value}%冰`;
}

function updateUI() {
  milkTeaLevel.style.height = `${state.level}%`;
  cupLabel.textContent = `${state.level}%`;
  moodText.textContent = String(state.mood);
  recipeText.textContent = `${getSugarLabel(state.sugar)} / ${getIceLabel(state.ice)} / ${state.topping}`;

  const finished = state.level <= 0;
  sipBtn.disabled = finished;
  bigSipBtn.disabled = finished;

  if (finished) {
    message.textContent = `喝完啦！你的快乐值达到 ${state.mood}。再做一杯继续！`;
  }
}

function calcMoodGain(amount) {
  let gain = Math.ceil(amount / 2);

  if (state.sugar >= 70) gain += 2;
  if (state.ice === 0) gain += 1;
  if (state.topping !== "无") gain += 2;

  return gain;
}

function drink(amount) {
  if (state.level <= 0) return;

  const actual = Math.min(amount, state.level);
  state.level -= actual;
  state.mood = Math.min(100, state.mood + calcMoodGain(actual));

  if (state.level > 0) {
    const words = ["好喝！", "顺滑！", "这口太满足了！", "奶香十足！"];
    message.textContent = words[Math.floor(Math.random() * words.length)];
  }

  updateUI();
}

function brewAgain() {
  state.level = 100;
  state.mood = 0;
  state.sugar = Number(sugar.value);
  state.ice = Number(ice.value);
  state.topping = topping.value;
  message.textContent = "新的一杯已做好，趁热（或趁冰）开喝！";
  updateUI();
}

sipBtn.addEventListener("click", () => drink(12));
bigSipBtn.addEventListener("click", () => drink(28));
brewBtn.addEventListener("click", brewAgain);

brewAgain();
