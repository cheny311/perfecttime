let chimes = [];
let sounds = [];
let startedAudio = false;
let cnv;
let containerEl;

const WORDS = ["哈", "哈哈", "哈哈哈"];
const FILES = ["Haha.mp3", "Haha2.mp3", "Haha3.mp3"];

function preload() {
  soundFormats("mp3", "wav", "ogg");
  for (let i = 0; i < FILES.length; i++) {
    sounds[i] = loadSound(FILES[i]);
  }
}

function setup() {
  containerEl = document.getElementById("p5-container");
  const { w, h } = getCanvasSize();

  cnv = createCanvas(w, h);
  if (containerEl) {
    cnv.parent(containerEl);
    cnv.elt.style.display = "block";
  }

  // 确保键盘事件可用
  cnv.elt.tabIndex = 0;
  cnv.elt.focus();
  angleMode(RADIANS);
  textAlign(CENTER, TOP);
  noCursor();

  // const yTop = height * 0.18;
  // const spacing = width / (WORDS.length + 1);
  // for (let i = 0; i < WORDS.length; i++) {
  //   const x = spacing * (i + 1);
  //   chimes.push(new TextChime(x, yTop, WORDS[i], sounds[i % sounds.length]));
  // }
  const spacing = width / (WORDS.length + 1);
  for (let i = 0; i < WORDS.length; i++) {
    const x = spacing * (i + 1);

    // 根据索引调整高度（单位：像素）
    let offsetY = 0;
    if (i === 0) offsetY = -40; // 下移 10px
    if (i === 2) offsetY = 50;

    const y = height * 0.18 + offsetY;
    const stringScale = i === 0 ? 0.75 : 1; // 最左侧更短
    chimes.push(
      new TextChime(x, y, WORDS[i], sounds[i % sounds.length], stringScale)
    );
  }
}

function draw() {
  background(245);

  for (const c of chimes) {
    c.update();
    c.draw();
  }

  // 光标圆点
  noFill();
  stroke(220);
  circle(mouseX, mouseY, 18);

  // 粉色杠子置于最上层
  drawHeader();

  if (!startedAudio) {
    push();
    fill(0, 180);
    rect(0, 0, width, height);
    fill(255);
    noStroke();
    textSize(18);
    textAlign(CENTER, CENTER);
    text("Click to enable audio", width / 2, height / 2);
    pop();
  }
}

function mousePressed() {
  if (!isInsideCanvas(event)) return;

  if (!startedAudio) {
    userStartAudio();
    startedAudio = true;
  }
}

function touchStarted() {
  if (!isInsideCanvas(event)) return;

  if (!startedAudio) {
    userStartAudio();
    startedAudio = true;
  }
}

function windowResized() {
  const { w, h } = getCanvasSize();
  resizeCanvas(w, h);
  const yTop = height * 0.18;
  const spacing = width / (chimes.length + 1);
  const baseLen = min(height * 0.36, 320);
  for (let i = 0; i < chimes.length; i++) {
    chimes[i].setAnchor(
      spacing * (i + 1),
      yTop + (i === 0 ? -50 : i === 2 ? 60 : 0)
    );
    chimes[i].updateStringLen(baseLen);
  }
}

function getCanvasSize() {
  if (containerEl) {
    const rect = containerEl.getBoundingClientRect();
    return {
      w: Math.max(200, rect.width),
      h: Math.max(200, rect.height),
    };
  }
  return { w: windowWidth, h: windowHeight };
}

