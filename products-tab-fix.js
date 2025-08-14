/*! products-tab-fix.js v1.0 */
(function(){
  function $(s,r){return(r||document).querySelector(s)}
  function $all(s,r){return Array.from((r||document).querySelectorAll(s))}
  function norm(t){return (t||"").toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim()}
  function any(a){return a.find(Boolean)}
  function byIds(ids){for(const id of ids){const el=document.getElementById(id);if(el)return el}return null}
  function byText(tags, txt){
    const n=norm(txt), els=$all(tags);
    return els.find(el=>norm(el.textContent||el.value||"").includes(n))
  }
  const btnProductos = any([
    $('[data-tab="productos"]'),
    $('[data-target="#productos"],[data-target="productos"]'),
    byText('button,a,[role="tab"],input[type="button"],.btn,.tab','productos')
  ]);
  const btnProveedores = any([
    $('[data-tab="proveedores"]'),
    $('[data-target="#proveedores"],[data-target="proveedores"]'),
    byText('button,a,[role="tab"],input[type="button"],.btn,.tab','proveedores')
  ]);
  const secProductos = any([
    byIds(['admin-products','adminProductos','productos','productosSection','gestion-productos','tabProductos','sectionProductos']),
    $('[data-section="productos"],[data-panel="productos"],[data-view="productos"]'),
    (function(){const h=byText('h1,h2,h3,[role="heading"]','productos');return h?h.closest('section,div,article'):null})()
  ]);
  const secProveedores = any([
    byIds(['admin-proveedores','adminProveedores','proveedores','proveedoresSection','gestion-proveedores','tabProveedores','sectionProveedores']),
    $('[data-section="proveedores"],[data-panel="proveedores"],[data-view="proveedores"]'),
    (function(){const h=byText('h1,h2,h3,[role="heading"]','proveedores');return h?h.closest('section,div,article'):null})()
  ]);
  if(!document.getElementById('products-tab-fix-style')){
    const st=document.createElement('style');st.id='products-tab-fix-style';
    st.textContent='[hidden]{display:none!important}.tab-active{background:#2563eb;color:#fff}';
    document.head.appendChild(st);
  }
  function activate(which){
    if(which==='productos'){
      secProductos&&(secProductos.hidden=false);
      secProveedores&&(secProveedores.hidden=true);
      btnProductos&&(btnProductos.classList.add('tab-active'),btnProductos.setAttribute('aria-selected','true'));
      btnProveedores&&(btnProveedores.classList.remove('tab-active'),btnProveedores.setAttribute('aria-selected','false'));
    }else{
      secProductos&&(secProductos.hidden=true);
      secProveedores&&(secProveedores.hidden=false);
      btnProductos&&(btnProductos.classList.remove('tab-active'),btnProductos.setAttribute('aria-selected','false'));
      btnProveedores&&(btnProveedores.classList.add('tab-active'),btnProveedores.setAttribute('aria-selected','true'));
    }
    console.log('[products-tab-fix] activa:',which,{btnProductos,btnProveedores,secProductos,secProveedores});
  }
  btnProductos&&btnProductos.addEventListener('click',e=>{e.preventDefault?.();activate('productos')});
  btnProveedores&&btnProveedores.addEventListener('click',e=>{e.preventDefault?.();activate('proveedores')});
  const h=norm(location.hash.replace('#',''));
  if(h.includes('producto')) activate('productos');
  else if(h.includes('proveedor')) activate('proveedores');
  else if(secProductos&&secProveedores) activate('proveedores');
  window.__productsTabFix={activateTab:activate,btnProductos,btnProveedores,secProductos,secProveedores};
})();
