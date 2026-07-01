// panel de accesibilidad para las nenas y nenes daltonicos
// por ahora solo dejo la correccion de color, que es lo que pidieron.
// el resto (contraste, tts, etc) lo tenia armado pero lo saque del panel
// TODO: si mas adelante lo quieren, volver a meter contraste alto y modo oscuro

(function () {
  "use strict";

  const STORAGE_KEY = "ap_accessibility_prefs";

  const DEFAULT_PREFS = {
    // none | protanopia | deuteranopia | tritanopia | grayscale
    colorCorrection: "none",
  };

  // textos del panel (todo en español, es lo unico que usamos)
  const t = {
    panelTitle: "Accesibilidad",
    resetBtn: "Reset",
    resetLabel: "Restaurar configuración por defecto",
    closeLabel: "Cerrar panel de accesibilidad",
    openLabel: "Abrir panel de accesibilidad",
    toggleTitle: "Accesibilidad",
    colorTitle: "Corrección de color",
    protanopia: "Protanomalía",
    deuteranopia: "Deuteranomalía",
    tritanopia: "Tritanomalía",
    grayscale: "Escala de grises",
    // mensajes que se leen en voz alta
    panelOpened: "Panel de accesibilidad abierto",
    resetDone: "Configuración restaurada a valores por defecto",
    activated: "activado",
    colorOff: "Corrección de color desactivada",
  };

  let prefs = loadPrefs();
  let panelOpen = false;

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw
        ? { ...DEFAULT_PREFS, ...JSON.parse(raw) }
        : { ...DEFAULT_PREFS };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }
  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  }

  // lee un texto en voz alta. busca una voz en español, si no agarra la que haya
  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.lang = "es-AR";

    const voces = window.speechSynthesis.getVoices();
    // primero busco es-AR, si no cualquier español
    const voz =
      voces.find((v) => v.lang === "es-AR") ||
      voces.find((v) => v.lang.startsWith("es"));
    if (voz) u.voice = voz;

    window.speechSynthesis.speak(u);
  }

  // los svg de los iconos van inline asi no dependo de mas archivos
  const ICONS = {
    accessibilityFull: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-2 7v4H7v2h3v7h2v-4h0v4h2v-7h3v-2h-3V9a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2z"/></svg>`,
    palette: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.2-.64-1.67-.08-.1-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zM6.5 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15-6.7L21 2v7h-7l2.5-2.5A7 7 0 1 0 19 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  };

  // los filtros de daltonismo son matrices feColorMatrix, van en un svg escondido
  // (las matrices las saque de tablas ya armadas, no las invente yo)
  function injectSVGFilters() {
    if (document.getElementById("ap-svg-filters")) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "ap-svg-filters";
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;";
    svg.innerHTML = `
      <defs>
        <filter id="ap-protanopia-filter">
          <feColorMatrix type="matrix" values="
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0"/>
        </filter>
        <filter id="ap-deuteranopia-filter">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0     0 0
            0.7   0.3   0     0 0
            0     0.3   0.7   0 0
            0     0     0     1 0"/>
        </filter>
        <filter id="ap-tritanopia-filter">
          <feColorMatrix type="matrix" values="
            0.95 0.05  0     0 0
            0    0.433 0.567 0 0
            0    0.475 0.525 0 0
            0    0     0     1 0"/>
        </filter>
      </defs>`;
    document.body.appendChild(svg);
  }

  // arma todo el html del panel a mano y lo pega al body
  function buildPanel() {
    // el botoncito que abre el panel (queda fijo al costado)
    const btn = document.createElement("button");
    btn.id = "ap-toggle-btn";
    btn.setAttribute("aria-label", t.openLabel);
    btn.setAttribute("title", t.toggleTitle);
    btn.innerHTML =
      '<img src="img/accessibility.svg" alt="' +
      t.toggleTitle +
      '" width="28" height="28" style="pointer-events:none;" aria-hidden="true">';
    document.body.appendChild(btn);

    // el fondo oscuro de atras
    const overlay = document.createElement("div");
    overlay.id = "ap-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    // el panel en si
    const panel = document.createElement("div");
    panel.id = "ap-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t.panelTitle);
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("tabindex", "-1");

    panel.innerHTML = `
      <div class="ap-header">
        <h2>${ICONS.accessibilityFull} ${t.panelTitle}</h2>
        <div class="ap-header-actions">
          <button id="ap-reset-btn" aria-label="${t.resetLabel}" title="${t.resetLabel}">${ICONS.reset} ${t.resetBtn}</button>
          <button id="ap-close-btn" aria-label="${t.closeLabel}" title="${t.closeLabel}">${ICONS.close}</button>
        </div>
      </div>
      <div class="ap-body">

        <!-- correccion de color -->
        <div class="ap-section">
          <div class="ap-section-title">${t.colorTitle}</div>
          <div class="ap-grid">
            <button class="ap-btn" data-color="protanopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.protanopia}</span>
            </button>
            <button class="ap-btn" data-color="deuteranopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.deuteranopia}</span>
            </button>
            <button class="ap-btn" data-color="tritanopia" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.tritanopia}</span>
            </button>
            <button class="ap-btn" data-color="grayscale" aria-pressed="false">
              ${ICONS.palette}
              <span>${t.grayscale}</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(panel);
  }

  // pone la clase de correccion de color en el <html> y prende el boton activo
  function applyAll() {
    const html = document.documentElement;

    // saco todas las de color y despues pongo la que toca
    const colorClasses = [
      "ap-protanopia",
      "ap-deuteranopia",
      "ap-tritanopia",
      "ap-grayscale",
    ];
    colorClasses.forEach((c) => html.classList.remove(c));
    if (prefs.colorCorrection !== "none") {
      html.classList.add("ap-" + prefs.colorCorrection);
    }

    // marco el boton que quedo activo
    document.querySelectorAll("#ap-panel .ap-btn[data-color]").forEach((b) => {
      const active = prefs.colorCorrection === b.dataset.color;
      b.classList.toggle("ap-active", active);
      b.setAttribute("aria-pressed", String(active));
    });

    savePrefs();
  }

  function bindEvents() {
    const toggleBtn = document.getElementById("ap-toggle-btn");
    const panel = document.getElementById("ap-panel");
    const overlay = document.getElementById("ap-overlay");
    const closeBtn = document.getElementById("ap-close-btn");
    const resetBtn = document.getElementById("ap-reset-btn");

    function openPanel() {
      panelOpen = true;
      panel.classList.add("ap-open");
      overlay.classList.add("ap-visible");
      toggleBtn.setAttribute("aria-expanded", "true");
      panel.focus();
      speak(t.panelOpened);
    }
    function closePanel() {
      panelOpen = false;
      panel.classList.remove("ap-open");
      overlay.classList.remove("ap-visible");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.focus();
    }

    toggleBtn.addEventListener("click", () =>
      panelOpen ? closePanel() : openPanel(),
    );
    overlay.addEventListener("click", closePanel);
    closeBtn.addEventListener("click", closePanel);

    // con Escape tambien se cierra
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panelOpen) closePanel();
    });

    // boton de reset
    resetBtn.addEventListener("click", () => {
      prefs = { ...DEFAULT_PREFS };
      applyAll();
      speak(t.resetDone);
    });

    // los 4 botones de correccion de color (si tocas el activo lo apaga)
    document
      .querySelectorAll("#ap-panel .ap-btn[data-color]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const color = btn.dataset.color;
          prefs.colorCorrection =
            prefs.colorCorrection === color ? "none" : color;
          applyAll();

          const label = btn.querySelector("span").textContent;
          speak(
            prefs.colorCorrection !== "none"
              ? `${label}: ${t.activated}`
              : t.colorOff,
          );
        });
      });

    // que el Tab no se escape del panel mientras esta abierto
    panel.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function init() {
    injectSVGFilters();
    buildPanel();
    bindEvents();
    applyAll();

    // las voces a veces cargan tarde, las pido de una y en el evento
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () =>
        window.speechSynthesis.getVoices();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
