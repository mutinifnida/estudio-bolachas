(function () {
  "use strict";

  /**
   * Normaliza um ângulo para a faixa de -180 a 180.
   * @param {number} deg
   * @returns {number}
   */
  function normalizeDeg(deg) {
    let value = deg % 360;

    if (value < -180) value += 360;
    if (value > 180) value -= 360;

    return value;
  }

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
   * Retorna o equivalente angular mais próximo do ângulo atual.
   * @param {number} target
   * @param {number} current
   * @returns {number}
   */
  function nearestEquivalent(target, current) {
    const k = Math.round((current - target) / 360);
    return target + 360 * k;
  }

  /**
   * Indica se o site já saiu da etapa de abertura.
   * @returns {boolean}
   */
  function siteIsOpen() {
    return document.body.classList.contains("site-open");
  }

  /**
   * Atualiza variáveis globais de viewport real.
   * Usa visualViewport quando disponível para evitar bugs de 100vh no mobile.
   */
  function updateViewportVars() {
    const vv = window.visualViewport;
    const appHeight = vv ? vv.height : window.innerHeight;
    const appWidth = vv ? vv.width : window.innerWidth;

    document.documentElement.style.setProperty("--app-height", `${appHeight}px`);
    document.documentElement.style.setProperty("--app-width", `${appWidth}px`);
  }

  /**
   * Abre links externos em nova aba.
   */
  function initExternalLinks() {
    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {
      const url = link.getAttribute("href");
      if (!url) return;

      const isExternal =
        url.startsWith("http") ||
        url.startsWith("https") ||
        url.startsWith("mailto:") ||
        url.startsWith("tel:");

      if (!isExternal) return;

      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  }

  function initViewportTracking() {
    updateViewportVars();

    window.addEventListener("resize", updateViewportVars);
    window.addEventListener("orientationchange", updateViewportVars);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportVars);
      window.visualViewport.addEventListener("scroll", updateViewportVars);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initExternalLinks();
    initViewportTracking();
  });

  window.BolachasUtils = {
    clamp,
    nearestEquivalent,
    normalizeDeg,
    siteIsOpen,
    updateViewportVars
  };
})();
