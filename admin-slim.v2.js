/*! admin-slim.v2.js — v3 */
(() => {
  console.log('[admin-slim.v2] file loaded');

  const $$  = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = (s) => (s || "").toString()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().trim();

  function isAdminScreen() {
    if (document.getElementById("manageProductsTab") || document.getElementById("manageSuppliersTab")) return true;
    const t = norm(document.body && document.body.innerText);
    return t.includes("panel de administracion") || t.includes("gestión de datos") || t.includes("gestion de datos");
  }

  function removeWholeSystemBlocks() {
    const TARGETS = [
      /compartir sistema cargado/,
      /exportar sistema|exportar aplicacion|descargar archivo|enviar por email|copiar datos/,
      /importar sistema completo|cargar sistema completo|importacion del sistema completo/
    ];
    let removed = 0;
    $$("h1,h2,h3,legend,.card-header,.section-title,.title,button").forEach(h=>{
      const t = norm(h.textContent||"");
      if (TARGETS.some(rx=>rx.test(t))) {
        const card = h.closest(".card,section,article,div");
        if (card) { card.remove(); removed++; }
      }
    });
    console.log('[admin-slim.v2] limpieza sistema completo ->', removed, 'bloques');
  }

  function wireLocalTabsV5() {
    const btnProd = document.getElementById("manageProductsTab");
    const btnProv = document.getElementById("manageSuppliersTab");
    if (!btnProd || !btnProv) { console.log('[admin-slim.v2] tabs: faltan botones'); return; }

    function lca(a,b,stop){
      const seen=new Set(); let x=a; while(x&&x!==stop){ seen.add(x); x=x.parentElement; }
      x=b; while(x&&x!==stop){ if(seen.has(x)) return x; x=x.parentElement; }
      return stop||document.body;
    }
    const card = lca(btnProd, btnProv, document.body);

    let bar = btnProd;
    while (bar && !bar.contains(btnProv)) bar = bar.parentElement;
    if (!bar) { console.log('[admin-slim.v2] tabs: sin barra'); return; }

    const all = Array.from(card.querySelectorAll("section,article,div"));
    const after = all.filter(el =>
      (bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !el.contains(bar)
    );
    const candidates = after.filter(el=>{
      const txt=(el.innerText||"").trim();
      const inputs=el.querySelectorAll("input,select,textarea,button").length;
      return txt.length>60 || inputs>=2;
    });
    if (!candidates.length){ console.log('[admin-slim.v2] tabs: sin candidatos'); return; }

    const textOf = el => norm(
      (el.innerText||"") + " " + $$( "[placeholder]", el ).map(n=>n.getAttribute("placeholder")||"").join(" ")
    );
    const score = (el,kind) => {
      const t=textOf(el);
      return kind==='prod'
        ? 2*(t.match(/\bproducto(s)?\b/g)||[]).length + 1*(t.match(/codigo|barras|precio|stock|unidad(es)?/g)||[]).length - 1*(t.match(/\bproveedor(es)?\b/g)||[]).length + t.length/10000
        : 2*(t.match(/\bproveedor(es)?\b/g)||[]).length + 1*(t.match(/agregar proveedor|nombre del proveedor|rfc|telefono|correo/g)||[]).length - 1*(t.match(/\bproducto(s)?\b/g)||[]).length + t.length/10000;
    };

    const provSorted=candidates.map(el=>({el,s:score(el,'prov')})).sort((a,b)=>b.s-a.s);
    const prodSorted=candidates.map(el=>({el,s:score(el,'prod')})).sort((a,b)=>b.s-a.s);

    let provPanel = provSorted[0]?.el||null;
    let prodPanel = prodSorted.find(x=> x.el!==provPanel && !(provPanel&&(x.el.contains(provPanel)||provPanel.contains(x.el))))?.el||null;
    if (!provPanel || !prodPanel){ console.log('[admin-slim.v2] tabs: no separé paneles',{prov:!!provPanel,prod:!!prodPanel,candidates:candidates.length}); return; }

    function show(panel){
      [provPanel,prodPanel].forEach(p=>{
        p.hidden=(p!==panel);
        p.style.display=(p===panel?'':'none');
        p.style.visibility='';
      });
      panel.scrollIntoView({behavior:'smooth',block:'start'});
    }
    show(provPanel);
    btnProv.addEventListener('click',()=>show(provPanel),{capture:true});
    btnProd.addEventListener('click',()=>show(prodPanel ),{capture:true});

    console.log('[admin-slim.v2] tabs: ok', {candidates:candidates.length});
  }

  function enhanceProvidersUI(){
    // --- Alta rápida de un producto (usa el mismo formato de Importación) ---
function injectQuickProductForm(){
  const $$  = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();

  // Localiza la tarjeta de "Importación de Productos"
  const header = $$("h1,h2,h3,legend,.card-header,.section-title,.title")
    .find(h => {
      const t = norm(h.textContent);
      return t.includes("importación de productos") || t.includes("importacion de productos");
    });
  if (!header) { console.log('[admin-slim.v2] quick-prod: no header'); return; }

  const card = header.closest(".card,section,article,div") || header.parentElement;

  // Evitar duplicados
  if (card.querySelector('#quick-prod-form')) return;

  // Busca el textarea donde pegas las líneas
  const ta = card.querySelector('textarea, [contenteditable="true"]');
  if (!ta) { console.log('[admin-slim.v2] quick-prod: no textarea'); return; }

  // Inserta mini-form
  const wrap = document.createElement('div');
  wrap.id = 'quick-prod-form';
  wrap.innerHTML = `
   <div style="background:#fff7e6;border:1px dashed #ffc14d;padding:8px;border-radius:8px;margin:8px 0">
     <b>Alta rápida de un producto</b>
     <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px;margin-top:6px">
       <input placeholder="Proveedor">
       <input placeholder="Producto">
       <input placeholder="Max Stock" type="number" min="0">
       <input placeholder="Código">
       <input placeholder="Unidades/Paq" type="number" min="0">
       <select data-role="tipo">
         <option value="PAQUETE">PAQUETE</option>
         <option value="INDIVIDUAL">INDIVIDUAL</option>
       </select>
     </div>
     <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">
       <button type="button" id="qp-add" class="btn">Agregar a la lista</button>
       <button type="button" id="qp-clear" class="btn">Limpiar</button>
     </div>
   </div>`;

  card.insertBefore(wrap, header.nextSibling);

  const q = (s)=>wrap.querySelector(s);
  q('#qp-add').addEventListener('click', ()=>{
    const vals = Array.from(wrap.querySelectorAll('input,select')).map(i => (i.value||'').trim());
    if (vals.some(v=>!v)) { alert('Completa todos los campos'); return; }
    // Formato: A|B|C|D|E|F tal como en tu ejemplo
    const line = `${vals[0]} | ${vals[1]} | ${vals[2]} | ${vals[3]} | ${vals[4]} | ${vals[5]}`;
    ta.value = (line + '\n' + (ta.value||'')).trim();

    // Dispara "Vista Previa" si existe
    const previewBtn = Array.from(card.querySelectorAll('button,.btn'))
      .find(b => norm(b.textContent).includes('vista previa'));
    previewBtn && previewBtn.click();

    // Opcional: desplazarse al preview
    wrap.scrollIntoView({behavior:'smooth', block:'start'});
  });
  q('#qp-clear').addEventListener('click', ()=> wrap.querySelectorAll('input').forEach(i=>i.value=''));

  console.log('[admin-slim.v2] quick-prod: OK');
}
    
    const header = $$("h1,h2,h3,legend,.card-header,.section-title,.title")
      .find(h=>norm(h.textContent).includes("proveedores existentes"));
    if (!header){ console.log('[admin-slim.v2] prov-ui: sin encabezado'); return; }
    const card = header.closest(".card,section,article,div")||header.parentElement;

    const containers = $$(".card,section,article,div,ul,ol", card);
    function scoreContainer(el){
      let rows=0; for(const ch of el.children||[]){
        const t=(ch.innerText||"").trim();
        const hasBtns=ch.querySelector("button,[role='button'],.btn,svg,i[class*='edit'],i[class*='trash']");
        if (t.length>0 && (hasBtns || t.length>15)) rows++;
      } return rows;
    }
    const list = containers.sort((a,b)=>scoreContainer(b)-scoreContainer(a))[0];
    if (!list || scoreContainer(list)<2){ console.log('[admin-slim.v2] prov-ui: sin lista convincente'); return; }

    const rows = Array.from(list.children).filter(el=>el.nodeType===1);

    rows.forEach(r=>{
      const pill = Array.from(r.querySelectorAll("*")).find(x=>{
        const tx = norm(x.textContent);
        return tx==='color' || tx.startsWith('color ');
      });
      if (pill) pill.style.display='none';
    });

    function providerName(row){
      const cand=row.querySelector("b,strong,.name,.title,h1,h2,h3");
      if (cand) return cand.innerText.trim();
      return (row.innerText||"").trim().split("\n")[0].replace(/^proveedor(es)?:\s*/i,"").trim();
    }
    rows.sort((a,b)=> norm(providerName(a)).localeCompare(norm(providerName(b)),'es',{sensitivity:'base'}));

    if (!document.getElementById('prov-alt-style')){
      const st=document.createElement('style'); st.id='prov-alt-style';
      st.textContent = `.prov-alt{border-radius:10px;padding:8px;margin:6px 0}
                         .prov-alt-0{background:#f0f6ff}
                         .prov-alt-1{background:#f6f7f9}`;
      document.head.appendChild(st);
    }
    rows.forEach((row,i)=>{
      row.classList.remove('prov-alt-0','prov-alt-1','prov-alt');
      row.classList.add('prov-alt', (i%2===0)?'prov-alt-0':'prov-alt-1');
      list.appendChild(row);
    });

    if (!list.__provObserver){
      const apply=()=>{
        const rows2=Array.from(list.children).filter(el=>el.nodeType===1);
        rows2.sort((a,b)=> norm(providerName(a)).localeCompare(norm(providerName(b)),'es',{sensitivity:'base'}));
        rows2.forEach((r,i)=>{
          r.classList.remove('prov-alt-0','prov-alt-1','prov-alt');
          r.classList.add('prov-alt', (i%2===0)?'prov-alt-0':'prov-alt-1');
          list.appendChild(r);
        });
      };
      const mo=new MutationObserver(()=>setTimeout(apply,50));
      mo.observe(list,{childList:true,subtree:false});
      list.__provObserver=mo;
    }
    console.log('[admin-slim.v2] prov-ui: aplicado', {items: rows.length});
  }

 function runAll(){
  if (!isAdminScreen()) { console.log('[admin-slim.v2] skip (no admin)'); return; }
  removeWholeSystemBlocks();
  wireLocalTabsV5();
  enhanceProvidersUI();
  injectQuickProductForm();   // ← esta línea

  console.log('[admin-slim.v2] activo');
}

  // Exponer para pruebas desde consola
  window.__asRunAll = runAll;

  const start=()=>{
    runAll();
    const t0=Date.now();
    const obs=new MutationObserver(()=>{
      if (Date.now()-t0>6000){ obs.disconnect(); return; }
      runAll();
    });
    obs.observe(document,{childList:true,subtree:true});
  };

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
