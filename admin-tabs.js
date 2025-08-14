/*! admin-tabs.js v1.4 — no reemplaza handlers; asegura visibilidad y scroll */
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
                  /\bproductos\b|productos por proveedor|agregar producto|importaci[oó]n de productos/);
  }
  function findProveedores(){
    return byText('h1,h2,h3,legend,label,button,div,section,article',
                  /\bproveedores\b|agenda de proveedores/);
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
  function afterToggleFocus(targetFinder){
    // Da tiempo a que tu handler original cambie la vista (SPA),
    // luego destapa y centra.
    setTimeout(() => {
      const el = targetFinder();
      if (!el) return;
      ensureVisible(el);
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 50);
  }
  function main(){
    const btnProd = document.getElementById('manageProductsTab');
    const btnProv = document.getElementById('manageSuppliersTab');
    if (!btnProd || !btnProv) return;

    // No sobrescribimos onclick; añadimos listeners aparte
    btnProd.addEventListener('click', () => afterToggleFocus(findProductos), {passive:true});
    btnProv.addEventListener('click', () => afterToggleFocus(findProveedores), {passive:true});

    // Re-escaneo por si cambia el DOM (SPA)
    const obs = new MutationObserver(() => {});
    obs.observe(document.body, {subtree:true, childList:true});

    console.log('[admin-tabs] v1.4 listo (handlers no reemplazados)');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
