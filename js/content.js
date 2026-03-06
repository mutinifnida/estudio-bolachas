(function () {
  "use strict";

  const bodyEl = document.body;

  const contentTitleEl = document.getElementById("contentTitle");
  const contentPanelEl = document.getElementById("contentPanel");
  const contentPanelBodyEl = document.getElementById("contentPanelBody");
  const contentBackBtn = document.getElementById("contentBack");
  const contentBackdropEl = document.getElementById("contentBackdrop");

  let isContentMode = false;
  let currentSectionKey = null;

  /**
   * Renderiza o conteúdo da seção a partir do template correspondente.
   * @param {string} key
   */
  function renderSection(key) {
    if (!contentPanelBodyEl) return;

    const template = document.getElementById(`tpl-${key}`);

    if (!template) {
      contentPanelBodyEl.innerHTML = `
        <p class="contentPanel__placeholder">
          Conteúdo da seção <strong>${key}</strong> ainda não foi criado.
        </p>
      `;
      return;
    }

    const fragment = template.content.cloneNode(true);

    contentPanelBodyEl.innerHTML = "";
    contentPanelBodyEl.appendChild(fragment);
  }

  /**
   * Abre o modo de conteúdo.
   * @param {string} titleText
   * @param {string} key
   */
  function openContentMode(titleText, key) {
    isContentMode = true;
    currentSectionKey = key || null;

    bodyEl.classList.add("mode-content");
    bodyEl.dataset.active = currentSectionKey || "";

    if (contentTitleEl) {
      contentTitleEl.textContent = titleText || "";
    }

    if (currentSectionKey) {
      renderSection(currentSectionKey);
    }
  }

  /**
   * Fecha o modo de conteúdo.
   */
  function closeContentMode() {
    isContentMode = false;
    currentSectionKey = null;

    bodyEl.classList.remove("mode-content");
    delete bodyEl.dataset.active;

    if (contentTitleEl) {
      contentTitleEl.textContent = "";
    }

    if (contentPanelBodyEl) {
      contentPanelBodyEl.innerHTML =
        '<p class="contentPanel__placeholder">Conteúdo da seção (em breve).</p>';
    }
  }

  /**
   * Informa se o painel está aberto.
   * @returns {boolean}
   */
  function getIsContentMode() {
    return isContentMode;
  }

  /**
   * Faz o bind dos eventos do painel.
   */
  function bindContentEvents() {
    if (contentBackBtn) {
      contentBackBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeContentMode();
      });
    }

    if (contentBackdropEl) {
      contentBackdropEl.addEventListener("click", (event) => {
        event.preventDefault();
        closeContentMode();
      });
    }

    if (contentPanelEl) {
      contentPanelEl.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isContentMode) {
        closeContentMode();
      }
    });
  }

  bindContentEvents();

  window.BolachasContent = {
    closeContentMode,
    getIsContentMode,
    openContentMode
  };
})();
