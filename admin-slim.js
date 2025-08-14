/*! admin-slim.js — limpia bloques y fija tabs locales (Productos/Proveedores) */
(function () {
  // ===== 1) QUÉ BLOQUES QUITAR =====
  // Puedes añadir/quitar títulos aquí. Coincide por texto del encabezado.
  const HIDE_SECTIONS = [
    /importación de productos/i,
    /compartir sistema/i,
    /importar sistema completo/i,
    /cargar datos de prueba/i
  ];

  // ===== Helpers =====
  const norm = s => (s || "").toLowerCase();
  const $$ = (sel, r = document) => Array.from(r.querySelectorAll(sel));

  // Encuentra y oculta/elimina la "card/section" que contiene un encabezado que coincida
  function pruneSections() {
    const headers = $$("h1,h2,h3,legend,.card-header,.section-title,.title");
    headers.forEach(h => {
      const t = norm(h.textContent || "");
      if (HIDE_SECTIONS.some(rx => rx.test(t))) {
        const box = h.closest(".card, section, article, div");
        if (box) {
          // eliminar por completo (si prefieres ocultar, usa: box.style.display='none')
          box.remove();
          // console.log("[admin-slim] removido:", t.slice(0, 80));
        }
      }
    });
  }

  // Conecta SOLO la tarjeta “Gestión Manual de Proveedores y Productos”
  // sin interferir con tus handlers; alterna visibilidad entre sus dos paneles.
  function wireLocalTabs() {
    const btnProd = document.getElementById("manageProductsTab");
    const btnProv = document.getElementById("manageSuppliersTab");
    if (!btnProd || !btnProv) return;

    // Hallar la barra que contiene ambos botones
    let bar = btnProd;
    while (bar && !bar.contains(btnProv)) bar = bar.parentElement;
    if (!bar) return;

    // Tarjeta contenedora
    const card = bar.closest(".card") || bar.closest("section,article,div");
    if (!card) return;

    // Tomar todos los hermanos que vienen DESPUÉS de la barra como candidatos a paneles
    const siblings = [];
    let n = bar.nextElementSibling;
    while (n && card.contains(n)) { siblings.push(n); n = n.nextElementSibling; }
    if (siblings.length === 0) return;

    // Puntuación por contenido para elegir panel de Proveedores / Productos
    const textOf = el =>
      norm((el.innerText || "") + " " +
        $$("#[placeholder]", el).map(x => x.getAttribute("placeholder") || "").join(" "));

    function score(el, kind) {
      const t = textOf(el);
      if (kind === "prod") {
        return 2 * (t.match(/\bproducto(s)?\b/g) || []).length
          + 1 * (t.match(/c[oó]digo|barras|precio|stock|unidad(es)?/g) || []).length
          - 1 * (t.match(/\bproveedor(es)?\b/g) || []).length
          + t.length / 10000;
      } else {
        return 2 * (t.match(/\bproveedor(es)?\b/g) || []).length
          + 1 * (t.match(/agregar proveedor|nombre del proveedor|rfc|tel[eé]fono|correo/g) || []).length
          - 1 * (t.match(/\bproducto(s)?\b/g) || []).length
          + t.length / 10000;
      }
    }

    const bestProv = siblings.map(el => ({ el, s: score(el, "prov") }))
      .sort((a, b) => b.s - a.s)[0]?.el;

    const bestProd = siblings.map(el => ({ el, s: score(el, "prod") }))
      .sort((a, b) => b.s - a.s)
      .find(x => x.el !== bestProv)?.el || null;

    if (!bestProv || !bestProd) return;

    // Alternador local
    function show(panel) {
      [bestProv, bestProd].forEach(p => {
        p.hidden = (p !== panel);
        p.style.display = (p === panel ? "" : "none");
        p.style.visibility = "";
      });
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Estado inicial: Proveedores
    show(bestProv);

    // NO sustituimos tus handlers; solo añadimos listeners (sin preventDefault)
    btnProv.addEventListener("click", () => show(bestProv), { capture: true });
    btnProd.addEventListener("click", () => show(bestProd), { capture: true });

    // console.log("[admin-slim] tabs listos");
  }

  function start() {
    pruneSections();     // 1) limpia bloques
    wireLocalTabs();     // 2) fija tabs locales
    console.log("[admin-slim] listo");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
