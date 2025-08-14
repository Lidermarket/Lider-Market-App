/*! admin-slim.js — limpiar “sistema completo” y fijar tabs locales (Proveedores/Productos) */
(function () {
  // ===== Qué quitar (SOLO sistema completo) =====
  // NO tocamos “Importación de Productos”.
  const REMOVE_SECTIONS = [
    /compartir sistema cargado/i,
    /exportar sistema/i,
    /exportar aplicaci[oó]n/i,
    /importar sistema completo/i,
    /cargar sistema completo/i,
    /importaci[oó]n del sistema completo/i,
  ];

  // ===== Helpers =====
  const $$  = (sel, r = document) => Array.from(r.querySelectorAll(sel));
  const norm = s => (s || "").toLowerCase();

  function removeWholeSystemBlocks() {
    // Busca encabezados y “cards” que contengan esos títulos y elimínalos
    const headers = $$("h1,h2,h3,legend,.card-header,.section-title,.title,button,div");
    headers.forEach(h => {
      const t = norm(h.textContent || "");
      if (REMOVE_SECTIONS.some(rx => rx.test(t))) {
        const box = h.closest(".card, section, article, div");
        if (box) box.remove();
      }
    });
  }

  // Conecta SOLO la tarjeta “Gestión Manual de Proveedores y Productos”
  // y alterna sus paneles de Proveedores/Productos (sin reemplazar tus handlers).
  function wireLocalTabs() {
    const btnProd = document.getElementById("manageProductsTab");
    const btnProv = document.getElementById("manageSuppliersTab");
    if (!btnProd || !btnProv) return;

    // Encontrar la barra que contiene ambos botones dentro de la misma tarjeta
    let bar = btnProd;
    while (bar && !bar.contains(btnProv)) bar = bar.parentElement;
    if (!bar) return;

    const card = bar.closest(".card") || bar.closest("section,article,div");
    if (!card) return;

    // Tomamos todos los hermanos que vienen DESPUÉS de la barra como candidatos de panel
    const sibs = [];
    let n = bar.nextElementSibling;
    while (n && card.contains(n)) { sibs.push(n); n = n.nextElementSibling; }
    if (sibs.length === 0) return;

    const textOf = el => norm(
      (el.innerText || "") + " " +
      $$("#[placeholder]", el).map(x => x.getAttribute("placeholder") || "").join(" ")
    );

    function score(el, kind) {
      const t = textOf(el);
      if (kind === "prod") {
        return 2 * (t.match(/\bproducto(s)?\b/g) || []).length
             + 1 * (t.match(/c[oó]digo|barras|precio|stock|unidad(es)?/g) || []).length
             - 1 * (t.match(/\bproveedor(es)?\b/g) || []).length
             + t.length / 10000;
      } else { // prov
        return 2 * (t.match(/\bproveedor(es)?\b/g) || []).length
             + 1 * (t.match(/agregar proveedor|nombre del proveedor|rfc|tel[eé]fono|correo/g) || []).length
             - 1 * (t.match(/\bproducto(s)?\b/g) || []).length
             + t.length / 10000;
      }
    }

    const provPanel = sibs.map(el => ({ el, s: score(el, "prov") }))
                          .sort((a, b) => b.s - a.s)[0]?.el;

    const prodPanel = sibs.map(el => ({ el, s: score(el, "prod") }))
                          .sort((a, b) => b.s - a.s)
                          .find(x => x.el !== provPanel)?.el || null;

    if (!provPanel || !prodPanel) return;

    function show(panel) {
      [provPanel, prodPanel].forEach(p => {
        if (!p) return;
        // destapar si algún padre lo oculta
        let a = p;
        while (a && a !== card) {
          if (a.tagName === "DETAILS" && !a.open) a.open = true;
          if (a.hasAttribute("hidden")) a.hidden = false;
          const cs = getComputedStyle(a);
          if (cs.display === "none") a.style.display = "block";
          if (cs.visibility === "hidden") a.style.visibility = "visible";
          a = a.parentElement;
        }
        p.hidden = (p !== panel);
        p.style.display = (p === panel ? "" : "none");
        p.style.visibility = "";
      });
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Estado inicial: Proveedores visible (edición manual inmediata)
    show(provPanel);

    // NO sustituimos onclicks existentes: sólo escuchamos
    btnProv.addEventListener("click", () => show(provPanel), { capture: true });
    btnProd.addEventListener("click", () => show(prodPanel ), { capture: true });
  }

  function start() {
    removeWholeSystemBlocks();
    wireLocalTabs();
    console.log("[admin-slim] activo — se mantienen Importación de Productos, se oculta Sistema Completo");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