function isInsideCanvas(evt) {
  if (!cnv) return true;
  const rect = cnv.elt.getBoundingClientRect();

  // 优先使用事件坐标
  if (evt?.clientX !== undefined && evt?.clientY !== undefined) {
    const x = evt.clientX;
    const y = evt.clientY;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  // 触屏兼容（取第一触点）
  if (evt?.touches?.length) {
    const t = evt.touches[0];
    return t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom;
  }

  // 兜底：使用 p5 的 mouseX/mouseY（相对画布）
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

function drawHeader() {
  push();
  noStroke();
  fill(255, 0, 127);

  // 将坐标原点移到画布中心再旋转
  translate(width / 2, height * 0.12);
  rotate(radians(25)); // ← 旋转 30 度
  rectMode(CENTER);
  rect(0, 25, width, 18, 4);

  pop();
}

class TextChime {
  constructor(anchorX, anchorY, word, snd, stringScale = 1) {
    this.anchor = createVector(anchorX, anchorY);
    this.word = word;
    this.snd = snd;
    this.stringScale = stringScale;

    // 视觉参数
    this.baseStringLen = min(height * 0.36, 320);
    this.stringLen = this.baseStringLen * this.stringScale;
    this.fontSize = max(32, min(width, height) * 0.06); // 自适应字号
    this.textOffset = 20; // 从横梁到文字顶部的距离
    this.hoverRadius = 80; // 触发范围（中心在“撞锤/摆锤”附近）

    // 动画参数（摆动）
    this.angle = 0;
    this.angularVel = 0;
    this.damping = 0.985;
    this.spring = 0.018;
    this.hoverKick = 0.035;
    this.windOffset = random(1000);
    this.windStrength = 0.01; // 微风强度

    // 状态
    this.isHover = false;
    this.wasHover = false;
    this.cooldownMs = 250; // 避免连续触发太频繁
    this.lastPlay = -9999;
  }

  setAnchor(x, y) {
    this.anchor.set(x, y);
  }

  updateStringLen(base) {
    this.baseStringLen = base;
    this.stringLen = this.baseStringLen * this.stringScale;
  }

  getBob() {
    // 绳子末端（摆锤位置），文字围绕此点轻摆
    const x = this.anchor.x + sin(this.angle) * this.stringLen;
    const y = this.anchor.y + cos(this.angle) * this.stringLen;
    return createVector(x, y);
  }

  update() {
    const bob = this.getBob();
    const d = dist(mouseX, mouseY, bob.x, bob.y);
    this.isHover = d < this.hoverRadius;

    if (this.isHover && !this.wasHover) {
      this.angularVel +=
        mouseX < this.anchor.x ? -this.hoverKick : this.hoverKick;
      const now = millis();
      if (startedAudio && this.snd && now - this.lastPlay > this.cooldownMs) {
        // 为避免堆叠，这里先停再播；如果想重叠，把 stop() 删掉
        // this.snd.stop();
        this.snd.setVolume(0.9);
        this.snd.rate(1.0);
        this.snd.play();
        this.lastPlay = now;
      }
    }
    this.wasHover = this.isHover;

    const target = 0;
    const force = -this.spring * (this.angle - target);
    this.angularVel += force;
    this.angularVel *= this.damping;
    this.angle += this.angularVel;

    // 微风噪声
    const breeze =
      (noise(this.windOffset + frameCount * 0.01) - 0.5) * this.windStrength;
    this.angle += breeze;

    if (this.isHover) {
      this.angle += 0.002 * sin(frameCount * 0.25);
    }
  }

  draw() {
    const bob = this.getBob();

    stroke(153, 255, 51);
    strokeWeight(5);
    line(this.anchor.x, this.anchor.y, bob.x, bob.y);

    noStroke();
    fill(255, 0, 127);
    circle(bob.x, bob.y, 14);

    const headW = this.fontSize * 0.9;
    const headH = 6;
    push();
    translate(bob.x, bob.y + 10);
    rotate(this.angle * 0.7);

    fill(102, 178, 255);
    rectMode(CENTER);
    rect(0, 0, headW, headH, 3);

    translate(0, this.textOffset);

    let scaleAmt = 1 + 0.03 * sin(frameCount * 0.15 + this.anchor.x * 0.01);
    if (this.isHover) scaleAmt *= 1.1;
    const jitterX = this.isHover
      ? sin(frameCount * 0.6 + this.anchor.x) * 1.5
      : 0;
    const jitterY = this.isHover
      ? cos(frameCount * 0.7 + this.anchor.y) * 1.5
      : 0;

    translate(jitterX, jitterY);
    scale(scaleAmt);

    fill(153, 204, 255);
    noStroke();
    textSize(this.fontSize);
    textAlign(CENTER, TOP);
    text(this.word, 0, 0);
    textStyle(BOLD);
    pop();

    if (this.isHover) {
      noFill();
      stroke(150, 180);
      strokeWeight(1.5);
      circle(bob.x, bob.y, this.hoverRadius * 1.05);
    }
  }
}
