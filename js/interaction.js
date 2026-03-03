(() => {
  let hasSlid = false;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  document.addEventListener("DOMContentLoaded", () => {
    function setRealViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--real-vh", `${vh}px`);
    }

    setRealViewportHeight();
    window.addEventListener("resize", setRealViewportHeight);

    // 🔹 garante que o site sempre comece no modo teaser
    document.body.classList.remove("site-open");

    document.documentElement.style.setProperty("--pull", "0");

    const MOBILE_BP = 900; // mesmo breakpoint do seu CSS
    const MOBILE_RANGE = 0.78; // 78% da largura (ajuste fino depois)
    const DESKTOP_PADDING_RIGHT = 20;

    document.documentElement.style.setProperty("--reveal", "0");

    const overlay = document.getElementById("entryOverlay");

    const gotinha = document.querySelector(".gotinha");
    const linha = document.querySelector(".linha-vermelha");
    const seloPuxe = document.querySelector(".selo-puxe");
    const topBox = document.querySelector(".top-box");
    const bottomBox = document.querySelector(".bottom-box");

    if (!overlay || !gotinha || !linha || !topBox || !bottomBox) return;

    // evita drag default do <img> no desktop
    gotinha.addEventListener("dragstart", (e) => e.preventDefault());

    let minRadius = 120;
    let startLeft = minRadius;
    let maxRight = window.innerWidth - 20;
    let maxRadius = topBox.getBoundingClientRect().height;

    function measure() {
      const w = window.innerWidth;
      maxRadius = topBox.getBoundingClientRect().height;

      const isMobile = w <= MOBILE_BP;

      // ✅ no mobile o usuário não precisa ir até o final da tela
      maxRight = isMobile ? Math.round(w * MOBILE_RANGE) : w - DESKTOP_PADDING_RIGHT;
    }

    function setInitial() {
      document.documentElement.style.setProperty("--pull", "0");
      measure();

      topBox.style.borderBottomLeftRadius = `${minRadius}px`;
      bottomBox.style.borderTopLeftRadius = `${minRadius}px`;

      gotinha.style.left = `${startLeft}px`;
      linha.style.left = `${startLeft}px`;
      linha.style.width = `${window.innerWidth - startLeft}px`;
    }

    setInitial();
    window.addEventListener("resize", () => {
      if (hasSlid) return;
      setInitial();
    });

    let isDragging = false;

    function openPack() {
      if (hasSlid) return;
      hasSlid = true;

      isDragging = false;

      document.documentElement.style.setProperty("--pull", "1");
      document.documentElement.style.setProperty("--reveal", "1");

      overlay.classList.add("is-opening");
      overlay.style.transform = "translateZ(0)";

      // quando começar a esconder a abertura, liberamos o site
      setTimeout(() => {
        overlay.classList.add("is-hidden");

        // ✅ libera os elementos do site (menos a roseta, que já está visível)
        document.body.classList.add("site-open");
      }, 520);

      setTimeout(() => {
        overlay.style.display = "none";
      }, 1100);
    }

    function onStart(e) {
      if (hasSlid) return;
      isDragging = true;
      document.body.style.userSelect = "none";
      gotinha.setPointerCapture?.(e.pointerId);
    }

    function onMove(e) {
      if (!isDragging || hasSlid) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clampedX = clamp(clientX, startLeft, maxRight);
      const percent = (clampedX - startLeft) / (maxRight - startLeft);
      document.documentElement.style.setProperty("--pull", percent.toFixed(4));
      document.documentElement.style.setProperty("--reveal", percent.toFixed(4));

      gotinha.style.left = `${clampedX}px`;

      linha.style.left = `${clampedX}px`;
      linha.style.width = `${window.innerWidth - clampedX}px`;

      const radius = Math.round(minRadius + (maxRadius - minRadius) * percent);
      topBox.style.borderBottomLeftRadius = `${radius}px`;
      bottomBox.style.borderTopLeftRadius = `${radius}px`;

      if (clampedX >= maxRight - 6) openPack();
    }

    function onEnd() {
      isDragging = false;
      document.body.style.userSelect = "";
    }

    // Pointer events (mouse + touch)
    gotinha.addEventListener("pointerdown", onStart);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);

    // fallback touch (caso algum browser bloqueie pointer)
    gotinha.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
  });
})();
