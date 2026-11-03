// GitHub Pages' CDN keeps a 404 for ten minutes. A page opened while a deploy is
// propagating can get that 404 for its hashed stylesheet and stay unstyled until
// it expires, so a stylesheet that failed loads once more under a fresh URL.
const script = `(function(){
  function retry(link){
    if(link.dataset.retried)return;
    try{if(link.sheet&&link.sheet.cssRules.length)return;}catch(e){return;}
    link.dataset.retried="1";
    var again=link.cloneNode();
    again.removeAttribute("data-precedence");
    again.dataset.retried="1";
    again.href=link.href+(link.href.indexOf("?")<0?"?":"&")+"r="+Date.now();
    link.parentNode.insertBefore(again,link.nextSibling);
  }
  document.addEventListener("error",function(e){
    var t=e.target;
    if(t&&t.tagName==="LINK"&&t.rel==="stylesheet")retry(t);
  },true);
  addEventListener("load",function(){
    document.querySelectorAll('link[rel="stylesheet"]').forEach(retry);
  });
})();`;

export function StyleRetry() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
