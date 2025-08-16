/* calendar-scroll-fix.js v1 */
(function () {
  function enhanceGrid(grid) {
    if (!grid) return;

    // Envolver en un contenedor desplazable (una sola vez)
    if (!grid.parentElement.classList.contains('cal-scroll-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'cal-scroll-wrap';
      wrap.style.overflowX = 'auto';
      wrap.style.overflowY = 'hidden';
      wrap.style.webkitOverflowScrolling = 'touch';
      wrap.style.scrollSnapType = 'x mandatory';
      wrap.style.paddingBottom = '6px';

      grid.parentNode.insertBefore(wrap, grid);
      wrap.appendChild(grid);

      // Asegura ancho para tener scroll horizontal
      grid.style.minWidth = '1100px';
      grid.querySelectorAll('.day-col').forEach(col => {
        col.style.scrollSnapAlign = 'center';
      });

      // Permite desplazar con la rueda del mouse (vertical->horizontal)
      wrap.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          wrap.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }, { passive: false });
    }

    // Centra automáticamente el día actual
    const wrap = grid.parentElement;
    const today = new Date().getDay(); // 0=Dom .. 6=Sab
    const col = grid.querySelector('.day-col[data-day="' + today + '"]');
    if (col && wrap) {
      const target = col.offsetLeft - Math.max(0, (wrap.clientWidth - col.clientWidth) / 2);
      wrap.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  }

  function run() {
    enhanceGrid(document.getElementById('calendarGridUser'));
    enhanceGrid(document.getElementById('calendarGridAdmin'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
