
// gesture-update.js — improves hidden updater reveal on desktop & mobile
(function(){
  function ensureUI(){
    var wrap = document.getElementById('app-update-controller');
    var btn  = document.getElementById('btn-force-update');
    var toast= document.getElementById('app-update-toast');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'app-update-controller';
      wrap.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:99999;display:none';
      document.body.appendChild(wrap);
    }
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'btn-force-update';
      btn.textContent = 'Actualizar app';
      btn.style.cssText = 'padding:10px 14px;border:none;border-radius:10px;box-shadow:0 6px 16px rgba(0,0,0,.2);font-weight:600;background:#2563eb;color:#fff;cursor:pointer';
      wrap.appendChild(btn);
    }
    if(!toast){
      toast = document.createElement('div');
      toast.id = 'app-update-toast';
      toast.textContent = 'Actualización lista. Reinicia la app.';
      toast.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111827;color:#fff;padding:10px 14px;border-radius:10px;display:none;z-index:99999';
      document.body.appendChild(toast);
    }
    return {wrap, btn, toast};
  }

  function showToast(msg){
    var el = document.getElementById('app-update-toast');
    if(!el) return;
    el.textContent = msg || 'Actualización lista';
    el.style.display = 'block';
    setTimeout(function(){ el.style.display = 'none'; }, 2500);
  }

  function forceUpdate(){
    if(!('serviceWorker' in navigator)) return showToast('Sin Service Worker');
    navigator.serviceWorker.getRegistrations().then(function(regs){
      if(!regs.length) return showToast('SW no registrado');
      return Promise.all(regs.map(function(r){ return r.update().catch(function(){}); }))
        .then(function(){
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
          }
          showToast('Buscando actualización...');
          setTimeout(function(){ location.reload(); }, 1200);
        });
    });
  }

  // Set up gestures: 6 taps ANYWHERE within 1.2s (works on mobile) or long-press 1.2s
  var tapCount = 0, tapTimer = null, pressTimer = null;
  function registerGestures(){
    var ui = ensureUI();
    ui.btn.onclick = forceUpdate;

    function reveal(){
      ui.wrap.style.display = 'block';
    }

    // Multi-tap (mouse or touch)
    function onTap(){
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function(){ tapCount = 0; }, 1200);
      if(tapCount >= 6){
        tapCount = 0;
        reveal();
      }
    }

    // Long-press (touch and mouse)
    function startPress(){
      clearTimeout(pressTimer);
      pressTimer = setTimeout(reveal, 1200);
    }
    function endPress(){
      clearTimeout(pressTimer);
    }

    document.addEventListener('click', onTap, true);
    document.addEventListener('touchstart', function(){ onTap(); startPress(); }, {passive:true});
    document.addEventListener('touchend', endPress, {passive:true});
    document.addEventListener('mousedown', startPress, true);
    document.addEventListener('mouseup', endPress, true);

    // Keyboard shortcut as fallback
    document.addEventListener('keydown', function(e){
      if(e.ctrlKey && e.altKey && (e.key==='u' || e.key==='U')) reveal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerGestures);
  } else {
    registerGestures();
  }

  // Listen for SW update-ready message to nudge the user
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', function(event){
      if(event.data && event.data.type === 'UPDATE_READY'){
        ensureUI().wrap.style.display = 'block';
        showToast('Actualización lista. Reinicia la app');
      }
    });
  }
})();
