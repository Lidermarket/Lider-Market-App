/*! admin-tabs.js v1.2 (modo scroll seguro) */
(function(){
  function byText(sel, rx){
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const t = (el.textContent || '').toLowerCase();
      if (rx.test(t)) return el;
    }
    return null;
  }
  function findProductos(){
    // títulos/botones/etiquetas típicas
    return byText('h1,h2,h3,legend,label,button,div,section,article', /\bproductos\b|productos por proveedor|agregar producto/);
  }
  function findProveedores(){
    return byText('h1,h2,h3,legend,label,button,div,section,article', /\bproveedores\b/);
  }
  function highlight(el){
    if (!el) return;
    const prev = el.style.outline;
    el.scrollIntoView({behavior:'smooth', block:'start'});
    el.style.outline = '2px solid #2563eb';
    setTimeout(()=>{ el.style.outline = prev; }, 1200);
  }
  function main(){
    const btnProd = document.getElementById('manageProductsTab');
    const btnProv = document.getElementById('manageSuppliersTab');
    if (!btnProd || !btnProv) return;

    let toProd = findProductos();
    let toProv = findProveedores();

    // Reintento por si el DOM cambia después de cargar (SPA)
    const observer = new MutationObserver(() => {
      if (!toProd) toProd = findProductos();
      if (!toProv) toProv = findProveedores();
    });
    observer.observe(document.body, {subtree:true,childList:true});

    btnProd.onclick = (e)=>{ e.preventDefault?.(); highlight(toProd || document.body); };
    btnProv.onclick = (e)=>{ e.preventDefault?.(); highlight(toProv || document.body); };

    console.log('[admin-tabs] scroll-mode ready', {btnProd, btnProv, toProd, toProv});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
