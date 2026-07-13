const introScreen = document.getElementById("introScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const playAgainButton = document.getElementById("playAgainButton");
const retryButton = document.getElementById("retryButton");

const gameArea = document.getElementById("gameArea");
const basket = document.getElementById("basket");
const scoreValue = document.getElementById("scoreValue");
const livesValue = document.getElementById("livesValue");
const progressFill = document.getElementById("progressFill");
const gameHint = document.getElementById("gameHint");
const sparkles = document.getElementById("sparkles");
const confetti = document.getElementById("confetti");

const TARGET_SCORE = 15;
const STARTING_LIVES = 3;

let score = 0;
let lives = STARTING_LIVES;
let basketX = 50;
let gameRunning = false;
let spawnTimer = null;
let hearts = new Set();
let animationFrame = null;
let lastFrameTime = 0;

function showScreen(screen) {
  [introScreen, gameScreen, resultScreen, gameOverScreen].forEach((item) => {
    item.classList.remove("active");
  });
  screen.classList.add("active");
}

function updateHud() {
  scoreValue.textContent = `${score} / ${TARGET_SCORE}`;
  livesValue.textContent = lives > 0 ? "❤ ".repeat(lives).trim() : "—";
  progressFill.style.width = `${Math.min((score / TARGET_SCORE) * 100, 100)}%`;
}

function resetGame() {
  clearInterval(spawnTimer);
  cancelAnimationFrame(animationFrame);

  hearts.forEach((heart) => heart.element.remove());
  hearts.clear();

  score = 0;
  lives = STARTING_LIVES;
  basketX = 50;
  gameRunning = true;
  lastFrameTime = performance.now();

  basket.style.left = `${basketX}%`;
  gameHint.textContent = "Catch the falling hearts!";
  updateHud();
  showScreen(gameScreen);

  spawnHeart();
  spawnTimer = setInterval(spawnHeart, 680);
  animationFrame = requestAnimationFrame(gameLoop);
}

function spawnHeart() {
  if (!gameRunning) return;

  const heart = document.createElement("div");
  const isSpecial = Math.random() < 0.12;

  heart.className = `falling-heart${isSpecial ? " special" : ""}`;
  heart.textContent = "❤";

  const heartSize = isSpecial ? 48 : 42;
  const maxX = Math.max(20, gameArea.clientWidth - heartSize - 20);
  const x = 20 + Math.random() * (maxX - 20);
  const speed = (isSpecial ? 205 : 170) + Math.random() * 80;

  heart.style.left = `${x}px`;
  heart.style.width = `${heartSize}px`;
  heart.style.height = `${heartSize}px`;
  heart.style.fontSize = `${heartSize - 5}px`;
  heart.style.animationDuration = `${3.4 + Math.random() * 1.4}s, 1.2s`;

  gameArea.appendChild(heart);

  hearts.add({
    element: heart,
    x,
    y: -60,
    size: heartSize,
    speed,
    value: isSpecial ? 2 : 1
  });
}

function getBasketRectRelative() {
  const areaRect = gameArea.getBoundingClientRect();
  const basketRect = basket.getBoundingClientRect();

  return {
    left: basketRect.left - areaRect.left,
    right: basketRect.right - areaRect.left,
    top: basketRect.top - areaRect.top,
    bottom: basketRect.bottom - areaRect.top
  };
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const delta = Math.min((timestamp - lastFrameTime) / 1000, 0.035);
  lastFrameTime = timestamp;

  const basketRect = getBasketRectRelative();
  const areaHeight = gameArea.clientHeight;

  hearts.forEach((heart) => {
    heart.y += heart.speed * delta;
    heart.element.style.top = `${heart.y}px`;

    const heartLeft = heart.x;
    const heartRight = heart.x + heart.size;
    const heartTop = heart.y;
    const heartBottom = heart.y + heart.size;

    const caught =
      heartBottom >= basketRect.top + 8 &&
      heartTop <= basketRect.bottom &&
      heartRight >= basketRect.left + 8 &&
      heartLeft <= basketRect.right - 8;

    if (caught) {
      catchHeart(heart, basketRect);
      return;
    }

    if (heart.y > areaHeight + 10) {
      missHeart(heart);
    }
  });

  animationFrame = requestAnimationFrame(gameLoop);
}

function catchHeart(heart, basketRect) {
  heart.element.remove();
  hearts.delete(heart);

  score += heart.value;
  if (score > TARGET_SCORE) score = TARGET_SCORE;

  showCatchPop(
    heart.value === 2 ? "+2 Golden Heart!" : "+1",
    basketRect.left + (basketRect.right - basketRect.left) / 2,
    basketRect.top
  );

  burstSparkles(
    basketRect.left + (basketRect.right - basketRect.left) / 2,
    basketRect.top + 12,
    heart.value === 2 ? 16 : 9
  );

  basket.animate(
    [
      { transform: "translateX(-50%) scale(1)" },
      { transform: "translateX(-50%) scale(1.12)" },
      { transform: "translateX(-50%) scale(1)" }
    ],
    { duration: 250 }
  );

  updateHud();

  if (score >= TARGET_SCORE) {
    winGame();
  }
}

function missHeart(heart) {
  heart.element.remove();
  hearts.delete(heart);

  lives -= 1;
  updateHud();

  gameArea.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(0)" }
    ],
    { duration: 220 }
  );

  gameHint.textContent = lives > 0
    ? "Oops! Don't let the next heart get away."
    : "No more lives.";

  if (lives <= 0) {
    endGame(false);
  }
}

