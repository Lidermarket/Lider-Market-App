/*! calendar-week-fix.js v1 */
(() => {
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const norm = s => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  const dayNames = ['lunes','martes','miercoles','miércoles','jueves','viernes','sabado','sábado','domingo'];

  function looksLikeWeek(el){
    const text = norm(el.innerText).slice(0, 1200);
    let hits = 0; for (const d of dayNames) if (text.includes(d)) hits++;
    return hits >= 3 && el.querySelectorAll('div,section,article').length >= 7;
  }

  function enhance(){
    // Estilos (una sola vez)
    if (!document.getElementById('week-scroll-style')){
      const st = document.createElement('style'); st.id = 'week-scroll-style';
      st.textContent = `
      .week-scroll{overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch;
                   scroll-snap-type:x mandatory; scroll-padding:16px}
      .week-grid{display:grid; grid-auto-flow:column; grid-auto-columns:min(90vw, 420px);
                 gap:12px; align-items:start}
      .week-day{scroll-snap-align:center}
      @media (min-width:1000px){ .week-grid{grid-auto-columns:min(45vw, 520px);} }
      `;
      document.head.appendChild(st);
    }

    // Buscar el contenedor de la semana
    let card = $$('section,article,.card,div').find(looksLikeWeek);
    if (!card || card.classList.contains('week-hacked')) return;
    card.classList.add('week-hacked');

    // Tomar los hijos (días)
    let days = Array.from(card.children).filter(e => e.nodeType === 1 && e.textContent.trim() !== '');
    if (days.length < 7) days = $$(':scope > *', card);

    // Armar wrapper de scroll
    const wrap = document.createElement('div'); wrap.className = 'week-scroll';
    const grid = document.createElement('div'); grid.className = 'week-grid';
    card.parentElement.insertBefore(wrap, card);
    wrap.appendChild(grid);

    days.forEach(d => { d.classList.add('week-day'); grid.appendChild(d); });
    card.style.display = 'none'; // ocultamos el contenedor viejo

    // Centrar “hoy”
    const todayName = new Date().toLocaleDateString('es-MX', { weekday: 'long' });
    const today = days.find(d => norm(d.innerText).includes(norm(todayName)));
    setTimeout(() => {
      (today || days[0]).scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  }

  const start = () => {
    enhance();
    // Por si el calendario se monta tarde
    const obs = new MutationObserver(() => enhance());
    obs.observe(document, { childList: true, subtree: true });
    setTimeout(() => obs.disconnect(), 8000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
