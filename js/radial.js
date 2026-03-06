(function () {
  "use strict";

  const utils = window.BolachasUtils;
  const content = window.BolachasContent;

  if (!utils) {
    console.warn("BolachasUtils não encontrado.");
    return;
  }

  if (!content) {
    console.warn("BolachasContent não encontrado.");
    return;
  }

  const bodyEl = document.body;
  const radialEl = document.querySelector(".radial");
  const list = document.getElementById("radialList");

  if (!list) return;

  const items = Array.from(list.querySelectorAll(".radial__item"));

  const dotsWrap = document.getElementById("radialDots");
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".dot")) : [];

  const count = items.length;
  const step = 360 / count;

  const FOLLOW = 0.14;
  const DRAG_SENS = 0.55;
  const WHEEL_SENS = 0.32;

  const ROSETA_BASE_SPEED = 2.2;
  const ROSETA_REACT_FACTOR = 0.14;
  const ROSETA_BOOST_SPEED = 14;
  const ROSETA_BOOST_DECAY = 2.8;

  const startIndex = Math.floor(Math.random() * count);

  let rotation = -startIndex * step;
  let targetRotation = rotation;

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  let rosetaDir = Math.random() < 0.5 ? -1 : 1;
  let rosetaBase = 0;
  let rosetaBoost = 0;
  let lastTime = performance.now();

  let snapTimer = null;
  let cachedRadius = getRadiusPx();

  function getRadiusPx() {
    const radiusStr = getComputedStyle(list).getPropertyValue("--radius").trim();
    return parseFloat(radiusStr) || 220;
  }

  function closestIndexAt(rot) {
    let best = 0;
    let bestAbs = Infinity;

    for (let i = 0; i < count; i += 1) {
      const angle = utils.normalizeDeg(i * step + rot);
      const abs = Math.abs(angle);

      if (abs < bestAbs) {
        bestAbs = abs;
        best = i;
      }
    }

    return best;
  }

  function setActive(index) {
    items.forEach((item, i) => {
      item.classList.toggle("is-active", i === index);
    });
  }

  function updateBackgroundVars(rot) {
    const x = Math.sin((rot * Math.PI) / 180) * 26;
    const y = Math.cos((rot * Math.PI) / 180) * 18;

    bodyEl.style.setProperty("--bgx", `${x.toFixed(2)}px`);
    bodyEl.style.setProperty("--bgy", `${y.toFixed(2)}px`);
  }

  function updateDots(rot) {
    if (!dots.length) return;

    for (let i = 0; i < dots.length; i += 1) {
      const angle = i * step + rot;
      const dist = Math.abs(utils.normalizeDeg(angle));
      const focus = Math.max(0, 1 - dist / 120);

      const scale = 0.7 + focus * 0.6;
      const opacity = 0.35 + focus * 0.65;

      dots[i].style.transform = `scale(${scale.toFixed(3)})`;
      dots[i].style.opacity = opacity.toFixed(3);
    }

    const activeIndex = closestIndexAt(rot);

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === activeIndex);
    });
  }

  function layout(rot) {
    const radius = cachedRadius;

    for (let i = 0; i < count; i += 1) {
      const angle = i * step + rot;
      const dist = Math.abs(utils.normalizeDeg(angle));
      const focus = Math.max(0, 1 - dist / 120);

      const scale = 0.6 + focus * 0.7;
      const opacity = 0.35 + focus * 0.65;

      items[i].style.transform =
        `translate(-50%, -50%) ` +
        `rotate(${angle}deg) ` +
        `translate(${radius}px) ` +
        `rotate(${-angle}deg) ` +
        `scale(${scale.toFixed(3)})`;

      items[i].style.opacity = opacity.toFixed(3);
    }

    setActive(closestIndexAt(rot));
    updateDots(rot);
    updateBackgroundVars(rot);
  }

  function scheduleSnap(delay = 160) {
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      snapToClosest();
    }, delay);
  }

  function snapToClosest() {
    const index = closestIndexAt(targetRotation);
    const baseTarget = -index * step;
    const bestTarget = utils.nearestEquivalent(baseTarget, rotation);

    targetRotation = bestTarget;
    rosetaBoost = Math.max(rosetaBoost, 0.35);

    bodyEl.classList.add("is-snapping");

    clearTimeout(bodyEl.__snapTO);
    bodyEl.__snapTO = setTimeout(() => {
      bodyEl.classList.remove("is-snapping");
    }, 240);
  }

  function tick() {
    const diff = targetRotation - rotation;
    rotation += diff * FOLLOW;

    if (Math.abs(diff) < 0.001) {
      rotation = targetRotation;
    }

    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    rosetaBoost = Math.max(0, rosetaBoost - dt * ROSETA_BOOST_DECAY);

    const rosetaSpeed = ROSETA_BASE_SPEED + rosetaBoost * ROSETA_BOOST_SPEED;
    rosetaBase += rosetaDir * rosetaSpeed * dt;

    const rosetaAngle = rosetaBase + rotation * ROSETA_REACT_FACTOR;

    if (radialEl) {
      radialEl.style.setProperty("--rosetaAngle", `${rosetaAngle.toFixed(3)}deg`);
    }

    layout(rotation);
    requestAnimationFrame(tick);
  }

  function onDown(x, y) {
    if (!utils.siteIsOpen()) return;
    if (content.getIsContentMode()) return;

    isDragging = true;
    lastX = x;
    lastY = y;

    if (snapTimer) clearTimeout(snapTimer);
  }

  function onMove(x, y) {
    if (!utils.siteIsOpen()) return;
    if (content.getIsContentMode()) return;
    if (!isDragging) return;

    const dx = x - lastX;
    const dy = y - lastY;

    lastX = x;
    lastY = y;

    const delta = (dx - dy) * DRAG_SENS;

    targetRotation += delta;
    rotation = targetRotation;

    rosetaBoost = 1;
    rosetaDir = Math.sign(delta) || rosetaDir;
  }

  function onUp() {
    if (!utils.siteIsOpen()) return;
    if (!isDragging) return;

    isDragging = false;
    scheduleSnap(120);
  }

  function bindItemEvents() {
    items.forEach((item, index) => {
      item.addEventListener("click", () => {
        if (!utils.siteIsOpen()) return;
        if (content.getIsContentMode()) return;

        const activeIndex = closestIndexAt(rotation);

        if (index === activeIndex) {
          content.openContentMode(item.textContent?.trim() || "", item.dataset.key);
          return;
        }

        const baseTarget = -index * step;
        targetRotation = utils.nearestEquivalent(baseTarget, rotation);
        scheduleSnap(0);
      });
    });
  }

  function bindPointerEvents() {
    window.addEventListener("mousedown", (event) => {
      onDown(event.clientX, event.clientY);
    });

    window.addEventListener("mousemove", (event) => {
      onMove(event.clientX, event.clientY);
    });

    window.addEventListener("mouseup", onUp);

    window.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        onDown(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches[0];
        onMove(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    window.addEventListener("touchend", onUp);

    window.addEventListener(
      "wheel",
      (event) => {
        if (!utils.siteIsOpen()) return;
        if (content.getIsContentMode()) return;

        event.preventDefault();

        targetRotation += event.deltaY * WHEEL_SENS;

        rosetaBoost = 1;
        rosetaDir = Math.sign(event.deltaY) || rosetaDir;

        scheduleSnap(180);
      },
      { passive: false }
    );

    window.addEventListener("resize", () => {
      cachedRadius = getRadiusPx();
    });
  }

  bindItemEvents();
  bindPointerEvents();

  cachedRadius = getRadiusPx();
  layout(rotation);
  requestAnimationFrame(tick);
})();
