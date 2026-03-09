(() => {
  "use strict";

  let hasSlid = false;
  let isDragging = false;
  let dragMode = null; // "drop" | "swipe" | null

  const MOBILE_BP = 900;
  const MOBILE_RANGE = 0.78;
  const DESKTOP_PADDING_RIGHT = 20;
  const MIN_RADIUS = 120;

  /* Área central permitida para o gesto mobile */
  const SWIPE_ZONE_TOP = 0.22; // 22% da altura
  const SWIPE_ZONE_BOTTOM = 0.78; // 78% da altura

  let startLeft = MIN_RADIUS;
  let maxRight = window.innerWidth - DESKTOP_PADDING_RIGHT;
  let maxRadius = 0;

  /**
   * Limita um valor entre mínimo e máximo.
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Atualiza a variável de viewport real para uso em mobile.
   */
  function setRealViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--real-vh", `${vh}px`);
  }

  /**
   * Mede limites e alcance do gesto conforme o breakpoint atual.
   * @param {HTMLElement} topBox
   */
  function measure(topBox) {
    const width = window.innerWidth;
    const isMobile = width <= MOBILE_BP;

    maxRadius = topBox.getBoundingClientRect().height;
    maxRight = isMobile ? Math.round(width * MOBILE_RANGE) : width - DESKTOP_PADDING_RIGHT;
  }

  /**
   * Reseta o estado visual inicial da abertura.
   * @param {Object} elements
   * @param {HTMLElement} elements.gotinha
   * @param {HTMLElement} elements.linha
   * @param {HTMLElement} elements.topBox
   * @param {HTMLElement} elements.bottomBox
   */
  function setInitialState({ gotinha, linha, topBox, bottomBox }) {
    document.documentElement.style.setProperty("--pull", "0");
    document.documentElement.style.setProperty("--reveal", "0");

    measure(topBox);

    topBox.style.borderBottomLeftRadius = `${MIN_RADIUS}px`;
    bottomBox.style.borderTopLeftRadius = `${MIN_RADIUS}px`;

    gotinha.style.left = `${startLeft}px`;
    linha.style.left = `${startLeft}px`;
    linha.style.width = `${window.innerWidth - startLeft}px`;
  }

  /**
   * Finaliza a abertura do site.
   * @param {HTMLElement} overlay
   */
  function openPack(overlay) {
    if (hasSlid) return;

    hasSlid = true;
    isDragging = false;
    dragMode = null;

    document.documentElement.style.setProperty("--pull", "1");
    document.documentElement.style.setProperty("--reveal", "1");

    overlay.classList.add("is-opening");
    overlay.style.pointerEvents = "none";
    overlay.style.transform = "translateZ(0)";

    setTimeout(() => {
      overlay.classList.add("is-hidden");
      document.body.classList.add("site-open");
    }, 520);

    setTimeout(() => {
      overlay.style.display = "none";
    }, 1100);
  }

  /**
   * Extrai clientX de pointer ou touch.
   * @param {PointerEvent | TouchEvent} event
   * @returns {number}
   */
  function getClientX(event) {
    if ("touches" in event && event.touches.length > 0) {
      return event.touches[0].clientX;
    }

    return event.clientX;
  }

  /**
   * Extrai clientY de pointer ou touch.
   * @param {PointerEvent | TouchEvent} event
   * @returns {number}
   */
  function getClientY(event) {
    if ("touches" in event && event.touches.length > 0) {
      return event.touches[0].clientY;
    }

    return event.clientY;
  }

  /**
   * Indica se estamos no breakpoint mobile.
   * @returns {boolean}
   */
  function isMobileViewport() {
    return window.innerWidth <= MOBILE_BP;
  }

  /**
   * Verifica se o gesto começou na zona central permitida do mobile.
   * @param {number} clientY
   * @returns {boolean}
   */
  function isInsideMobileSwipeZone(clientY) {
    const h = window.innerHeight;
    const minY = h * SWIPE_ZONE_TOP;
    const maxY = h * SWIPE_ZONE_BOTTOM;
    return clientY >= minY && clientY <= maxY;
  }

  /**
   * Atualiza visualmente o progresso da abertura.
   * @param {number} clientX
   * @param {Object} elements
   * @param {HTMLElement} elements.gotinha
   * @param {HTMLElement} elements.linha
   * @param {HTMLElement} elements.topBox
   * @param {HTMLElement} elements.bottomBox
   * @param {HTMLElement} elements.overlay
   */
  function updateDragProgress(clientX, elements) {
    const { gotinha, linha, topBox, bottomBox, overlay } = elements;

    const clampedX = clamp(clientX, startLeft, maxRight);
    const percent = (clampedX - startLeft) / (maxRight - startLeft);

    document.documentElement.style.setProperty("--pull", percent.toFixed(4));
    document.documentElement.style.setProperty("--reveal", percent.toFixed(4));

    gotinha.style.left = `${clampedX}px`;

    linha.style.left = `${clampedX}px`;
    linha.style.width = `${window.innerWidth - clampedX}px`;

    const radius = Math.round(MIN_RADIUS + (maxRadius - MIN_RADIUS) * percent);
    topBox.style.borderBottomLeftRadius = `${radius}px`;
    bottomBox.style.borderTopLeftRadius = `${radius}px`;

    if (clampedX >= maxRight - 6) {
      openPack(overlay);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setRealViewportHeight();
    window.addEventListener("resize", setRealViewportHeight);

    document.body.classList.remove("site-open");
    document.documentElement.style.setProperty("--pull", "0");
    document.documentElement.style.setProperty("--reveal", "0");

    const overlay = document.getElementById("entryOverlay");
    const gotinha = document.querySelector(".gotinha");
    const linha = document.querySelector(".linha-vermelha");
    const topBox = document.querySelector(".top-box");
    const bottomBox = document.querySelector(".bottom-box");

    if (!overlay || !gotinha || !linha || !topBox || !bottomBox) return;

    gotinha.addEventListener("dragstart", (event) => event.preventDefault());

    const elements = { gotinha, linha, topBox, bottomBox, overlay };

    setInitialState(elements);

    window.addEventListener("resize", () => {
      if (hasSlid) return;
      setInitialState(elements);
    });

    function onGotinhaStart(event) {
      if (hasSlid) return;

      isDragging = true;
      dragMode = "drop";

      document.body.style.userSelect = "none";
      gotinha.setPointerCapture?.(event.pointerId);
    }

    function onOverlayStart(event) {
      if (hasSlid) return;
      if (!isMobileViewport()) return;
      if (dragMode) return;

      const target = event.target;
      if (target === gotinha) return;

      const clientY = getClientY(event);
      if (!isInsideMobileSwipeZone(clientY)) return;

      isDragging = true;
      dragMode = "swipe";

      document.body.style.userSelect = "none";
    }

    function onMove(event) {
      if (!isDragging || hasSlid) return;

      const clientX = getClientX(event);
      updateDragProgress(clientX, elements);
    }

    function onEnd() {
      isDragging = false;
      dragMode = null;
      document.body.style.userSelect = "";
    }

    /* Arraste tradicional da gotinha */
    gotinha.addEventListener("pointerdown", onGotinhaStart);
    gotinha.addEventListener("touchstart", onGotinhaStart, { passive: true });

    /* Swipe horizontal na área central do mobile */
    overlay.addEventListener("pointerdown", onOverlayStart);
    overlay.addEventListener("touchstart", onOverlayStart, { passive: true });

    /* Movimento global */
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    /* Finalização */
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
  });
})();
