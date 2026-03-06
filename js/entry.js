(() => {
  "use strict";

  let hasSlid = false;
  let isDragging = false;

  const MOBILE_BP = 900;
  const MOBILE_RANGE = 0.78;
  const DESKTOP_PADDING_RIGHT = 20;
  const MIN_RADIUS = 120;

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

    const elements = { gotinha, linha, topBox, bottomBox };

    setInitialState(elements);

    window.addEventListener("resize", () => {
      if (hasSlid) return;
      setInitialState(elements);
    });

    function onStart(event) {
      if (hasSlid) return;

      isDragging = true;
      document.body.style.userSelect = "none";
      gotinha.setPointerCapture?.(event.pointerId);
    }

    function onMove(event) {
      if (!isDragging || hasSlid) return;

      const clientX = getClientX(event);
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

    function onEnd() {
      isDragging = false;
      document.body.style.userSelect = "";
    }

    gotinha.addEventListener("pointerdown", onStart);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);

    gotinha.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
  });
})();
