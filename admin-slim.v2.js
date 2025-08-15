/*! admin-slim.v2.js
   - Actúa SOLO en Admin (no interfiere con Login).
   - Mantiene "Importación de Productos".
   - Elimina "Compartir sistema cargado / Exportar / Enviar por Email / Copiar Datos"
     y "Importar sistema completo".
   - Fija pestañas locales en la tarjeta "Gestión Manual de Proveedores y Productos".
   - Mejora UI de "Proveedores existentes": franjas azul/gris y orden A→Z, ocultando la pill "Color".
*/
(() => {
  const $$  = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "")
    .toString()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().trim();

  // --------- 1) SOLO en Admin ---------
  function isAdminScreen() {
    if (document.getElementById("manageProductsTab") || document.getElementById("manageSuppliersTab")) return true;
    const t = norm(document.body && document.body.innerText);
    return t.includes("panel de administracion") || t.includes("gestión de datos");
  }

  // --------- 2) Limpia "sistema completo" (conserva Importación de Productos) ---------
  function removeWholeSystemBlocks() {
    const TARGETS = [
      /compartir sistema cargado/,
      /exportar sistema|exportar aplicacion|descargar archivo|enviar por email|copiar datos/,
      /importar sistema completo|cargar sistema completo|importacion del sistema completo/
    ];
    const headers = $$("h1,h2,h3,legend,.card-header,.section-title,.title,button");
    headers.forEach(h => {
      const t = norm(h.textContent || "");
      if (TARGETS.some(rx => rx.test(t))) {
        const card = h.closest(".card, section, article, div");
        if (card) card.remove();
      }
    });
  }

  // --------- 3) Tabs locales: Proveedores / Productos dentro de la tarjeta ---------
  function wireLocalTabsV5() {
    const btnProd = document.getElementById("manageProductsTab");
    const btnProv = document.getElementById("manageSuppliersTab");
    if (!btnProd || !btnProv) return;

    // Tarjeta: antepasado común de ambos botones
    function lca(a, b, stop) {
      const seen = new Set(); let x = a;
      while (x && x !== stop) { seen.add(x); x = x.parentElement; }
      x = b; while (x && x !== stop) { if (seen.has(x)) return x; x = x.parentElement; }
      return stop || document.body;
    }
    const card = lca(btnProd, btnProv, document.body);

    // Barra que contiene a ambos
    let bar = btnProd;
    while (bar && !bar.contains(btnProv)) bar = bar.parentElement;
    if (!bar) return;

    // Descendientes de la tarjeta que están DESPUÉS de la barra
    const all = Array.from(card.querySelectorAll("section,article,div"));
    const after = all.filter(el =>
      (bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !el.contains(bar)
    );

    // Candidatos con contenido/formularios
    const candidates = after.filter(el => {
      const txt = (el.innerText || "").trim();
      const inputs = el.querySelectorAll("input,select,textarea,button").length;
      return txt.length > 60 || inputs >= 2;
    });
    if (!candidates.length) return;

    const textOf = el => norm(
      (el.innerText || "") + " " +
      $$( "[placeholder]", el ).map(n => n.getAttribute("placeholder") || "").join(" ")
    );

    function score(el, kind) {
      const t = textOf(el);
      if (kind === "prod") {
        return  2*(t.match(/\bproducto(s)?\b/g) || []).length
              + 1*(t.match(/codigo|barras|precio|stock|unidad(es)?/g) || []).length
              - 1*(t.match(/\bproveedor(es)?\b/g) || []).length
              + t.length/10000;
      } else {
        return  2*(t.match(/\bproveedor(es)?\b/g) || []).length
              + 1*(t.match(/agregar proveedor|nombre del proveedor|rfc|telefono|correo/g) || []).length
              - 1*(t.match(/\bproducto(s)?\b/g) || []).length
              + t.length/10000;
      }
    }

    const provSorted = candidates.map(el => ({ el, s: score(el, "prov") })).sort((a,b)=>b.s-a.s);
    const prodSorted = candidates.map(el => ({ el, s: score(el, "prod") })).sort((a,b)=>b.s-a.s);

    let provPanel = provSorted[0]?.el || null;
    let prodPanel = prodSorted.find(x =>
      x.el !== provPanel && !(provPanel && (x.el.contains(provPanel) || provPanel.contains(x.el)))
    )?.el || null;

    if (!provPanel || !prodPanel) return;

    function show(panel) {
      [provPanel, prodPanel].forEach(p => {
        p.hidden = (p !== panel);
        p.style.display = (p === panel ? "" : "none");
        p.style.visibility = "";
      });
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Estado inicial: Proveedores
    show(provPanel);
    btnProv.addEventListener("click", () => show(provPanel), { capture: true });
    btnProd.addEventListener("click", () => show(prodPanel ), { capture: true });
  }

  // --------- 4) Mejora UI de "Proveedores existentes": franjas + orden A→Z + ocultar "Color" ---------
  function enhanceProvidersUI() {
    const header = $$("h1,h2,h3,legend,.card-header,.section-title,.title")
      .find(h => norm(h.textContent).includes("proveedores existentes"));
    if (!header) return;

    const card = header.closest(".card,section,article,div") || header.parentElement;

    // Contenedor con más "filas" convincentes
    const containers = $$(".card,section,article,div,ul,ol", card);
    function scoreContainer(el){
      let rows = 0;
      for (const ch of el.children || []) {
        const t = (ch.innerText || "").trim();
        const hasBtns = ch.querySelector("button,[role='button'],.btn,svg,i[class*='edit'],i[class*='trash']");
        if (t.length > 0 && (hasBtns || t.length > 15)) rows++;
      }
      return rows;
    }
    const list = containers.sort((a,b)=>scoreContainer(b)-scoreContainer(a))[0];
    if (!list || scoreContainer(list) < 2) return;

    // filas
    const rows = Array.from(list.children).filter(el => el.nodeType === 1);

    // Oculta elementos que sean pill "Color"
    rows.forEach(r => {
      const pill = Array.from(r.querySelectorAll("*"))
        .find(x => {
          const tx = norm(x.textContent);
          return tx === "color" || tx.startsWith("color ");
        });
      if (pill) pill.style.display = "none";
    });

    // Extraer nombre del proveedor
    function providerName(row){
      const cand = row.querySelector("b,strong,.name,.title,h1,h2,h3");
      if (cand) return cand.innerText.trim();
      return (row.innerText || "").trim().split("\n")[0].replace(/^proveedor(es)?:\s*/i,"").trim();
    }

    // Orden A→Z (acentos ignorados)
    rows.sort((a,b)=> norm(providerName(a)).localeCompare(norm(providerName(b)), "es", { sensitivity:"base" }));

    // Estilos alternos (azul/gris)
    if (!document.getElementById("prov-alt-style")){
      const st = document.createElement("style");
      st.id = "prov-alt-style";
      st.textContent = `
        .prov-alt { border-radius: 10px; padding: 8px; margin: 6px 0; }
        .prov-alt-0 { background: #f0f6ff; } /* azul muy claro */
        .prov-alt-1 { background: #f6f7f9; } /* gris claro */
      `;
      document.head.appendChild(st);
    }

    rows.forEach((row, i) => {
      row.classList.remove("prov-alt-0","prov-alt-1","prov-alt");
      row.classList.add("prov-alt", (i % 2 === 0) ? "prov-alt-0" : "prov-alt-1");
      list.appendChild(row); // reordenado
    });

    // Observa cambios para re-aplicar automático
    if (!list.__provObserver){
      const apply = () => {
        const rows2 = Array.from(list.children).filter(el => el.nodeType === 1);
        rows2.sort((a,b)=> norm(providerName(a)).localeCompare(norm(providerName(b)), "es", {sensitivity:"base"}));
        rows2.forEach((r,i)=>{
          r.classList.remove("prov-alt-0","prov-alt-1","prov-alt");
          r.classList.add("prov-alt", (i%2===0) ? "prov-alt-0" : "prov-alt-1");
          list.appendChild(r);
        });
      };
      const mo = new MutationObserver(()=> setTimeout(apply, 50));
      mo.observe(list, { childList: true, subtree: false });
      list.__provObserver = mo;
    }
  }

  // --------- 5) Arranque + reintentos cortos (por si el DOM de Admin tarda) ---------
  function runAll() {
    if (!isAdminScreen()) return;
    removeWholeSystemBlocks();
    wireLocalTabsV5();
    enhanceProvidersUI();
    console.log("[admin-slim.v2] activo");
  }

  // Ejecutar al cargar y durante ~6s reintentar si el DOM se sigue montando
  const start = () => {
    runAll();
    const t0 = Date.now();
    const obs = new MutationObserver(() => {
      if (Date.now() - t0 > 6000) { obs.disconnect(); return; }
      runAll();
    });
    obs.observe(document, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