function showCatchPop(text, x, y) {
  const pop = document.createElement("div");
  pop.className = "catch-pop";
  pop.textContent = text;
  pop.style.left = `${x - 24}px`;
  pop.style.top = `${y - 8}px`;
  gameArea.appendChild(pop);

  setTimeout(() => pop.remove(), 700);
}

function burstSparkles(x, y, amount) {
  for (let i = 0; i < amount; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;

    const angle = (Math.PI * 2 * i) / amount;
    const distance = 24 + Math.random() * 38;
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance}px`);

    sparkles.appendChild(spark);
    setTimeout(() => spark.remove(), 650);
  }
}

function winGame() {
  gameRunning = false;
  clearInterval(spawnTimer);
  cancelAnimationFrame(animationFrame);

  hearts.forEach((heart) => heart.element.remove());
  hearts.clear();

  setTimeout(() => {
    showScreen(resultScreen);
    createConfetti();
  }, 450);
}

function endGame(won) {
  gameRunning = false;
  clearInterval(spawnTimer);
  cancelAnimationFrame(animationFrame);

  hearts.forEach((heart) => heart.element.remove());
  hearts.clear();

  if (!won) {
    setTimeout(() => showScreen(gameOverScreen), 350);
  }
}

function createConfetti() {
  confetti.innerHTML = "";

  const colors = ["#ff7eb2", "#e94e8d", "#ffd166", "#a978e8", "#ffffff"];

  for (let i = 0; i < 55; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const left = Math.random() * 100;
    const delay = Math.random() * 2.5;
    const duration = 4.5 + Math.random() * 3;
    const drift = `${-120 + Math.random() * 240}px`;
    const spin = `${360 + Math.random() * 900}deg`;

    piece.style.left = `${left}%`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${duration}s`;
    piece.style.setProperty("--drift", drift);
    piece.style.setProperty("--spin", spin);
    piece.style.setProperty(
      "--piece-color",
      colors[Math.floor(Math.random() * colors.length)]
    );

    confetti.appendChild(piece);
  }
}

function moveBasket(clientX) {
  if (!gameRunning) return;

  const areaRect = gameArea.getBoundingClientRect();
  const relativeX = clientX - areaRect.left;
  const percentage = (relativeX / areaRect.width) * 100;

  basketX = Math.max(8, Math.min(92, percentage));
  basket.style.left = `${basketX}%`;
}

gameArea.addEventListener("pointermove", (event) => {
  moveBasket(event.clientX);
});

gameArea.addEventListener("pointerdown", (event) => {
  if (gameArea.setPointerCapture) { gameArea.setPointerCapture(event.pointerId); }
  moveBasket(event.clientX);
});

gameArea.addEventListener("touchmove", (event) => {
  if (event.touches[0]) {
    moveBasket(event.touches[0].clientX);
  }
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft") {
    basketX = Math.max(8, basketX - 5);
    basket.style.left = `${basketX}%`;
  }

  if (event.key === "ArrowRight") {
    basketX = Math.min(92, basketX + 5);
    basket.style.left = `${basketX}%`;
  }
});

function initializeGame() {
  startButton.addEventListener("click", resetGame);
  playAgainButton.addEventListener("click", resetGame);
  retryButton.addEventListener("click", resetGame);
  showScreen(introScreen);
}

initializeGame();
