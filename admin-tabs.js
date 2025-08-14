/*! admin-tabs.js v1.3 — scroll + ensureVisible (no oculta nada) */
(function(){
  function byText(sel, rx){
    for (const el of document.querySelectorAll(sel)) {
      const t = (el.textContent || '').toLowerCase();
      if (rx.test(t)) return el;
    }
    return null;
  }
  function findProductos(){
    return byText('h1,h2,h3,legend,label,button,div,section,article',
                  /\bproductos\b|productos por proveedor|agregar producto/);
  }
  function findProveedores(){
    return byText('h1,h2,h3,legend,label,button,div,section,article',
                  /\bproveedores\b/);
  }
  function ensureVisible(el){
    if (!el) return;
    let n = el;
    while (n && n !== document.body) {
      if (n.hasAttribute('hidden')) n.hidden = false;
      const cs = getComputedStyle(n);
      if (cs.display === 'none') n.style.display = 'block';
      if (cs.visibility === 'hidden') n.style.visibility = 'visible';
      n = n.parentElement;
    }
  }
  function highlightAndShow(el){
    if (!el) return;
    ensureVisible(el);
    el.scrollIntoView({behavior:'smooth', block:'start'});
    const prev = el.style.outline;
    el.style.outline = '2px solid #2563eb';
    setTimeout(()=>{ el.style.outline = prev; }, 1200);
  }
  function main(){
    const btnProd = document.getElementById('manageProductsTab');
    const btnProv = document.getElementById('manageSuppliersTab');
    if (!btnProd || !btnProv) return;

    let toProd = findProductos();
    let toProv = findProveedores();

    // Re-escanea cuando el DOM cambia (SPA)
    const obs = new MutationObserver(() => {
      if (!toProd) toProd = findProductos();
      if (!toProv) toProv = findProveedores();
    });
    obs.observe(document.body, {subtree:true, childList:true});

    btnProd.onclick = e => { e.preventDefault?.(); highlightAndShow(toProd || document.body); };
    btnProv.onclick = e => { e.preventDefault?.(); highlightAndShow(toProv || document.body); };

    console.log('[admin-tabs] v1.3 ready', {btnProd, btnProv, toProd, toProv});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
