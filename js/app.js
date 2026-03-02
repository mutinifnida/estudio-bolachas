(() => {
  const list = document.getElementById("radialList");
  const items = Array.from(list.querySelectorAll(".radial__item"));

  const dotsWrap = document.getElementById("radialDots");
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".dot")) : [];

  const count = items.length;
  const step = 360 / count;

  const startIndex = Math.floor(Math.random() * count);
  let rotation = -startIndex * step;
  let targetRotation = rotation;

  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const FOLLOW = 0.14;

  const DRAG_SENS = 0.55;
  const WHEEL_SENS = 0.32;
  const bodyEl = document.body;

  let isContentMode = false;
  const contentTitleEl = document.getElementById("contentTitle");
  const contentPanelBodyEl = document.getElementById("contentPanelBody");

  let currentSectionKey = null;

  function renderSection(key) {
    if (!contentPanelBodyEl) return;

    const tpl = document.getElementById(`tpl-${key}`);
    if (!tpl) {
      contentPanelBodyEl.innerHTML = `
      <p class="contentPanel__placeholder">
        Conteúdo da seção <strong>${key}</strong> ainda não foi criado.
      </p>
    `;
      return;
    }

    const fragment = tpl.content.cloneNode(true);
    contentPanelBodyEl.innerHTML = "";
    contentPanelBodyEl.appendChild(fragment);

    const zipper = contentPanelBodyEl.querySelector(".zipper");
    if (zipper) initZipper(zipper);
  }

  const contentBackBtn = document.getElementById("contentBack");
  if (contentBackBtn) {
    contentBackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeContentMode();
    });
  }

  const contentBackdropEl = document.getElementById("contentBackdrop");
  const contentPanelEl = document.getElementById("contentPanel");

  if (contentBackdropEl) {
    contentBackdropEl.addEventListener("click", (e) => {
      e.preventDefault();
      closeContentMode();
    });
  }

  if (contentPanelEl) {
    contentPanelEl.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  function openContentMode(titleText, key) {
    isContentMode = true;
    bodyEl.classList.add("mode-content");

    const title = titleText || "";
    currentSectionKey = key || null;

    if (contentTitleEl) contentTitleEl.textContent = title;

    if (currentSectionKey) renderSection(currentSectionKey);
  }

  function closeContentMode() {
    isContentMode = false;
    bodyEl.classList.remove("mode-content");
    currentSectionKey = null;

    if (contentTitleEl) contentTitleEl.textContent = "";
    if (contentPanelBodyEl) {
      contentPanelBodyEl.innerHTML = `<p class="contentPanel__placeholder">Conteúdo da seção (em breve).</p>`;
    }
  }

  const radialEl = document.querySelector(".radial");

  let rosetaDir = Math.random() < 0.5 ? -1 : 1;
  let rosetaBase = 0;
  let lastTime = performance.now();

  const ROSETA_BASE_SPEED = 2.2;
  const ROSETA_REACT_FACTOR = 0.14;

  let rosetaBoost = 0;
  const ROSETA_BOOST_SPEED = 14;
  const ROSETA_BOOST_DECAY = 2.8;

  function updateBackgroundVars(rot) {
    const x = Math.sin((rot * Math.PI) / 180) * 26;
    const y = Math.cos((rot * Math.PI) / 180) * 18;

    bodyEl.style.setProperty("--bgx", `${x.toFixed(2)}px`);
    bodyEl.style.setProperty("--bgy", `${y.toFixed(2)}px`);
  }

  let snapTimer = null;

  function getRadiusPx() {
    const radiusStr = getComputedStyle(list).getPropertyValue("--radius").trim();
    return parseFloat(radiusStr) || 220;
  }
  let cachedRadius = getRadiusPx();

  function normalizeDeg(d) {
    let x = d % 360;
    if (x < -180) x += 360;
    if (x > 180) x -= 360;
    return x;
  }

  function closestIndexAt(rot) {
    let best = 0;
    let bestAbs = Infinity;

    for (let i = 0; i < count; i++) {
      const angle = normalizeDeg(i * step + rot);
      const a = Math.abs(angle);
      if (a < bestAbs) {
        bestAbs = a;
        best = i;
      }
    }
    return best;
  }

  function setActive(idx) {
    items.forEach((el, i) => el.classList.toggle("is-active", i === idx));
  }

  function updateDots(rot) {
    if (!dots.length) return;

    for (let i = 0; i < dots.length; i++) {
      const angle = i * step + rot;
      const dist = Math.abs(normalizeDeg(angle));

      const focus = Math.max(0, 1 - dist / 120);

      const scale = 0.7 + focus * 0.6;
      const opacity = 0.35 + focus * 0.65;

      dots[i].style.transform = `scale(${scale.toFixed(3)})`;
      dots[i].style.opacity = opacity.toFixed(3);
    }

    const idx = closestIndexAt(rot);
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }

  function layout(rot) {
    const radius = cachedRadius;

    for (let i = 0; i < count; i++) {
      const angle = i * step + rot;

      const dist = Math.abs(normalizeDeg(angle));

      const focus = Math.max(0, 1 - dist / 120);

      const scale = 0.6 + focus * 0.7;
      const opacity = 0.35 + focus * 0.65;

      const t =
        `translate(-50%, -50%) ` +
        `rotate(${angle}deg) ` +
        `translate(${radius}px) ` +
        `rotate(${-angle}deg) ` +
        `scale(${scale.toFixed(3)})`;

      items[i].style.transform = t;
      items[i].style.opacity = opacity.toFixed(3);
    }

    setActive(closestIndexAt(rot));
    updateDots(rot);
    updateBackgroundVars(rot);
  }

  function scheduleSnap(delay = 160) {
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(() => snapToClosest(), delay);
  }

  function nearestEquivalent(target, current) {
    const k = Math.round((current - target) / 360);
    return target + 360 * k;
  }

  function snapToClosest() {
    const idx = closestIndexAt(targetRotation);
    const baseTarget = -idx * step;
    const bestTarget = nearestEquivalent(baseTarget, rotation);
    targetRotation = bestTarget;

    rosetaBoost = Math.max(rosetaBoost, 0.35);

    bodyEl.classList.add("is-snapping");
    clearTimeout(bodyEl.__snapTO);
    bodyEl.__snapTO = setTimeout(() => bodyEl.classList.remove("is-snapping"), 240);
  }

  function tick() {
    const diff = targetRotation - rotation;

    rotation += diff * FOLLOW;

    if (Math.abs(diff) < 0.001) rotation = targetRotation;

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

  items.forEach((el, i) => {
    el.addEventListener("click", () => {
      if (isContentMode) return;

      const activeIdx = closestIndexAt(rotation);

      if (i === activeIdx) {
        openContentMode(el.textContent?.trim() || "", el.dataset.key);
        return;
      }

      const baseTarget = -i * step;
      targetRotation = nearestEquivalent(baseTarget, rotation);
      scheduleSnap(0);
    });
  });

  function onDown(x, y) {
    isDragging = true;
    lastX = x;
    lastY = y;
    if (snapTimer) clearTimeout(snapTimer);
  }

  function onMove(x, y) {
    if (isContentMode) return;
    if (!isDragging) return;

    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;

    const delta = (dx - dy) * DRAG_SENS;

    targetRotation += delta;

    rosetaBoost = 1;
    rosetaDir = Math.sign(delta) || rosetaDir;

    rotation = targetRotation;
  }

  function onUp() {
    if (!isDragging) return;
    isDragging = false;
    scheduleSnap(120);
  }

  window.addEventListener("mousedown", (e) => onDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onUp);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isContentMode) closeContentMode();
  });

  window.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    { passive: true }
  );

  window.addEventListener("touchend", onUp);

  window.addEventListener(
    "wheel",
    (e) => {
      if (isContentMode) return;

      e.preventDefault();
      targetRotation += e.deltaY * WHEEL_SENS;

      rosetaBoost = 1;
      rosetaDir = Math.sign(e.deltaY) || rosetaDir;

      scheduleSnap(180);
    },
    { passive: false }
  );

  window.addEventListener("resize", () => {
    cachedRadius = getRadiusPx();
  });

  cachedRadius = getRadiusPx();
  layout(rotation);
  requestAnimationFrame(tick);

  function initZipper(zipperEl) {
    if (!zipperEl) return;

    const knob = zipperEl.querySelector(".zipper__knob");
    if (!knob) return;

    let dragging = false;
    let x = 120;

    function setX(px) {
      x = px;
      zipperEl.style.setProperty("--zipX", `${px}px`);
    }

    function clamp(n, a, b) {
      return Math.max(a, Math.min(b, n));
    }
    function pointerX(e) {
      return e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    }

    function bounds() {
      const r = zipperEl.getBoundingClientRect();
      const minX = r.left + 20;
      const maxX = r.right - 20;
      return { minX, maxX, left: r.left };
    }

    function onDown(e) {
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();

      const b = bounds();
      const px = clamp(pointerX(e), b.minX, b.maxX);
      setX(px - b.left);
    }

    function onUp(e) {
      if (!dragging) return;
      e.preventDefault();
      dragging = false;

      setX(120);
    }

    knob.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: false });

    knob.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp, { passive: false });
  }
})();
