<script>
// calendar-scroll-fix.js
(() => {
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const norm = s => (s||"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();

  function findWeekContainer(){
    const dayWords = ["lunes","martes","miercoles","miércoles","jueves","viernes","sabado","sábado","domingo",
                      "lun","mar","mie","mié","jue","vie","sab","sáb","dom"];
    const blocks = $$("section,article,div,ul,ol");
    for (const el of blocks){
      const kids = $(":scope > *", el);
      if (kids.length < 5) continue;
      const hits = kids.slice(0,8).reduce((n,ch)=>{
        const t = norm(ch.innerText||"");
        return n + (dayWords.some(d=>t.startsWith(d)) ? 1 : 0);
      },0);
      if (hits >= 5) return el;
    }
    return null;
  }

  function enableHorizontal(week){
    // estilos mínimos para scroll horizontal + snap
    Object.assign(week.style, {
      overflowX: "auto",
      whiteSpace: "nowrap",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "thin"
    });
    // cada día se trata como "bloque" alineable
    $(":scope > *", week).forEach(d=>{
      d.style.display = "inline-block";
      d.style.verticalAlign = "top";
      d.style.scrollSnapAlign = "center";
      d.style.minWidth = "220px";      // ajusta si lo necesitas
      d.style.boxSizing = "border-box";
    });

    // arrastre con mouse/touch
    let isDown=false, startX=0, startScroll=0;
    week.addEventListener("pointerdown", e=>{
      isDown=true; startX=e.clientX; startScroll=week.scrollLeft;
      week.setPointerCapture(e.pointerId);
    });
    week.addEventListener("pointermove", e=>{
      if(!isDown) return;
      week.scrollLeft = startScroll - (e.clientX - startX);
    }, {passive:true});
    week.addEventListener("pointerup", ()=>{ isDown=false; });
    week.addEventListener("pointercancel", ()=>{ isDown=false; });

    // centrar en "hoy"
    const full = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
    const todayIdx = new Date().getDay(); // 0=Dom ... 6=Sab
    const todayNames = [full[todayIdx]];
    if (todayNames[0]==="miercoles") todayNames.push("miércoles");
    if (todayNames[0]==="sabado") todayNames.push("sábado");

    const target = $(":scope > *", week).find(ch=>{
      const t = norm(ch.innerText||"");
      return todayNames.some(n => t.startsWith(n) || t.includes(n));
    }) || $(":scope > *", week)[0];

    target && target.scrollIntoView({behavior:"smooth", inline:"center", block:"nearest"});
  }

  function run(){
    const week = findWeekContainer();
    if(!week) return;
    enableHorizontal(week);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else { run(); }

  // pequeños cambios posteriores al render
  const t0 = Date.now();
  const mo = new MutationObserver(()=>{
    if (Date.now()-t0 > 6000) { mo.disconnect(); return; }
    run();
  });
  mo.observe(document, {childList:true, subtree:true});
})();
</script>
