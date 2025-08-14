/*! admin-tabs.js v1.5 — no reemplaza handlers; destapa ancestros y centra */
(function(){
  function byText(sel, rx){
    for (const el of document.querySelectorAll(sel)) {
      const t = (el.textContent || '').toLowerCase();
      if (rx.test(t)) return el;
    }
    return null;
  }
  function findProductos(){
    return byText(
      'h1,h2,h3,legend,label,button,div,section,article',
      /\bproductos\b|productos por proveedor|agregar producto|importaci[oó]n de productos/
    );
  }
  function findProveedores(){
    return byText(
      'h1,h2,h3,legend,label,button,div,section,article',
      /\bproveedores\b|agenda de proveedores/
    );
  }
  function ensureVisible(el){
    if (!el) return;
    // Abre <details>, quita atributos/clases que ocultan y corrige estilos
    let n = el;
    while (n && n !== document.body) {
      if (n.tagName === 'DETAILS' && !n.open) n.open = true;
      if (n.hasAttribute('hidden')) n.hidden = false;
      const cs = getComputedStyle(n);
      if (cs.display === 'none') n.style.display = 'block';
      if (cs.visibility === 'hidden') n.style.visibility = 'visible';
      // Quitar clases comunes de ocultamiento
      try {
        n.classList.remove('hidden','d-none','collapse','collapsed','is-hidden','invisible');
      } catch(_){}
      n = n.parentElement;
    }
  }
  function focusAfterAppToggles(targetFinder){
    // Espera a que tu handler original haga su trabajo, luego destapa y centra
    setTimeout(() => {
      const el = targetFinder();
      if (!el) return;
      ensureVisible(el);
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }, 80);
  }
  function main(){
    const btnProd = document.getElementById('manageProductsTab');
    const btnProv = document.getElementById('manageSuppliersTab');
    if (!btnProd || !btnProv) return;

    // No sobrescribimos onclick existentes; añadimos listeners aparte
    btnProd.addEventListener('click', () => focusAfterAppToggles(findProductos), {passive:true, capture:false});
    btnProv.addEventListener('click', () => focusAfterAppToggles(findProveedores), {passive:true, capture:false});

    // Si el DOM cambia (SPA), seguimos funcionando por el setTimeout de arriba
    console.log('[admin-tabs] v1.5 listo (no override + ensureVisible)');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
