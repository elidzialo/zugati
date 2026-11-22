/* Eli HQ - small "All hubs" button. Shown only on a device where Eli logged in to Eli HQ
   (localStorage eliHome, valid 7 days). Never shown to Sesa partners (email login = sesaUser). */
(function(){
  try{
    var o=JSON.parse(localStorage.getItem('eliHome')||'null');
    if(!o||!o.pw||Date.now()-o.t>6048e5)return;
    if(location.pathname.indexOf('/sesa/')>-1&&localStorage.getItem('sesaUser'))return;
  }catch(e){return}
  var base=(document.currentScript&&document.currentScript.src)||'';
  var href=base?base.replace(/back\.js.*$/,''):'/zugati/home/';
  var a=document.createElement('a');
  a.href=href;a.setAttribute('aria-label','All hubs');a.id='eliHomeBtn';
  a.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>';a.title='All hubs';
  a.style.cssText='position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:40;display:flex;align-items:center;justify-content:center;'+
    'width:44px;height:44px;border-radius:50%;opacity:.92;background:rgba(17,19,24,.88);color:#fff;font:600 13px/1 Poppins,-apple-system,Segoe UI,Roboto,sans-serif;'+
    'text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)';
  function add(){if(!document.getElementById('eliHomeBtn'))document.body.appendChild(a)}
  if(document.body)add();else document.addEventListener('DOMContentLoaded',add);
})();
