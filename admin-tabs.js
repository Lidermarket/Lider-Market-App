
/*! admin-tabs.js v1.0 */
(function(){
  function norm(t){return (t||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').trim();}
  function pickSection(keyword){
    const nodes = Array.from(document.querySelectorAll('section,div,article'));
    const scored = nodes.map(el=>{
      const txt = norm(el.innerText||'');
      const p = (txt.match(/productos/g)||[]).length;
      const v = (txt.match(/proveedores/g)||[]).length;
      const score = (keyword==='productos' ? p - v*0.7 : v - p*0.7);
      return {el, score, len: txt.length};
    }).filter(x => x.score > 0 && x.len > 200);
    scored.sort((a,b)=> (b.score - a.score) || (b.len - a.len));
    return scored[0]?.el || null;
  }
  function main(){
    var btnProductos = document.getElementById('manageProductsTab');
    var btnProveedores = document.getElementById('manageSuppliersTab');
    if(!btnProductos || !btnProveedores) return;
    var secProductos = pickSection('productos');
    var secProveedores = pickSection('proveedores');
    if (secProductos && secProveedores && secProductos === secProveedores) {
      secProveedores = secProveedores.nextElementSibling || secProveedores.previousElementSibling || null;
    }
    var debug = /[?&]debugTabs=1\b/.test(location.search);
    if (debug && !document.getElementById('admin-tabs-style')){
      const st = document.createElement('style'); st.id = 'admin-tabs-style';
      st.textContent = '._debugProductos{outline:2px dashed #22c55e} ._debugProveedores{outline:2px dashed #f59e0b} [hidden]{display:none!important} .tab-active{background:#2563eb;color:#fff}';
      document.head.appendChild(st);
      secProductos && secProductos.classList.add('_debugProductos');
      secProveedores && secProveedores.classList.add('_debugProveedores');
    }
    function activate(which){
      if (which==='productos'){
        secProductos && (secProductos.hidden = false);
        secProveedores && (secProveedores.hidden = true);
        btnProductos && (btnProductos.classList.add('tab-active'), btnProductos.setAttribute('aria-selected','true'));
        btnProveedores && (btnProveedores.classList.remove('tab-active'), btnProveedores.setAttribute('aria-selected','false'));
      } else {
        secProductos && (secProductos.hidden = true);
        secProveedores && (secProveedores.hidden = false);
        btnProductos && (btnProductos.classList.remove('tab-active'), btnProductos.setAttribute('aria-selected','false'));
        btnProveedores && (btnProveedores.classList.add('tab-active'), btnProveedores.setAttribute('aria-selected','true'));
      }
    }
    btnProductos.addEventListener('click', function(e){ e.preventDefault?.(); activate('productos'); });
    btnProveedores.addEventListener('click', function(e){ e.preventDefault?.(); activate('proveedores'); });
    if (secProductos && secProveedores) { secProductos.hidden = true; secProveedores.hidden = false; }
    window.__adminTabs = {btnProductos, btnProveedores, secProductos, secProveedores, activate};
    console.log('[admin-tabs] listo', window.__adminTabs);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();
})();
