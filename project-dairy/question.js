document.addEventListener("DOMContentLoaded", function () {
  generateStars();
  generateCircles();

  window.addEventListener("resize", () => {
    clearTimeout(window.__circleTimer);
    window.__circleTimer = setTimeout(generateCircles, 120);
  });
});

/* =========================
   ⭐ STAR GENERATOR
========================= */

function generateStars() {
  const starContainer = document.querySelector(".star-container");
  if (!starContainer) return;

  starContainer.innerHTML = "";

  const totalStars = 15;
  const minDistance = 60; // ⭐⭐ 关键：星星之间的最小距离（px）
  const stars = [];

  const width = window.innerWidth;
  const height = window.innerHeight;

  let attempts = 0;
  const maxAttempts = 500; // 防止死循环

  while (stars.length < totalStars && attempts < maxAttempts) {
    attempts++;

    const x = Math.random() * width;
    const y = Math.random() * height;

    let tooClose = false;

    for (const s of stars) {
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      stars.push({ x, y });

      const star = document.createElement("i");
      star.className = "blinking-star fa fa-star";

      star.style.position = "absolute";
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.animationDelay = `${Math.random() * 2}s`;

      starContainer.appendChild(star);
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  generateCircles();

  // resize 时重新生成（防抖，避免疯狂重算）
  window.addEventListener("resize", () => {
    clearTimeout(window.__circleResizeTimer);
    window.__circleResizeTimer = setTimeout(generateCircles, 120);
  });
});

function generateCircles() {
  const container = document.querySelector(".circle-container");
  if (!container) return;

  // 🔥 先清空，避免叠加
  container.innerHTML = "";

  // ✅ 颜色池（保证每个一定有颜色）
  const colors = ["#d5ff8d", "#ff9ad8", "#88ccff"];

  // ✅ 用 CSS 变量控制尺寸/间距（没有就用默认）
  const styles = getComputedStyle(container);
  const circleSize = parseFloat(styles.getPropertyValue("--circle-size")) || 36;
  const gap = parseFloat(styles.getPropertyValue("--circle-gap")) || 10;

  // ✅ 用容器真实宽度来算（比 window.innerWidth 稳）
  const containerWidth = container.clientWidth || window.innerWidth;

  // ✅ 计算能放多少个
  const count = Math.max(1, Math.floor((containerWidth + gap) / (circleSize + gap)));

  for (let i = 0; i < count; i++) {
    const circle = document.createElement("div");
    circle.className = "circle";

    // ✅ 每个都强制赋色
    circle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    container.appendChild(circle);
  }
}
