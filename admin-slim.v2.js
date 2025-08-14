/*! admin-slim.v2.js
   - Actúa SOLO en Admin (no login).
   - Mantiene "Importación de Productos".
   - Elimina "Compartir sistema cargado / Exportar / Enviar por Email / Copiar Datos"
     y "Importar sistema completo".
   - Fija pestañas locales en la tarjeta "Gestión Manual de Proveedores y Productos".
*/
(function () {
  // --- Utilidades robustas ---
  const $$   = (sel, r = document) => Array.from(r.querySelectorAll(sel));
  const norm = (s) => (s || "")
      .toString()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase().trim();

  // Ejecutar SOLO si realmente estamos en Admin
  function isAdminScreen() {
    // Señales: texto "Panel de Administracion" o existen los tabs de gestión
    const bodyTxt = norm(document.body && document.body.innerText);
    if (bodyTxt.includes("panel de administracion")) return true;
    if (document.getElementById("manageProductsTab") || document.getElementById("manageSuppliersTab")) return true;
    return false;
  }

  // Quitar SOLO bloques de "sistema completo" (conservar "Importación de Productos")
  function removeWholeSystemBlocks() {
    const TARGETS = [
      /compartir sistema cargado/,
      /exportar sistema|exportar aplicacion|descargar archivo|enviar por email|copiar datos/,
      /importar sistema completo|cargar sistema completo|importacion del sistema completo/
    ];
    // Buscamos encabezados típicos de cards/sections
    const headers = $$("h1,h2,h3,legend,.card-header,.section-title,.title,button");
    headers.forEach((h) => {
      const t = norm(h.textContent || "");
      if (TARGETS.some((rx) => rx.test(t))) {
        const card = h.closest(".card, section, article, div");
        if (card) card.remove();
      }
    });
  }

  // Tabs locales: SOLO dentro de la tarjeta de “Gestión Manual…”
  function wireLocalTabs() {
    const btnProd = document.getElementById("manageProductsTab");
    const btnProv = document.getElementById("manageSuppliersTab");
    if (!btnProd || !btnProv) return; // si no están, no hacemos nada

    // Encontrar el contenedor (tarjeta) y la barra que contiene ambos botones
    let bar = btnProd;
    while (bar && !bar.contains(btnProv)) bar = bar.parentElement;
    if (!bar) return;

    const card = bar.closest(".card") || bar.closest("section,article,div");
    if (!card) return;

    // Tomar todos los hermanos DESPUÉS de la barra como candidatos a paneles
    const siblings = [];
    let n = bar.nextElementSibling;
    while (n && card.contains(n)) { siblings.push(n); n = n.nextElementSibling; }
    if (siblings.length === 0) return;

    const textOf = (el) => norm(
      (el.innerText || "") + " " +
      $$( "[placeholder]", el ).map(n => n.getAttribute("placeholder") || "").join(" ")
    );

    // Puntuar candidatos para separar Proveedores vs Productos
    function score(el, kind) {
      const t = textOf(el);
      if (kind === "prod") {
        return  2 * (t.match(/\bproducto(s)?\b/g) || []).length
              + 1 * (t.match(/codigo|barras|precio|stock|unidad(es)?/g) || []).length
              - 1 * (t.match(/\bproveedor(es)?\b/g) || []).length
              + t.length / 10000;
      } else { // prov
        return  2 * (t.match(/\bproveedor(es)?\b/g) || []).length
              + 1 * (t.match(/agregar proveedor|nombre del proveedor|rfc|telefono|correo/g) || []).length
              - 1 * (t.match(/\bproducto(s)?\b/g) || []).length
              + t.length / 10000;
      }
    }

    const provPanel = siblings.map(el => ({el, s:score(el, "prov")}))
                              .sort((a,b)=>b.s-a.s)[0]?.el;
    const prodPanel = siblings.map(el => ({el, s:score(el, "prod")}))
                              .sort((a,b)=>b.s-a.s)
                              .find(x => x.el !== provPanel)?.el || null;

    if (!provPanel || !prodPanel) return;

    // Destapar cualquier padre oculto
    function reveal(el) {
      let a = el;
      while (a && a !== card) {
        if (a.tagName === "DETAILS" && !a.open) a.open = true;
        if (a.hasAttribute("hidden")) a.hidden = false;
        const cs = getComputedStyle(a);
        if (cs.display === "none") a.style.display = "block";
        if (cs.visibility === "hidden") a.style.visibility = "visible";
        a = a.parentElement;
      }
    }

    function show(panel) {
      reveal(panel);
      [provPanel, prodPanel].forEach(p => {
        p.hidden = (p !== panel);
        p.style.display = (p === panel ? "" : "none");
        p.style.visibility = "";
      });
      panel.scrollIntoView({behavior:"smooth", block:"start"});
    }

    // Estado inicial: Proveedores visible
    show(provPanel);

    // NO anulamos tus handlers; sólo añadimos listeners
    btnProv.addEventListener("click", () => show(provPanel), {capture:true});
    btnProd.addEventListener("click", () => show(prodPanel ), {capture:true});
  }

  function start() {
    if (!isAdminScreen()) return;      // nunca actuar fuera de Admin
    removeWholeSystemBlocks();         // limpiar export/import de sistema completo
    wireLocalTabs();                   // tabs locales en Gestión Manual
    console.log("[admin-slim.v2] activo");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { try { start(); } catch(e) { console.warn(e); }});
  } else {
    try { start(); } catch(e) { console.warn(e); }
  }
})();
