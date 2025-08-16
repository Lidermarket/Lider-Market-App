<script>
// calendar-scroll-fix.js
(function () {
  'use strict';

  // Estilos mínimos para el wrapper de scroll
  const CSS = `
  .cal-scroll-wrap{
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    width:100%;
  }`;
  const styleTag = document.createElement('style');
  styleTag.textContent = CSS;
  document.head.appendChild(styleTag);

  function ensureScrollable(grid){
    if(!grid) return null;
    // Si aún no tiene wrapper, lo creamos
    const parent = grid.parentElement;
    if(!parent) return null;
    if(!parent.classList.contains('cal-scroll-wrap')){
      const wrap = document.createElement('div');
      wrap.className = 'cal-scroll-wrap';
      parent.insertBefore(wrap, grid);
      wrap.appendChild(grid);
      // Fuerza un ancho mínimo para que quepan los 7 días y se pueda deslizar
      grid.style.minWidth = '980px'; // ~7 columnas de 140px
      return wrap;
    }
    return parent;
  }

  function centerToday(grid, wrap){
    if(!grid || !wrap) return;
    const today = new Date().getDay(); // 0..6 (0=Domingo)
    const col = grid.querySelector(`.day-col[data-day="${today}"]`);
    if(!col) return;

    // Centrar esa columna en el contenedor con scroll
    const rectGrid = grid.getBoundingClientRect();
    const rectCol  = col.getBoundingClientRect();
    const colCenter = (rectCol.left - rectGrid.left) + (rectCol.width / 2);
    const target = Math.max(0, colCenter - (wrap.clientWidth / 2));
    wrap.scrollTo({ left: target, behavior: 'smooth' });
  }

  function apply(){
    const ids = ['calendarGridUser','calendarGridAdmin'];
    ids.forEach(id=>{
      const grid = document.getElementById(id);
      if(!grid) return;
      const wrap = ensureScrollable(grid);
      if(!wrap) return;
      // Intento inmediato…
      centerToday(grid, wrap);
      // …y un reintento tras layout
      setTimeout(()=>centerToday(grid, wrap), 200);
    });
  }

  // Ejecutar al cargar y en resize
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  window.addEventListener('resize', ()=> setTimeout(apply, 150));
})();
</script>
