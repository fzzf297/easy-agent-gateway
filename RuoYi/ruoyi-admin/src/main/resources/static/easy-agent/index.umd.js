(function(q,X){typeof exports=="object"&&typeof module<"u"?X(exports):typeof define=="function"&&define.amd?define(["exports"],X):(q=typeof globalThis<"u"?globalThis:q||self,X(q.EasyAgentGateway={}))})(this,function(q){"use strict";var ms=Object.defineProperty;var gs=(q,X,ke)=>X in q?ms(q,X,{enumerable:!0,configurable:!0,writable:!0,value:ke}):q[X]=ke;var I=(q,X,ke)=>gs(q,typeof X!="symbol"?X+"":X,ke);class X{constructor(){I(this,"buffer","")}push(u){this.buffer+=u.replace(/\r\n/g,`
`).replace(/\r/g,`
`);const t=[];let n=this.buffer.indexOf(`

`);for(;n>=0;){const r=this.buffer.slice(0,n);this.buffer=this.buffer.slice(n+2);const i=ke(r);i&&t.push(i),n=this.buffer.indexOf(`

`)}return t}flush(){if(!this.buffer.trim())return this.buffer="",[];const u=ke(this.buffer);return this.buffer="",u?[u]:[]}}function ke(e){const u=e.split(`
`),t=[];let n,r;for(const i of u){if(!i||i.startsWith(":"))continue;const o=i.indexOf(":"),s=o>=0?i.slice(0,o):i,a=o>=0?i.slice(o+1):"",l=a.startsWith(" ")?a.slice(1):a;s==="id"&&(n=l),s==="event"&&(r=l),s==="data"&&t.push(l)}return t.length?{id:n,event:r,data:t.join(`
`)}:null}function Lu(e){try{const u=JSON.parse(e.data);return{id:e.id,type:u.type||e.event||"message",payload:u.payload}}catch{return{id:e.id,type:e.event||"message",payload:e.data}}}function pr(e){const u=new X;return[...u.push(e),...u.flush()].map(Lu)}function Ee(e,u){const t=e.replace(/\/+$/,""),n=u.startsWith("/")?u:`/${u}`;return`${t}${n}`}class Mu extends Error{constructor(t,n,r,i){super(n);I(this,"status");I(this,"detail");I(this,"retryAfter");I(this,"payload");this.name="AgentApiError",this.status=t,this.detail=n,this.payload=r,this.retryAfter=i}}class wt{constructor(u){I(this,"apiBaseUrl");I(this,"headers");I(this,"fetchImpl");if(!u.apiBaseUrl&&u.apiBaseUrl!=="")throw new Error("apiBaseUrl is required");this.apiBaseUrl=u.apiBaseUrl,this.headers=u.headers||{},this.fetchImpl=u.fetchImpl||globalThis.fetch.bind(globalThis)}async getHealth(){const u=await this.fetchImpl(Ee(this.apiBaseUrl,"/agent/health"),{headers:this.defaultHeaders()});return this.readJson(u)}async createSession(u=""){const t=await this.fetchImpl(Ee(this.apiBaseUrl,"/api/agent/sessions"),{method:"POST",headers:this.jsonHeaders(),body:JSON.stringify({user_label:u})});return this.readJson(t)}async getHistory(u){const t=await this.fetchImpl(Ee(this.apiBaseUrl,`/api/agent/sessions/${encodeURIComponent(u)}/history`),{headers:this.defaultHeaders()});return this.readJson(t)}async scoreSession(u,t){const n=await this.fetchImpl(Ee(this.apiBaseUrl,`/api/agent/sessions/${encodeURIComponent(u)}/score`),{method:"PUT",headers:this.jsonHeaders(),body:JSON.stringify({score:t.score,comment:t.comment||""})});return this.readJson(n)}async testInterface(u){const t=await this.fetchImpl(Ee(this.apiBaseUrl,"/api/agent/interfaces/test"),{method:"POST",headers:this.jsonHeaders(),body:JSON.stringify({...u,params:u.params||{}})});return this.readJson(t)}async getAudit(u={}){const t=new URLSearchParams;u.sessionId&&t.set("sessionId",u.sessionId),u.page!==void 0&&t.set("page",String(u.page)),u.pageSize!==void 0&&t.set("pageSize",String(u.pageSize)),u.includeMessages!==void 0&&t.set("includeMessages",String(u.includeMessages)),u.includeScore!==void 0&&t.set("includeScore",String(u.includeScore)),u.includeSessions!==void 0&&t.set("includeSessions",String(u.includeSessions));const n=t.size?`?${t.toString()}`:"",r=await this.fetchImpl(Ee(this.apiBaseUrl,`/api/agent/audit${n}`),{headers:this.defaultHeaders()});return this.readJson(r)}async sendMessage(u,t,n={}){const r=this.jsonHeaders({Accept:"text/event-stream"});n.lastEventId&&(r["Last-Event-ID"]=n.lastEventId);const i=await this.fetchImpl(Ee(this.apiBaseUrl,`/api/agent/sessions/${encodeURIComponent(u)}/messages`),{method:"POST",headers:r,body:JSON.stringify({content:t}),signal:n.signal});if(!i.ok)throw await this.createApiError(i);if(!i.body)throw new Error("SSE response body is not readable");const o=i.body.getReader(),s=new TextDecoder,a=new X,l=d=>{var f;for(const m of d){const b=Lu(m);(f=n.onEvent)==null||f.call(n,b)}};try{let d=!1;for(;!d;){const{value:f,done:m}=await o.read();d=m,m||l(a.push(s.decode(f,{stream:!0})))}l([...a.push(s.decode()),...a.flush()])}finally{o.releaseLock()}}defaultHeaders(u={}){return{...this.headers,...u}}jsonHeaders(u={}){return this.defaultHeaders({"Content-Type":"application/json",...u})}async readJson(u){if(!u.ok)throw await this.createApiError(u);return u.json()}async createApiError(u){let t;try{t=await u.json()}catch{return new Mu(u.status,`${u.status} ${u.statusText}`)}const n=br(t)?t:{},r=typeof n.detail=="string"?n.detail:JSON.stringify(t),i=typeof n.retryAfter=="number"?n.retryAfter:void 0;return new Mu(u.status,r,t,i)}}function br(e){return typeof e=="object"&&e!==null}/*! @license DOMPurify 3.4.12 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.12/LICENSE */function At(e,u){(u==null||u>e.length)&&(u=e.length);for(var t=0,n=Array(u);t<u;t++)n[t]=e[t];return n}function mr(e){if(Array.isArray(e))return e}function gr(e,u){var t=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(t!=null){var n,r,i,o,s=[],a=!0,l=!1;try{if(i=(t=t.call(e)).next,u!==0)for(;!(a=(n=i.call(t)).done)&&(s.push(n.value),s.length!==u);a=!0);}catch(d){l=!0,r=d}finally{try{if(!a&&t.return!=null&&(o=t.return(),Object(o)!==o))return}finally{if(l)throw r}}return s}}function xr(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function _r(e,u){return mr(e)||gr(e,u)||yr(e,u)||xr()}function yr(e,u){if(e){if(typeof e=="string")return At(e,u);var t={}.toString.call(e).slice(8,-1);return t==="Object"&&e.constructor&&(t=e.constructor.name),t==="Map"||t==="Set"?Array.from(e):t==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?At(e,u):void 0}}const Dt=Object.entries,Ct=Object.setPrototypeOf,kr=Object.isFrozen,Er=Object.getPrototypeOf,wr=Object.getOwnPropertyDescriptor;let V=Object.freeze,Z=Object.seal,Ne=Object.create,Tt=typeof Reflect<"u"&&Reflect,zu=Tt.apply,Ou=Tt.construct;V||(V=function(u){return u}),Z||(Z=function(u){return u}),zu||(zu=function(u,t){for(var n=arguments.length,r=new Array(n>2?n-2:0),i=2;i<n;i++)r[i-2]=arguments[i];return u.apply(t,r)}),Ou||(Ou=function(u){for(var t=arguments.length,n=new Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];return new u(...n)});const Be=U(Array.prototype.forEach),Ar=U(Array.prototype.lastIndexOf),Ft=U(Array.prototype.pop),$e=U(Array.prototype.push),Dr=U(Array.prototype.splice),we=Array.isArray,Je=U(String.prototype.toLowerCase),Pu=U(String.prototype.toString),St=U(String.prototype.match),Ke=U(String.prototype.replace),vt=U(String.prototype.indexOf),Cr=U(String.prototype.trim),Tr=U(Number.prototype.toString),Fr=U(Boolean.prototype.toString),Rt=typeof BigInt>"u"?null:U(BigInt.prototype.toString),It=typeof Symbol>"u"?null:U(Symbol.prototype.toString),H=U(Object.prototype.hasOwnProperty),Qe=U(Object.prototype.toString),j=U(RegExp.prototype.test),Me=Sr(TypeError);function U(e){return function(u){u instanceof RegExp&&(u.lastIndex=0);for(var t=arguments.length,n=new Array(t>1?t-1:0),r=1;r<t;r++)n[r-1]=arguments[r];return zu(e,u,n)}}function Sr(e){return function(){for(var u=arguments.length,t=new Array(u),n=0;n<u;n++)t[n]=arguments[n];return Ou(e,t)}}function v(e,u){let t=arguments.length>2&&arguments[2]!==void 0?arguments[2]:Je;if(Ct&&Ct(e,null),!we(u))return e;let n=u.length;for(;n--;){let r=u[n];if(typeof r=="string"){const i=t(r);i!==r&&(kr(u)||(u[n]=i),r=i)}e[r]=!0}return e}function vr(e){for(let u=0;u<e.length;u++)H(e,u)||(e[u]=null);return e}function J(e){const u=Ne(null);for(const n of Dt(e)){var t=_r(n,2);const r=t[0],i=t[1];H(e,r)&&(we(i)?u[r]=vr(i):i&&typeof i=="object"&&i.constructor===Object?u[r]=J(i):u[r]=i)}return u}function Rr(e){switch(typeof e){case"string":return e;case"number":return Tr(e);case"boolean":return Fr(e);case"bigint":return Rt?Rt(e):"0";case"symbol":return It?It(e):"Symbol()";case"undefined":return Qe(e);case"function":case"object":{if(e===null)return Qe(e);const u=e,t=fe(u,"toString");if(typeof t=="function"){const n=t(u);return typeof n=="string"?n:Qe(n)}return Qe(e)}default:return Qe(e)}}function fe(e,u){for(;e!==null;){const n=wr(e,u);if(n){if(n.get)return U(n.get);if(typeof n.value=="function")return U(n.value)}e=Er(e)}function t(){return null}return t}function Ir(e){try{return j(e,""),!0}catch{return!1}}const Lt=V(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Nu=V(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),Bu=V(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),Lr=V(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),$u=V(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),Mr=V(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),Mt=V(["#text"]),zt=V(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","command","commandfor","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns"]),qu=V(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dominant-baseline","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-orientation","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Ot=V(["accent","accentunder","align","bevelled","close","columnalign","columnlines","columnspacing","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lquote","lspace","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),pu=V(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),zr=Z(/{{[\w\W]*|^[\w\W]*}}/g),Or=Z(/<%[\w\W]*|^[\w\W]*%>/g),Pr=Z(/\${[\w\W]*/g),Nr=Z(/^data-[\-\w.\u00B7-\uFFFF]+$/),Br=Z(/^aria-[\-\w]+$/),Pt=Z(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),$r=Z(/^(?:\w+script|data):/i),qr=Z(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),Ur=Z(/^html$/i),Hr=Z(/^[a-z][.\w]*(-[.\w]+)+$/i),Nt=Z(/<[/\w!]/g),Bt=Z(/<[/\w]/g),jr=Z(/<\/no(script|embed|frames)/i),Wr=Z(/\/>/i),ne={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,processingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},Gr=function(){return typeof window>"u"?null:window},Vr=function(u,t){if(typeof u!="object"||typeof u.createPolicy!="function")return null;let n=null;const r="data-tt-policy-suffix";t&&t.hasAttribute(r)&&(n=t.getAttribute(r));const i="dompurify"+(n?"#"+n:"");try{return u.createPolicy(i,{createHTML(o){return o},createScriptURL(o){return o}})}catch{return console.warn("TrustedTypes policy "+i+" could not be created."),null}},$t=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},Ae=function(u,t,n,r){return H(u,t)&&we(u[t])?v(r.base?J(r.base):{},u[t],r.transform):n};function qt(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:Gr();const u=x=>qt(x);if(u.version="3.4.12",u.removed=[],!e||!e.document||e.document.nodeType!==ne.document||!e.Element)return u.isSupported=!1,u;let t=e.document;const n=t,r=n.currentScript;e.DocumentFragment;const i=e.HTMLTemplateElement,o=e.Node,s=e.Element,a=e.NodeFilter,l=e.NamedNodeMap;l===void 0&&(e.NamedNodeMap||e.MozNamedAttrMap),e.HTMLFormElement;const d=e.DOMParser,f=e.trustedTypes,m=s.prototype,b=fe(m,"cloneNode"),p=fe(m,"remove"),k=fe(m,"nextSibling"),w=fe(m,"childNodes"),C=fe(m,"parentNode"),y=fe(m,"shadowRoot"),D=fe(m,"attributes"),_=o&&o.prototype?fe(o.prototype,"nodeType"):null,A=o&&o.prototype?fe(o.prototype,"nodeName"):null;if(typeof i=="function"){const x=t.createElement("template");x.content&&x.content.ownerDocument&&(t=x.content.ownerDocument)}let F,R="",K,se=!1,ae=0;const We=function(){if(ae>0)throw Me('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.')},Se=function(c){We(),ae++;try{return F.createHTML(c)}finally{ae--}},it=function(c){We(),ae++;try{return F.createScriptURL(c)}finally{ae--}},Au=function(){return se||(K=Vr(f,r),se=!0),K},ce=t,lu=ce.implementation,Un=ce.createNodeIterator,jo=ce.createDocumentFragment,Wo=ce.getElementsByTagName,Go=n.importNode;let O=$t();u.isSupported=typeof Dt=="function"&&typeof C=="function"&&lu&&lu.createHTMLDocument!==void 0;const Vo=zr,Zo=Or,Yo=Pr,Xo=Nr,Jo=Br,Ko=$r,Hn=qr,Qo=Hr;let jn=Pt,P=null;const Wn=v({},[...Lt,...Nu,...Bu,...$u,...Mt]);let N=null;const Gn=v({},[...zt,...qu,...Ot,...pu]);let B=Object.seal(Ne(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),du=null,Vn=null;const ve=Object.seal(Ne(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}}));let Zn=!0,ot=!0,Yn=!1,Xn=!0,Re=!1,Ie=!0,Oe=!1,st=!1,at=null,ct=null,lt=!1,Ge=!1,Du=!1,Cu=!1,Jn=!0,Kn=!1;const Qn="user-content-";let dt=!0,ft=!1,Ve={},ge=null;const ht=v({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","selectedcontent","style","svg","template","thead","title","video","xmp"]);let er=null;const ur=v({},["audio","video","img","source","image","track"]);let pt=null;const tr=v({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),Tu="http://www.w3.org/1998/Math/MathML",Fu="http://www.w3.org/2000/svg",xe="http://www.w3.org/1999/xhtml";let Ze=xe,bt=!1,mt=null;const es=v({},[Tu,Fu,xe],Pu),nr=V(["mi","mo","mn","ms","mtext"]);let gt=v({},nr);const rr=V(["annotation-xml"]);let xt=v({},rr);const us=v({},["title","style","font","a","script"]);let fu=null;const ts=["application/xhtml+xml","text/html"],ns="text/html";let z=null,Ye=null;const rs=t.createElement("form"),ir=function(c){return c instanceof RegExp||c instanceof Function},_t=function(){let c=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(Ye&&Ye===c)return;(!c||typeof c!="object")&&(c={}),c=J(c),fu=ts.indexOf(c.PARSER_MEDIA_TYPE)===-1?ns:c.PARSER_MEDIA_TYPE,z=fu==="application/xhtml+xml"?Pu:Je,P=Ae(c,"ALLOWED_TAGS",Wn,{transform:z}),N=Ae(c,"ALLOWED_ATTR",Gn,{transform:z}),mt=Ae(c,"ALLOWED_NAMESPACES",es,{transform:Pu}),pt=Ae(c,"ADD_URI_SAFE_ATTR",tr,{transform:z,base:tr}),er=Ae(c,"ADD_DATA_URI_TAGS",ur,{transform:z,base:ur}),ge=Ae(c,"FORBID_CONTENTS",ht,{transform:z}),du=Ae(c,"FORBID_TAGS",J({}),{transform:z}),Vn=Ae(c,"FORBID_ATTR",J({}),{transform:z}),Ve=H(c,"USE_PROFILES")?c.USE_PROFILES&&typeof c.USE_PROFILES=="object"?J(c.USE_PROFILES):c.USE_PROFILES:!1,Zn=c.ALLOW_ARIA_ATTR!==!1,ot=c.ALLOW_DATA_ATTR!==!1,Yn=c.ALLOW_UNKNOWN_PROTOCOLS||!1,Xn=c.ALLOW_SELF_CLOSE_IN_ATTR!==!1,Re=c.SAFE_FOR_TEMPLATES||!1,Ie=c.SAFE_FOR_XML!==!1,Oe=c.WHOLE_DOCUMENT||!1,Ge=c.RETURN_DOM||!1,Du=c.RETURN_DOM_FRAGMENT||!1,Cu=c.RETURN_TRUSTED_TYPE||!1,lt=c.FORCE_BODY||!1,Jn=c.SANITIZE_DOM!==!1,Kn=c.SANITIZE_NAMED_PROPS||!1,dt=c.KEEP_CONTENT!==!1,ft=c.IN_PLACE||!1,jn=Ir(c.ALLOWED_URI_REGEXP)?c.ALLOWED_URI_REGEXP:Pt,Ze=typeof c.NAMESPACE=="string"?c.NAMESPACE:xe,gt=H(c,"MATHML_TEXT_INTEGRATION_POINTS")&&c.MATHML_TEXT_INTEGRATION_POINTS&&typeof c.MATHML_TEXT_INTEGRATION_POINTS=="object"?J(c.MATHML_TEXT_INTEGRATION_POINTS):v({},nr),xt=H(c,"HTML_INTEGRATION_POINTS")&&c.HTML_INTEGRATION_POINTS&&typeof c.HTML_INTEGRATION_POINTS=="object"?J(c.HTML_INTEGRATION_POINTS):v({},rr);const h=H(c,"CUSTOM_ELEMENT_HANDLING")&&c.CUSTOM_ELEMENT_HANDLING&&typeof c.CUSTOM_ELEMENT_HANDLING=="object"?J(c.CUSTOM_ELEMENT_HANDLING):Ne(null);if(B=Ne(null),H(h,"tagNameCheck")&&ir(h.tagNameCheck)&&(B.tagNameCheck=h.tagNameCheck),H(h,"attributeNameCheck")&&ir(h.attributeNameCheck)&&(B.attributeNameCheck=h.attributeNameCheck),H(h,"allowCustomizedBuiltInElements")&&typeof h.allowCustomizedBuiltInElements=="boolean"&&(B.allowCustomizedBuiltInElements=h.allowCustomizedBuiltInElements),Z(B),Re&&(ot=!1),Du&&(Ge=!0),Ve&&(P=v({},Mt),N=Ne(null),Ve.html===!0&&(v(P,Lt),v(N,zt)),Ve.svg===!0&&(v(P,Nu),v(N,qu),v(N,pu)),Ve.svgFilters===!0&&(v(P,Bu),v(N,qu),v(N,pu)),Ve.mathMl===!0&&(v(P,$u),v(N,Ot),v(N,pu))),ve.tagCheck=null,ve.attributeCheck=null,H(c,"ADD_TAGS")&&(typeof c.ADD_TAGS=="function"?ve.tagCheck=c.ADD_TAGS:we(c.ADD_TAGS)&&(P===Wn&&(P=J(P)),v(P,c.ADD_TAGS,z))),H(c,"ADD_ATTR")&&(typeof c.ADD_ATTR=="function"?ve.attributeCheck=c.ADD_ATTR:we(c.ADD_ATTR)&&(N===Gn&&(N=J(N)),v(N,c.ADD_ATTR,z))),H(c,"ADD_URI_SAFE_ATTR")&&we(c.ADD_URI_SAFE_ATTR)&&v(pt,c.ADD_URI_SAFE_ATTR,z),H(c,"FORBID_CONTENTS")&&we(c.FORBID_CONTENTS)&&(ge===ht&&(ge=J(ge)),v(ge,c.FORBID_CONTENTS,z)),H(c,"ADD_FORBID_CONTENTS")&&we(c.ADD_FORBID_CONTENTS)&&(ge===ht&&(ge=J(ge)),v(ge,c.ADD_FORBID_CONTENTS,z)),dt&&(P["#text"]=!0),Oe&&v(P,["html","head","body"]),P.table&&(v(P,["tbody"]),delete du.tbody),c.TRUSTED_TYPES_POLICY){if(typeof c.TRUSTED_TYPES_POLICY.createHTML!="function")throw Me('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof c.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw Me('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');const g=F;F=c.TRUSTED_TYPES_POLICY;try{R=Se("")}catch(E){throw F=g,E}}else c.TRUSTED_TYPES_POLICY===null?(F=void 0,R=""):(F===void 0&&(F=Au()),F&&typeof R=="string"&&(R=Se("")));V&&V(c),Ye=c},or=v({},[...Nu,...Bu,...Lr]),sr=v({},[...$u,...Mr]),is=function(c,h,g){return h.namespaceURI===xe?c==="svg":h.namespaceURI===Tu?c==="svg"&&(g==="annotation-xml"||gt[g]):!!or[c]},os=function(c,h,g){return h.namespaceURI===xe?c==="math":h.namespaceURI===Fu?c==="math"&&xt[g]:!!sr[c]},ss=function(c,h,g){return h.namespaceURI===Fu&&!xt[g]||h.namespaceURI===Tu&&!gt[g]?!1:!sr[c]&&(us[c]||!or[c])},as=function(c){let h=C(c);(!h||!h.tagName)&&(h={namespaceURI:Ze,tagName:"template"});const g=Je(c.tagName),E=Je(h.tagName);return mt[c.namespaceURI]?c.namespaceURI===Fu?is(g,h,E):c.namespaceURI===Tu?os(g,h,E):c.namespaceURI===xe?ss(g,h,E):!!(fu==="application/xhtml+xml"&&mt[c.namespaceURI]):!1},Le=function(c){$e(u.removed,{element:c});try{C(c).removeChild(c)}catch{if(p(c),!C(c))throw Me("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place")}},Su=function(c){yt(c);const h=w(c);if(h){const E=[];Be(h,T=>{$e(E,T)}),Be(E,T=>{try{p(T)}catch{}})}const g=D(c);if(g)for(let E=g.length-1;E>=0;--E){const T=g[E],S=T&&T.name;if(typeof S=="string")try{c.removeAttribute(S)}catch{}}},Pe=function(c,h){try{$e(u.removed,{attribute:h.getAttributeNode(c),from:h})}catch{$e(u.removed,{attribute:null,from:h})}if(h.removeAttribute(c),c==="is")if(Ge||Du)try{Le(h)}catch{}else try{h.setAttribute(c,"")}catch{}},cs=function(c){const h=D(c);if(h)for(let g=h.length-1;g>=0;--g){const E=h[g],T=E&&E.name;if(!(typeof T!="string"||N[z(T)]))try{c.removeAttribute(T)}catch{}}},yt=function(c){const h=[c];for(;h.length>0;){const g=h.pop();(_?_(g):g.nodeType)===ne.element&&cs(g);const T=w(g);if(T)for(let S=T.length-1;S>=0;--S)h.push(T[S])}},ls=function(c){if(!Ie)return;const h=[c];for(;h.length>0;){const g=h.pop(),E=_?_(g):g.nodeType;if(E===ne.processingInstruction||E===ne.comment&&j(Bt,g.data)){try{p(g)}catch{}continue}if(E===ne.element){const S=g,$=z(A?A(g):g.nodeName);try{S.hasAttribute&&S.hasAttribute("patchsrc")&&S.removeAttribute("patchsrc"),S.hasAttribute&&S.hasAttribute("for")&&$!=="label"&&$!=="output"&&S.removeAttribute("for")}catch{}}const T=w(g);if(T)for(let S=T.length-1;S>=0;--S)h.push(T[S])}},ar=function(c){let h=null,g=null;if(lt)c="<remove></remove>"+c;else{const S=St(c,/^[\r\n\t ]+/);g=S&&S[0]}fu==="application/xhtml+xml"&&Ze===xe&&(c='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+c+"</body></html>");const E=F?Se(c):c;if(Ze===xe)try{h=new d().parseFromString(E,fu)}catch{}if(!h||!h.documentElement){h=lu.createDocument(Ze,"template",null);try{h.documentElement.innerHTML=bt?R:E}catch{}}const T=h.body||h.documentElement;return c&&g&&T.insertBefore(t.createTextNode(g),T.childNodes[0]||null),Ze===xe?Wo.call(h,Oe?"html":"body")[0]:Oe?h.documentElement:T},cr=function(c){return Un.call(c.ownerDocument||c,c,a.SHOW_ELEMENT|a.SHOW_COMMENT|a.SHOW_TEXT|a.SHOW_PROCESSING_INSTRUCTION|a.SHOW_CDATA_SECTION,null)},vu=function(c){return c=Ke(c,Vo," "),c=Ke(c,Zo," "),c=Ke(c,Yo," "),c},kt=function(c){var h;c.normalize();const g=Un.call(c.ownerDocument||c,c,a.SHOW_TEXT|a.SHOW_COMMENT|a.SHOW_CDATA_SECTION|a.SHOW_PROCESSING_INSTRUCTION,null);let E=g.nextNode();for(;E;)E.data=vu(E.data),E=g.nextNode();const T=(h=c.querySelectorAll)===null||h===void 0?void 0:h.call(c,"template");T&&Be(T,S=>{Xe(S.content)&&kt(S.content)})},Ru=function(c){const h=A?A(c):null;return typeof h!="string"||z(h)!=="form"?!1:typeof c.nodeName!="string"||typeof c.textContent!="string"||typeof c.removeChild!="function"||c.attributes!==D(c)||typeof c.removeAttribute!="function"||typeof c.setAttribute!="function"||typeof c.namespaceURI!="string"||typeof c.insertBefore!="function"||typeof c.hasChildNodes!="function"||c.nodeType!==_(c)||c.childNodes!==w(c)},Xe=function(c){if(!_||typeof c!="object"||c===null)return!1;try{return _(c)===ne.documentFragment}catch{return!1}},hu=function(c){if(!_||typeof c!="object"||c===null)return!1;try{return typeof _(c)=="number"}catch{return!1}};function _e(x,c,h){x.length!==0&&Be(x,g=>{g.call(u,c,h,Ye)})}const ds=function(c,h){return!!(Ie&&c.hasChildNodes()&&!hu(c.firstElementChild)&&j(Nt,c.textContent)&&j(Nt,c.innerHTML)||Ie&&c.namespaceURI===xe&&h==="style"&&hu(c.firstElementChild)||c.nodeType===ne.processingInstruction||Ie&&c.nodeType===ne.comment&&j(Bt,c.data))},fs=function(c,h){if(!du[h]&&fr(h)&&(B.tagNameCheck instanceof RegExp&&j(B.tagNameCheck,h)||B.tagNameCheck instanceof Function&&B.tagNameCheck(h)))return!1;if(dt&&!ge[h]){const g=C(c),E=w(c);if(E&&g){const T=E.length;for(let S=T-1;S>=0;--S){const $=ft?E[S]:b(E[S],!0);g.insertBefore($,k(c))}}}return Le(c),!0},lr=function(c,h){if(_e(O.beforeSanitizeElements,c,null),c!==h&&C(c)===null)return!0;if(Ru(c))return Le(c),!0;const g=z(A?A(c):c.nodeName);if(_e(O.uponSanitizeElement,c,{tagName:g,allowedTags:P}),c!==h&&C(c)===null)return!0;if(ds(c,g))return Le(c),!0;if(du[g]||!(ve.tagCheck instanceof Function&&ve.tagCheck(g))&&!P[g]){const T=fs(c,g);return T===!1&&_e(O.afterSanitizeElements,c,null),T}if((_?_(c):c.nodeType)===ne.element&&!as(c)||(g==="noscript"||g==="noembed"||g==="noframes")&&j(jr,c.innerHTML))return Le(c),!0;if(Re&&c.nodeType===ne.text){const T=vu(c.textContent);c.textContent!==T&&($e(u.removed,{element:c.cloneNode()}),c.textContent=T)}return _e(O.afterSanitizeElements,c,null),!1},dr=function(c,h,g){if(Vn[h]||Ie&&h==="patchsrc"||Ie&&h==="for"&&c!=="label"&&c!=="output"||Jn&&(h==="id"||h==="name")&&(g in t||g in rs))return!1;const E=N[h]||ve.attributeCheck instanceof Function&&ve.attributeCheck(h,c);if(!(ot&&j(Xo,h))){if(!(Zn&&j(Jo,h))){if(E){if(!pt[h]){if(!j(jn,Ke(g,Hn,""))){if(!((h==="src"||h==="xlink:href"||h==="href")&&c!=="script"&&vt(g,"data:")===0&&er[c])){if(!(Yn&&!j(Ko,Ke(g,Hn,"")))){if(g)return!1}}}}}else if(!(fr(c)&&(B.tagNameCheck instanceof RegExp&&j(B.tagNameCheck,c)||B.tagNameCheck instanceof Function&&B.tagNameCheck(c))&&(B.attributeNameCheck instanceof RegExp&&j(B.attributeNameCheck,h)||B.attributeNameCheck instanceof Function&&B.attributeNameCheck(h,c))||h==="is"&&B.allowCustomizedBuiltInElements&&(B.tagNameCheck instanceof RegExp&&j(B.tagNameCheck,g)||B.tagNameCheck instanceof Function&&B.tagNameCheck(g))))return!1}}return!0},hs=v({},["annotation-xml","color-profile","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","missing-glyph"]),fr=function(c){return!hs[Je(c)]&&j(Qo,c)},ps=function(c,h,g,E){if(F&&typeof f=="object"&&typeof f.getAttributeType=="function"&&!g)switch(f.getAttributeType(c,h)){case"TrustedHTML":return Se(E);case"TrustedScriptURL":return it(E)}return E},bs=function(c,h,g,E){try{g?c.setAttributeNS(g,h,E):c.setAttribute(h,E),Ru(c)?Le(c):Ft(u.removed)}catch{Pe(h,c)}},hr=function(c){_e(O.beforeSanitizeAttributes,c,null);const h=c.attributes;if(!h||Ru(c))return;const g={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:N,forceKeepAttr:void 0};let E=h.length;const T=z(c.nodeName);for(;E--;){const S=h[E],$=S.name,Y=S.namespaceURI,le=S.value,te=z($),de=le;let Q=$==="value"?de:Cr(de);if(g.attrName=te,g.attrValue=Q,g.keepAttr=!0,g.forceKeepAttr=void 0,_e(O.uponSanitizeAttribute,c,g),Q=g.attrValue,Kn&&(te==="id"||te==="name")&&vt(Q,Qn)!==0&&(Pe($,c),Q=Qn+Q),Ie&&j(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,Q)){Pe($,c);continue}if(te==="attributename"&&St(Q,"href")){Pe($,c);continue}if(!g.forceKeepAttr){if(!g.keepAttr){Pe($,c);continue}if(!Xn&&j(Wr,Q)){Pe($,c);continue}if(Re&&(Q=vu(Q)),!dr(T,te,Q)){Pe($,c);continue}Q=ps(T,te,Y,Q),Q!==de&&bs(c,$,Y,Q)}}_e(O.afterSanitizeAttributes,c,null)},Iu=function(c){let h=null;const g=cr(c);for(_e(O.beforeSanitizeShadowDOM,c,null);h=g.nextNode();)if(_e(O.uponSanitizeShadowNode,h,null),lr(h,c),hr(h),Xe(h.content)&&Iu(h.content),(_?_(h):h.nodeType)===ne.element){const T=y(h);Xe(T)&&(Et(T),Iu(T))}_e(O.afterSanitizeShadowDOM,c,null)},Et=function(c){const h=[{node:c,shadow:null}];for(;h.length>0;){const g=h.pop();if(g.shadow){Iu(g.shadow);continue}const E=g.node,S=(_?_(E):E.nodeType)===ne.element,$=w(E);if($)for(let Y=$.length-1;Y>=0;--Y)h.push({node:$[Y],shadow:null});if(S){const Y=A?A(E):null;if(typeof Y=="string"&&z(Y)==="template"){const le=E.content;Xe(le)&&h.push({node:le,shadow:null})}}if(S){const Y=y(E);Xe(Y)&&h.push({node:null,shadow:Y},{node:Y,shadow:null})}}};return u.sanitize=function(x){let c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},h=null,g=null,E=null,T=null;if(bt=!x,bt&&(x="<!-->"),typeof x!="string"&&!hu(x)&&(x=Rr(x),typeof x!="string"))throw Me("dirty is not a string, aborting");if(!u.isSupported)return x;st?(P=at,N=ct):_t(c),(O.uponSanitizeElement.length>0||O.uponSanitizeAttribute.length>0)&&(P=J(P)),O.uponSanitizeAttribute.length>0&&(N=J(N)),u.removed=[];const S=ft&&typeof x!="string"&&hu(x);if(S){ls(x);const te=A?A(x):x.nodeName;if(typeof te=="string"){const de=z(te);if(!P[de]||du[de])throw Su(x),Me("root node is forbidden and cannot be sanitized in-place")}if(Ru(x))throw Su(x),Me("root node is clobbered and cannot be sanitized in-place");try{Et(x)}catch(de){throw Su(x),de}}else if(hu(x))h=ar("<!---->"),g=h.ownerDocument.importNode(x,!0),g.nodeType===ne.element&&g.nodeName==="BODY"||g.nodeName==="HTML"?h=g:h.appendChild(g),Et(g);else{if(!Ge&&!Re&&!Oe&&x.indexOf("<")===-1)return F&&Cu?Se(x):x;if(h=ar(x),!h)return Ge?null:Cu?R:""}h&&lt&&Le(h.firstChild);const $=S?x:h,Y=cr($);try{for(;E=Y.nextNode();)lr(E,$),hr(E),Xe(E.content)&&Iu(E.content)}catch(te){throw S&&(Su(x),Be(u.removed,de=>{de.element&&yt(de.element)})),te}if(S)return Be(u.removed,te=>{te.element&&yt(te.element)}),Re&&kt(x),x;if(Ge){if(Re&&kt(h),Du)for(T=jo.call(h.ownerDocument);h.firstChild;)T.appendChild(h.firstChild);else T=h;return(N.shadowroot||N.shadowrootmode)&&(T=Go.call(n,T,!0)),T}let le=Oe?h.outerHTML:h.innerHTML;return Oe&&P["!doctype"]&&h.ownerDocument&&h.ownerDocument.doctype&&h.ownerDocument.doctype.name&&j(Ur,h.ownerDocument.doctype.name)&&(le="<!DOCTYPE "+h.ownerDocument.doctype.name+`>
`+le),Re&&(le=vu(le)),F&&Cu?Se(le):le},u.setConfig=function(){let x=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};_t(x),st=!0,at=P,ct=N},u.clearConfig=function(){Ye=null,st=!1,at=null,ct=null,F=K,R=""},u.isValidAttribute=function(x,c,h){Ye||_t({});const g=z(x),E=z(c);return dr(g,E,h)},u.addHook=function(x,c){typeof c=="function"&&H(O,x)&&$e(O[x],c)},u.removeHook=function(x,c){if(H(O,x)){if(c!==void 0){const h=Ar(O[x],c);return h===-1?void 0:Dr(O[x],h,1)[0]}return Ft(O[x])}},u.removeHooks=function(x){H(O,x)&&(O[x]=[])},u.removeAllHooks=function(){O=$t()},u}var Zr=qt();const Ut={};function Yr(e){let u=Ut[e];if(u)return u;u=Ut[e]=[];for(let t=0;t<128;t++){const n=String.fromCharCode(t);u.push(n)}for(let t=0;t<e.length;t++){const n=e.charCodeAt(t);u[n]="%"+("0"+n.toString(16).toUpperCase()).slice(-2)}return u}function qe(e,u){typeof u!="string"&&(u=qe.defaultChars);const t=Yr(u);return e.replace(/(%[a-f0-9]{2})+/gi,function(n){let r="";for(let i=0,o=n.length;i<o;i+=3){const s=parseInt(n.slice(i+1,i+3),16);if(s<128){r+=t[s];continue}if((s&224)===192&&i+3<o){const a=parseInt(n.slice(i+4,i+6),16);if((a&192)===128){const l=s<<6&1984|a&63;l<128?r+="��":r+=String.fromCharCode(l),i+=3;continue}}if((s&240)===224&&i+6<o){const a=parseInt(n.slice(i+4,i+6),16),l=parseInt(n.slice(i+7,i+9),16);if((a&192)===128&&(l&192)===128){const d=s<<12&61440|a<<6&4032|l&63;d<2048||d>=55296&&d<=57343?r+="���":r+=String.fromCharCode(d),i+=6;continue}}if((s&248)===240&&i+9<o){const a=parseInt(n.slice(i+4,i+6),16),l=parseInt(n.slice(i+7,i+9),16),d=parseInt(n.slice(i+10,i+12),16);if((a&192)===128&&(l&192)===128&&(d&192)===128){let f=s<<18&1835008|a<<12&258048|l<<6&4032|d&63;f<65536||f>1114111?r+="����":(f-=65536,r+=String.fromCharCode(55296+(f>>10),56320+(f&1023))),i+=9;continue}}r+="�"}return r})}qe.defaultChars=";/?:@&=+$,#",qe.componentChars="";const Ht={};function Xr(e){let u=Ht[e];if(u)return u;u=Ht[e]=[];for(let t=0;t<128;t++){const n=String.fromCharCode(t);/^[0-9a-z]$/i.test(n)?u.push(n):u.push("%"+("0"+t.toString(16).toUpperCase()).slice(-2))}for(let t=0;t<e.length;t++)u[e.charCodeAt(t)]=e[t];return u}function eu(e,u,t){typeof u!="string"&&(t=u,u=eu.defaultChars),typeof t>"u"&&(t=!0);const n=Xr(u);let r="";for(let i=0,o=e.length;i<o;i++){const s=e.charCodeAt(i);if(t&&s===37&&i+2<o&&/^[0-9a-f]{2}$/i.test(e.slice(i+1,i+3))){r+=e.slice(i,i+3),i+=2;continue}if(s<128){r+=n[s];continue}if(s>=55296&&s<=57343){if(s>=55296&&s<=56319&&i+1<o){const a=e.charCodeAt(i+1);if(a>=56320&&a<=57343){r+=encodeURIComponent(e[i]+e[i+1]),i++;continue}}r+="%EF%BF%BD";continue}r+=encodeURIComponent(e[i])}return r}eu.defaultChars=";/?:@&=+$,-_.!~*'()#",eu.componentChars="-_.!~*'()";function Uu(e){let u="";return u+=e.protocol||"",u+=e.slashes?"//":"",u+=e.auth?e.auth+"@":"",e.hostname&&e.hostname.indexOf(":")!==-1?u+="["+e.hostname+"]":u+=e.hostname||"",u+=e.port?":"+e.port:"",u+=e.pathname||"",u+=e.search||"",u+=e.hash||"",u}function bu(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}const Jr=/^([a-z0-9.+-]+:)/i,Kr=/:[0-9]*$/,Qr=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,e0=["<",">",'"',"`"," ","\r",`
`,"	"],u0=["{","}","|","\\","^","`"].concat(e0),t0=["'"].concat(u0),jt=["%","/","?",";","#"].concat(t0),Wt=["/","?","#"],n0=255,Gt=/^[+a-z0-9A-Z_-]{0,63}$/,r0=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,Vt={javascript:!0,"javascript:":!0},Zt={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function Hu(e,u){if(e&&e instanceof bu)return e;const t=new bu;return t.parse(e,u),t}bu.prototype.parse=function(e,u){let t,n,r,i=e;if(i=i.trim(),!u&&e.split("#").length===1){const l=Qr.exec(i);if(l)return this.pathname=l[1],l[2]&&(this.search=l[2]),this}let o=Jr.exec(i);if(o&&(o=o[0],t=o.toLowerCase(),this.protocol=o,i=i.substr(o.length)),(u||o||i.match(/^\/\/[^@\/]+@[^@\/]+/))&&(r=i.substr(0,2)==="//",r&&!(o&&Vt[o])&&(i=i.substr(2),this.slashes=!0)),!Vt[o]&&(r||o&&!Zt[o])){let l=-1;for(let p=0;p<Wt.length;p++)n=i.indexOf(Wt[p]),n!==-1&&(l===-1||n<l)&&(l=n);let d,f;l===-1?f=i.lastIndexOf("@"):f=i.lastIndexOf("@",l),f!==-1&&(d=i.slice(0,f),i=i.slice(f+1),this.auth=d),l=-1;for(let p=0;p<jt.length;p++)n=i.indexOf(jt[p]),n!==-1&&(l===-1||n<l)&&(l=n);l===-1&&(l=i.length),i[l-1]===":"&&l--;const m=i.slice(0,l);i=i.slice(l),this.parseHost(m),this.hostname=this.hostname||"";const b=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!b){const p=this.hostname.split(/\./);for(let k=0,w=p.length;k<w;k++){const C=p[k];if(C&&!C.match(Gt)){let y="";for(let D=0,_=C.length;D<_;D++)C.charCodeAt(D)>127?y+="x":y+=C[D];if(!y.match(Gt)){const D=p.slice(0,k),_=p.slice(k+1),A=C.match(r0);A&&(D.push(A[1]),_.unshift(A[2])),_.length&&(i=_.join(".")+i),this.hostname=D.join(".");break}}}}this.hostname.length>n0&&(this.hostname=""),b&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}const s=i.indexOf("#");s!==-1&&(this.hash=i.substr(s),i=i.slice(0,s));const a=i.indexOf("?");return a!==-1&&(this.search=i.substr(a),i=i.slice(0,a)),i&&(this.pathname=i),Zt[t]&&this.hostname&&!this.pathname&&(this.pathname=""),this},bu.prototype.parseHost=function(e){let u=Kr.exec(e);u&&(u=u[0],u!==":"&&(this.port=u.substr(1)),e=e.substr(0,e.length-u.length)),e&&(this.hostname=e)};const i0=Object.freeze(Object.defineProperty({__proto__:null,decode:qe,encode:eu,format:Uu,parse:Hu},Symbol.toStringTag,{value:"Module"})),Yt=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,Xt=/[\0-\x1F\x7F-\x9F]/,o0=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/,ju=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/,Jt=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/,Kt=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/,s0=Object.freeze(Object.defineProperty({__proto__:null,Any:Yt,Cc:Xt,Cf:o0,P:ju,S:Jt,Z:Kt},Symbol.toStringTag,{value:"Module"})),a0=new Uint16Array('ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻 ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌'.split("").map(e=>e.charCodeAt(0))),c0=new Uint16Array("Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢".split("").map(e=>e.charCodeAt(0)));var Wu;const l0=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),d0=(Wu=String.fromCodePoint)!==null&&Wu!==void 0?Wu:function(e){let u="";return e>65535&&(e-=65536,u+=String.fromCharCode(e>>>10&1023|55296),e=56320|e&1023),u+=String.fromCharCode(e),u};function f0(e){var u;return e>=55296&&e<=57343||e>1114111?65533:(u=l0.get(e))!==null&&u!==void 0?u:e}var W;(function(e){e[e.NUM=35]="NUM",e[e.SEMI=59]="SEMI",e[e.EQUALS=61]="EQUALS",e[e.ZERO=48]="ZERO",e[e.NINE=57]="NINE",e[e.LOWER_A=97]="LOWER_A",e[e.LOWER_F=102]="LOWER_F",e[e.LOWER_X=120]="LOWER_X",e[e.LOWER_Z=122]="LOWER_Z",e[e.UPPER_A=65]="UPPER_A",e[e.UPPER_F=70]="UPPER_F",e[e.UPPER_Z=90]="UPPER_Z"})(W||(W={}));const h0=32;var De;(function(e){e[e.VALUE_LENGTH=49152]="VALUE_LENGTH",e[e.BRANCH_LENGTH=16256]="BRANCH_LENGTH",e[e.JUMP_TABLE=127]="JUMP_TABLE"})(De||(De={}));function Gu(e){return e>=W.ZERO&&e<=W.NINE}function p0(e){return e>=W.UPPER_A&&e<=W.UPPER_F||e>=W.LOWER_A&&e<=W.LOWER_F}function b0(e){return e>=W.UPPER_A&&e<=W.UPPER_Z||e>=W.LOWER_A&&e<=W.LOWER_Z||Gu(e)}function m0(e){return e===W.EQUALS||b0(e)}var G;(function(e){e[e.EntityStart=0]="EntityStart",e[e.NumericStart=1]="NumericStart",e[e.NumericDecimal=2]="NumericDecimal",e[e.NumericHex=3]="NumericHex",e[e.NamedEntity=4]="NamedEntity"})(G||(G={}));var ye;(function(e){e[e.Legacy=0]="Legacy",e[e.Strict=1]="Strict",e[e.Attribute=2]="Attribute"})(ye||(ye={}));class g0{constructor(u,t,n){this.decodeTree=u,this.emitCodePoint=t,this.errors=n,this.state=G.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=ye.Strict}startEntity(u){this.decodeMode=u,this.state=G.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(u,t){switch(this.state){case G.EntityStart:return u.charCodeAt(t)===W.NUM?(this.state=G.NumericStart,this.consumed+=1,this.stateNumericStart(u,t+1)):(this.state=G.NamedEntity,this.stateNamedEntity(u,t));case G.NumericStart:return this.stateNumericStart(u,t);case G.NumericDecimal:return this.stateNumericDecimal(u,t);case G.NumericHex:return this.stateNumericHex(u,t);case G.NamedEntity:return this.stateNamedEntity(u,t)}}stateNumericStart(u,t){return t>=u.length?-1:(u.charCodeAt(t)|h0)===W.LOWER_X?(this.state=G.NumericHex,this.consumed+=1,this.stateNumericHex(u,t+1)):(this.state=G.NumericDecimal,this.stateNumericDecimal(u,t))}addToNumericResult(u,t,n,r){if(t!==n){const i=n-t;this.result=this.result*Math.pow(r,i)+parseInt(u.substr(t,i),r),this.consumed+=i}}stateNumericHex(u,t){const n=t;for(;t<u.length;){const r=u.charCodeAt(t);if(Gu(r)||p0(r))t+=1;else return this.addToNumericResult(u,n,t,16),this.emitNumericEntity(r,3)}return this.addToNumericResult(u,n,t,16),-1}stateNumericDecimal(u,t){const n=t;for(;t<u.length;){const r=u.charCodeAt(t);if(Gu(r))t+=1;else return this.addToNumericResult(u,n,t,10),this.emitNumericEntity(r,2)}return this.addToNumericResult(u,n,t,10),-1}emitNumericEntity(u,t){var n;if(this.consumed<=t)return(n=this.errors)===null||n===void 0||n.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(u===W.SEMI)this.consumed+=1;else if(this.decodeMode===ye.Strict)return 0;return this.emitCodePoint(f0(this.result),this.consumed),this.errors&&(u!==W.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(u,t){const{decodeTree:n}=this;let r=n[this.treeIndex],i=(r&De.VALUE_LENGTH)>>14;for(;t<u.length;t++,this.excess++){const o=u.charCodeAt(t);if(this.treeIndex=x0(n,r,this.treeIndex+Math.max(1,i),o),this.treeIndex<0)return this.result===0||this.decodeMode===ye.Attribute&&(i===0||m0(o))?0:this.emitNotTerminatedNamedEntity();if(r=n[this.treeIndex],i=(r&De.VALUE_LENGTH)>>14,i!==0){if(o===W.SEMI)return this.emitNamedEntityData(this.treeIndex,i,this.consumed+this.excess);this.decodeMode!==ye.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var u;const{result:t,decodeTree:n}=this,r=(n[t]&De.VALUE_LENGTH)>>14;return this.emitNamedEntityData(t,r,this.consumed),(u=this.errors)===null||u===void 0||u.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(u,t,n){const{decodeTree:r}=this;return this.emitCodePoint(t===1?r[u]&~De.VALUE_LENGTH:r[u+1],n),t===3&&this.emitCodePoint(r[u+2],n),n}end(){var u;switch(this.state){case G.NamedEntity:return this.result!==0&&(this.decodeMode!==ye.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case G.NumericDecimal:return this.emitNumericEntity(0,2);case G.NumericHex:return this.emitNumericEntity(0,3);case G.NumericStart:return(u=this.errors)===null||u===void 0||u.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case G.EntityStart:return 0}}}function Qt(e){let u="";const t=new g0(e,n=>u+=d0(n));return function(r,i){let o=0,s=0;for(;(s=r.indexOf("&",s))>=0;){u+=r.slice(o,s),t.startEntity(i);const l=t.write(r,s+1);if(l<0){o=s+t.end();break}o=s+l,s=l===0?o+1:o}const a=u+r.slice(o);return u="",a}}function x0(e,u,t,n){const r=(u&De.BRANCH_LENGTH)>>7,i=u&De.JUMP_TABLE;if(r===0)return i!==0&&n===i?t:-1;if(i){const a=n-i;return a<0||a>=r?-1:e[t+a]-1}let o=t,s=o+r-1;for(;o<=s;){const a=o+s>>>1,l=e[a];if(l<n)o=a+1;else if(l>n)s=a-1;else return e[a+r]}return-1}const en=Qt(a0);Qt(c0);function _0(e,u=ye.Legacy){return en(e,u)}function y0(e){return en(e,ye.Strict)}function k0(e){return Object.prototype.toString.call(e)}function Vu(e){return k0(e)==="[object String]"}const E0=Object.prototype.hasOwnProperty;function w0(e,u){return E0.call(e,u)}function mu(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){if(t){if(typeof t!="object")throw new TypeError(t+"must be object");Object.keys(t).forEach(function(n){e[n]=t[n]})}}),e}function un(e,u,t){return[].concat(e.slice(0,u),t,e.slice(u+1))}function Zu(e){return!(e>=55296&&e<=57343||e>=64976&&e<=65007||(e&65535)===65535||(e&65535)===65534||e>=0&&e<=8||e===11||e>=14&&e<=31||e>=127&&e<=159||e>1114111)}function uu(e){if(e>65535){e-=65536;const u=55296+(e>>10),t=56320+(e&1023);return String.fromCharCode(u,t)}return String.fromCharCode(e)}const tn=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,A0=/&([a-z#][a-z0-9]{1,31});/gi,D0=new RegExp(tn.source+"|"+A0.source,"gi"),C0=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function T0(e,u){if(u.charCodeAt(0)===35&&C0.test(u)){const n=u[1].toLowerCase()==="x"?parseInt(u.slice(2),16):parseInt(u.slice(1),10);return Zu(n)?uu(n):e}const t=_0(e);return t!==e?t:e}function F0(e){return e.indexOf("\\")<0?e:e.replace(tn,"$1")}function Ue(e){return e.indexOf("\\")<0&&e.indexOf("&")<0?e:e.replace(D0,function(u,t,n){return t||T0(u,n)})}const S0=/[&<>"]/,v0=/[&<>"]/g,R0={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function I0(e){return R0[e]}function Ce(e){return S0.test(e)?e.replace(v0,I0):e}const L0=/[.?*+^$[\]\\(){}|-]/g;function M0(e){return e.replace(L0,"\\$&")}function L(e){switch(e){case 9:case 32:return!0}return!1}function tu(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function nn(e){return ju.test(e)||Jt.test(e)}function nu(e){return nn(uu(e))}function ru(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function gu(e){return e=e.trim().replace(/\s+/g," "),"ẞ".toLowerCase()==="Ṿ"&&(e=e.replace(/ẞ/g,"ß")),e.toLowerCase().toUpperCase()}function rn(e){return e===32||e===9||e===10||e===13}function xu(e){let u=0;for(;u<e.length&&rn(e.charCodeAt(u));u++);let t=e.length-1;for(;t>=u&&rn(e.charCodeAt(t));t--);return e.slice(u,t+1)}const z0=Object.freeze(Object.defineProperty({__proto__:null,arrayReplaceAt:un,asciiTrim:xu,assign:mu,escapeHtml:Ce,escapeRE:M0,fromCodePoint:uu,has:w0,isMdAsciiPunct:ru,isPunctChar:nn,isPunctCharCode:nu,isSpace:L,isString:Vu,isValidEntityCode:Zu,isWhiteSpace:tu,lib:{mdurl:i0,ucmicro:s0},normalizeReference:gu,unescapeAll:Ue,unescapeMd:F0},Symbol.toStringTag,{value:"Module"}));function O0(e,u,t){let n,r,i,o;const s=e.posMax,a=e.pos;for(e.pos=u+1,n=1;e.pos<s;){if(i=e.src.charCodeAt(e.pos),i===93&&(n--,n===0)){r=!0;break}if(o=e.pos,e.md.inline.skipToken(e),i===91){if(o===e.pos-1)n++;else if(t)return e.pos=a,-1}}let l=-1;return r&&(l=e.pos),e.pos=a,l}function P0(e,u,t){let n,r=u;const i={ok:!1,pos:0,str:""};if(e.charCodeAt(r)===60){for(r++;r<t;){if(n=e.charCodeAt(r),n===10||n===60)return i;if(n===62)return i.pos=r+1,i.str=Ue(e.slice(u+1,r)),i.ok=!0,i;if(n===92&&r+1<t){r+=2;continue}r++}return i}let o=0;for(;r<t&&(n=e.charCodeAt(r),!(n===32||n<32||n===127));){if(n===92&&r+1<t){if(e.charCodeAt(r+1)===32)break;r+=2;continue}if(n===40&&(o++,o>32))return i;if(n===41){if(o===0)break;o--}r++}return u===r||o!==0||(i.str=Ue(e.slice(u,r)),i.pos=r,i.ok=!0),i}function N0(e,u,t,n){let r,i=u;const o={ok:!1,can_continue:!1,pos:0,str:"",marker:0};if(n)o.str=n.str,o.marker=n.marker;else{if(i>=t)return o;let s=e.charCodeAt(i);if(s!==34&&s!==39&&s!==40)return o;u++,i++,s===40&&(s=41),o.marker=s}for(;i<t;){if(r=e.charCodeAt(i),r===o.marker)return o.pos=i+1,o.str+=Ue(e.slice(u,i)),o.ok=!0,o;if(r===40&&o.marker===41)return o;r===92&&i+1<t&&i++,i++}return o.can_continue=!0,o.str+=Ue(e.slice(u,i)),o}const B0=Object.freeze(Object.defineProperty({__proto__:null,parseLinkDestination:P0,parseLinkLabel:O0,parseLinkTitle:N0},Symbol.toStringTag,{value:"Module"})),he={};he.code_inline=function(e,u,t,n,r){const i=e[u];return"<code"+r.renderAttrs(i)+">"+Ce(i.content)+"</code>"},he.code_block=function(e,u,t,n,r){const i=e[u];return"<pre"+r.renderAttrs(i)+"><code>"+Ce(e[u].content)+`</code></pre>
`},he.fence=function(e,u,t,n,r){const i=e[u],o=i.info?Ue(i.info).trim():"";let s="",a="";if(o){const d=o.split(/(\s+)/g);s=d[0],a=d.slice(2).join("")}let l;if(t.highlight?l=t.highlight(i.content,s,a)||Ce(i.content):l=Ce(i.content),l.indexOf("<pre")===0)return l+`
`;if(o){const d=i.attrIndex("class"),f=i.attrs?i.attrs.slice():[];d<0?f.push(["class",t.langPrefix+s]):(f[d]=f[d].slice(),f[d][1]+=" "+t.langPrefix+s);const m={attrs:f};return`<pre><code${r.renderAttrs(m)}>${l}</code></pre>
`}return`<pre><code${r.renderAttrs(i)}>${l}</code></pre>
`},he.image=function(e,u,t,n,r){const i=e[u];return i.attrs[i.attrIndex("alt")][1]=r.renderInlineAsText(i.children,t,n),r.renderToken(e,u,t)},he.hardbreak=function(e,u,t){return t.xhtmlOut?`<br />
`:`<br>
`},he.softbreak=function(e,u,t){return t.breaks?t.xhtmlOut?`<br />
`:`<br>
`:`
`},he.text=function(e,u){return Ce(e[u].content)},he.html_block=function(e,u){return e[u].content},he.html_inline=function(e,u){return e[u].content};function He(){this.rules=mu({},he)}He.prototype.renderAttrs=function(u){let t,n,r;if(!u.attrs)return"";for(r="",t=0,n=u.attrs.length;t<n;t++)r+=" "+Ce(u.attrs[t][0])+'="'+Ce(u.attrs[t][1])+'"';return r},He.prototype.renderToken=function(u,t,n){const r=u[t];let i="";if(r.hidden)return"";r.block&&r.nesting!==-1&&t&&u[t-1].hidden&&(i+=`
`),i+=(r.nesting===-1?"</":"<")+r.tag,i+=this.renderAttrs(r),r.nesting===0&&n.xhtmlOut&&(i+=" /");let o=!1;if(r.block&&(o=!0,r.nesting===1&&t+1<u.length)){const s=u[t+1];(s.type==="inline"||s.hidden||s.nesting===-1&&s.tag===r.tag)&&(o=!1)}return i+=o?`>
`:">",i},He.prototype.renderInline=function(e,u,t){let n="";const r=this.rules;for(let i=0,o=e.length;i<o;i++){const s=e[i].type;typeof r[s]<"u"?n+=r[s](e,i,u,t,this):n+=this.renderToken(e,i,u)}return n},He.prototype.renderInlineAsText=function(e,u,t){let n="";for(let r=0,i=e.length;r<i;r++)switch(e[r].type){case"text":n+=e[r].content;break;case"image":n+=this.renderInlineAsText(e[r].children,u,t);break;case"html_inline":case"html_block":n+=e[r].content;break;case"softbreak":case"hardbreak":n+=`
`;break}return n},He.prototype.render=function(e,u,t){let n="";const r=this.rules;for(let i=0,o=e.length;i<o;i++){const s=e[i].type;s==="inline"?n+=this.renderInline(e[i].children,u,t):typeof r[s]<"u"?n+=r[s](e,i,u,t,this):n+=this.renderToken(e,i,u,t)}return n};function ee(){this.__rules__=[],this.__cache__=null}ee.prototype.__find__=function(e){for(let u=0;u<this.__rules__.length;u++)if(this.__rules__[u].name===e)return u;return-1},ee.prototype.__compile__=function(){const e=this,u=[""];e.__rules__.forEach(function(t){t.enabled&&t.alt.forEach(function(n){u.indexOf(n)<0&&u.push(n)})}),e.__cache__={},u.forEach(function(t){e.__cache__[t]=[],e.__rules__.forEach(function(n){n.enabled&&(t&&n.alt.indexOf(t)<0||e.__cache__[t].push(n.fn))})})},ee.prototype.at=function(e,u,t){const n=this.__find__(e),r=t||{};if(n===-1)throw new Error("Parser rule not found: "+e);this.__rules__[n].fn=u,this.__rules__[n].alt=r.alt||[],this.__cache__=null},ee.prototype.before=function(e,u,t,n){const r=this.__find__(e),i=n||{};if(r===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(r,0,{name:u,enabled:!0,fn:t,alt:i.alt||[]}),this.__cache__=null},ee.prototype.after=function(e,u,t,n){const r=this.__find__(e),i=n||{};if(r===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(r+1,0,{name:u,enabled:!0,fn:t,alt:i.alt||[]}),this.__cache__=null},ee.prototype.push=function(e,u,t){const n=t||{};this.__rules__.push({name:e,enabled:!0,fn:u,alt:n.alt||[]}),this.__cache__=null},ee.prototype.enable=function(e,u){Array.isArray(e)||(e=[e]);const t=[];return e.forEach(function(n){const r=this.__find__(n);if(r<0){if(u)return;throw new Error("Rules manager: invalid rule name "+n)}this.__rules__[r].enabled=!0,t.push(n)},this),this.__cache__=null,t},ee.prototype.enableOnly=function(e,u){Array.isArray(e)||(e=[e]),this.__rules__.forEach(function(t){t.enabled=!1}),this.enable(e,u)},ee.prototype.disable=function(e,u){Array.isArray(e)||(e=[e]);const t=[];return e.forEach(function(n){const r=this.__find__(n);if(r<0){if(u)return;throw new Error("Rules manager: invalid rule name "+n)}this.__rules__[r].enabled=!1,t.push(n)},this),this.__cache__=null,t},ee.prototype.getRules=function(e){return this.__cache__===null&&this.__compile__(),this.__cache__[e]||[]};function oe(e,u,t){this.type=e,this.tag=u,this.attrs=null,this.map=null,this.nesting=t,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}oe.prototype.attrIndex=function(u){if(!this.attrs)return-1;const t=this.attrs;for(let n=0,r=t.length;n<r;n++)if(t[n][0]===u)return n;return-1},oe.prototype.attrPush=function(u){this.attrs?this.attrs.push(u):this.attrs=[u]},oe.prototype.attrSet=function(u,t){const n=this.attrIndex(u),r=[u,t];n<0?this.attrPush(r):this.attrs[n]=r},oe.prototype.attrGet=function(u){const t=this.attrIndex(u);let n=null;return t>=0&&(n=this.attrs[t][1]),n},oe.prototype.attrJoin=function(u,t){const n=this.attrIndex(u);n<0?this.attrPush([u,t]):this.attrs[n][1]=this.attrs[n][1]+" "+t};function on(e,u,t){this.src=e,this.env=t,this.tokens=[],this.inlineMode=!1,this.md=u}on.prototype.Token=oe;const $0=/\r\n?|\n/g,q0=/\0/g;function U0(e){let u;u=e.src.replace($0,`
`),u=u.replace(q0,"�"),e.src=u}function H0(e){let u;e.inlineMode?(u=new e.Token("inline","",0),u.content=e.src,u.map=[0,1],u.children=[],e.tokens.push(u)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}function j0(e){const u=e.tokens;for(let t=0,n=u.length;t<n;t++){const r=u[t];r.type==="inline"&&e.md.inline.parse(r.content,e.md,e.env,r.children)}}function W0(e){return/^<a[>\s]/i.test(e)}function G0(e){return/^<\/a\s*>/i.test(e)}function V0(e){const u=e.tokens;if(e.md.options.linkify)for(let t=0,n=u.length;t<n;t++){if(u[t].type!=="inline"||!e.md.linkify.pretest(u[t].content))continue;let r=u[t].children,i=0;for(let o=r.length-1;o>=0;o--){const s=r[o];if(s.type==="link_close"){for(o--;r[o].level!==s.level&&r[o].type!=="link_open";)o--;continue}if(s.type==="html_inline"&&(W0(s.content)&&i>0&&i--,G0(s.content)&&i++),!(i>0)&&s.type==="text"&&e.md.linkify.test(s.content)){const a=s.content;let l=e.md.linkify.match(a);const d=[];let f=s.level,m=0;l.length>0&&l[0].index===0&&o>0&&r[o-1].type==="text_special"&&(l=l.slice(1));for(let b=0;b<l.length;b++){const p=l[b].url,k=e.md.normalizeLink(p);if(!e.md.validateLink(k))continue;let w=l[b].text;l[b].schema?l[b].schema==="mailto:"&&!/^mailto:/i.test(w)?w=e.md.normalizeLinkText("mailto:"+w).replace(/^mailto:/,""):w=e.md.normalizeLinkText(w):w=e.md.normalizeLinkText("http://"+w).replace(/^http:\/\//,"");const C=l[b].index;if(C>m){const A=new e.Token("text","",0);A.content=a.slice(m,C),A.level=f,d.push(A)}const y=new e.Token("link_open","a",1);y.attrs=[["href",k]],y.level=f++,y.markup="linkify",y.info="auto",d.push(y);const D=new e.Token("text","",0);D.content=w,D.level=f,d.push(D);const _=new e.Token("link_close","a",-1);_.level=--f,_.markup="linkify",_.info="auto",d.push(_),m=l[b].lastIndex}if(m<a.length){const b=new e.Token("text","",0);b.content=a.slice(m),b.level=f,d.push(b)}u[t].children=r=un(r,o,d)}}}}const sn=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,Z0=/\((c|tm|r)\)/i,Y0=/\((c|tm|r)\)/ig,X0={c:"©",r:"®",tm:"™"};function J0(e,u){return X0[u.toLowerCase()]}function K0(e){let u=0;for(let t=e.length-1;t>=0;t--){const n=e[t];n.type==="text"&&!u&&(n.content=n.content.replace(Y0,J0)),n.type==="link_open"&&n.info==="auto"&&u--,n.type==="link_close"&&n.info==="auto"&&u++}}function Q0(e){let u=0;for(let t=e.length-1;t>=0;t--){const n=e[t];n.type==="text"&&!u&&sn.test(n.content)&&(n.content=n.content.replace(/\+-/g,"±").replace(/\.{2,}/g,"…").replace(/([?!])…/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---(?=[^-]|$)/mg,"$1—").replace(/(^|\s)--(?=\s|$)/mg,"$1–").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg,"$1–")),n.type==="link_open"&&n.info==="auto"&&u--,n.type==="link_close"&&n.info==="auto"&&u++}}function ei(e){let u;if(e.md.options.typographer)for(u=e.tokens.length-1;u>=0;u--)e.tokens[u].type==="inline"&&(Z0.test(e.tokens[u].content)&&K0(e.tokens[u].children),sn.test(e.tokens[u].content)&&Q0(e.tokens[u].children))}const ui=/['"]/,an=/['"]/g,cn="’";function _u(e,u,t,n){e[u]||(e[u]=[]),e[u].push({pos:t,ch:n})}function ti(e,u){let t="",n=0;u.sort((r,i)=>r.pos-i.pos);for(let r=0;r<u.length;r++){const i=u[r];t+=e.slice(n,i.pos)+i.ch,n=i.pos+1}return t+e.slice(n)}function ni(e,u){let t;const n=[],r={};for(let i=0;i<e.length;i++){const o=e[i],s=e[i].level;for(t=n.length-1;t>=0&&!(n[t].level<=s);t--);if(n.length=t+1,o.type!=="text")continue;const a=o.content;let l=0;const d=a.length;e:for(;l<d;){an.lastIndex=l;const f=an.exec(a);if(!f)break;let m=!0,b=!0;l=f.index+1;const p=f[0]==="'";let k=32;if(f.index-1>=0)k=a.charCodeAt(f.index-1);else for(t=i-1;t>=0&&!(e[t].type==="softbreak"||e[t].type==="hardbreak");t--)if(e[t].content){k=e[t].content.charCodeAt(e[t].content.length-1);break}let w=32;if(l<d)w=a.charCodeAt(l);else for(t=i+1;t<e.length&&!(e[t].type==="softbreak"||e[t].type==="hardbreak");t++)if(e[t].content){w=e[t].content.charCodeAt(0);break}const C=ru(k)||nu(k),y=ru(w)||nu(w),D=tu(k),_=tu(w);if(_?m=!1:y&&(D||C||(m=!1)),D?b=!1:C&&(_||y||(b=!1)),w===34&&f[0]==='"'&&k>=48&&k<=57&&(b=m=!1),m&&b&&(m=C,b=y),!m&&!b){p&&_u(r,i,f.index,cn);continue}if(b)for(t=n.length-1;t>=0;t--){let A=n[t];if(n[t].level<s)break;if(A.single===p&&n[t].level===s){A=n[t];let F,R;p?(F=u.md.options.quotes[2],R=u.md.options.quotes[3]):(F=u.md.options.quotes[0],R=u.md.options.quotes[1]),_u(r,i,f.index,R),_u(r,A.token,A.pos,F),n.length=t;continue e}}m?n.push({token:i,pos:f.index,single:p,level:s}):b&&p&&_u(r,i,f.index,cn)}}Object.keys(r).forEach(function(i){e[i].content=ti(e[i].content,r[i])})}function ri(e){if(e.md.options.typographer)for(let u=e.tokens.length-1;u>=0;u--)e.tokens[u].type!=="inline"||!ui.test(e.tokens[u].content)||ni(e.tokens[u].children,e)}function ii(e){let u,t;const n=e.tokens,r=n.length;for(let i=0;i<r;i++){if(n[i].type!=="inline")continue;const o=n[i].children,s=o.length;for(u=0;u<s;u++)o[u].type==="text_special"&&(o[u].type="text");for(u=t=0;u<s;u++)o[u].type==="text"&&u+1<s&&o[u+1].type==="text"?o[u+1].content=o[u].content+o[u+1].content:(u!==t&&(o[t]=o[u]),t++);u!==t&&(o.length=t)}}const Yu=[["normalize",U0],["block",H0],["inline",j0],["linkify",V0],["replacements",ei],["smartquotes",ri],["text_join",ii]];function Xu(){this.ruler=new ee;for(let e=0;e<Yu.length;e++)this.ruler.push(Yu[e][0],Yu[e][1])}Xu.prototype.process=function(e){const u=this.ruler.getRules("");for(let t=0,n=u.length;t<n;t++)u[t](e)},Xu.prototype.State=on;function pe(e,u,t,n){this.src=e,this.md=u,this.env=t,this.tokens=n,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0;const r=this.src;for(let i=0,o=0,s=0,a=0,l=r.length,d=!1;o<l;o++){const f=r.charCodeAt(o);if(!d)if(L(f)){s++,f===9?a+=4-a%4:a++;continue}else d=!0;(f===10||o===l-1)&&(f!==10&&o++,this.bMarks.push(i),this.eMarks.push(o),this.tShift.push(s),this.sCount.push(a),this.bsCount.push(0),d=!1,s=0,a=0,i=o+1)}this.bMarks.push(r.length),this.eMarks.push(r.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}pe.prototype.push=function(e,u,t){const n=new oe(e,u,t);return n.block=!0,t<0&&this.level--,n.level=this.level,t>0&&this.level++,this.tokens.push(n),n},pe.prototype.isEmpty=function(u){return this.bMarks[u]+this.tShift[u]>=this.eMarks[u]},pe.prototype.skipEmptyLines=function(u){for(let t=this.lineMax;u<t&&!(this.bMarks[u]+this.tShift[u]<this.eMarks[u]);u++);return u},pe.prototype.skipSpaces=function(u){for(let t=this.src.length;u<t;u++){const n=this.src.charCodeAt(u);if(!L(n))break}return u},pe.prototype.skipSpacesBack=function(u,t){if(u<=t)return u;for(;u>t;)if(!L(this.src.charCodeAt(--u)))return u+1;return u},pe.prototype.skipChars=function(u,t){for(let n=this.src.length;u<n&&this.src.charCodeAt(u)===t;u++);return u},pe.prototype.skipCharsBack=function(u,t,n){if(u<=n)return u;for(;u>n;)if(t!==this.src.charCodeAt(--u))return u+1;return u},pe.prototype.getLines=function(u,t,n,r){if(u>=t)return"";const i=new Array(t-u);for(let o=0,s=u;s<t;s++,o++){let a=0;const l=this.bMarks[s];let d=l,f;for(s+1<t||r?f=this.eMarks[s]+1:f=this.eMarks[s];d<f&&a<n;){const m=this.src.charCodeAt(d);if(L(m))m===9?a+=4-(a+this.bsCount[s])%4:a++;else if(d-l<this.tShift[s])a++;else break;d++}a>n?i[o]=new Array(a-n+1).join(" ")+this.src.slice(d,f):i[o]=this.src.slice(d,f)}return i.join("")},pe.prototype.Token=oe;const oi=65536;function Ju(e,u){const t=e.bMarks[u]+e.tShift[u],n=e.eMarks[u];return e.src.slice(t,n)}function ln(e){const u=[],t=e.length;let n=0,r=e.charCodeAt(n),i=!1,o=0,s="";for(;n<t;)r===124&&(i?(s+=e.substring(o,n-1),o=n):(u.push(s+e.substring(o,n)),s="",o=n+1)),i=r===92,n++,r=e.charCodeAt(n);return u.push(s+e.substring(o)),u}function si(e,u,t,n){if(u+2>t)return!1;let r=u+1;if(e.sCount[r]<e.blkIndent||e.sCount[r]-e.blkIndent>=4)return!1;let i=e.bMarks[r]+e.tShift[r];if(i>=e.eMarks[r])return!1;const o=e.src.charCodeAt(i++);if(o!==124&&o!==45&&o!==58||i>=e.eMarks[r])return!1;const s=e.src.charCodeAt(i++);if(s!==124&&s!==45&&s!==58&&!L(s)||o===45&&L(s))return!1;for(;i<e.eMarks[r];){const _=e.src.charCodeAt(i);if(_!==124&&_!==45&&_!==58&&!L(_))return!1;i++}let a=Ju(e,u+1),l=a.split("|");const d=[];for(let _=0;_<l.length;_++){const A=l[_].trim();if(!A){if(_===0||_===l.length-1)continue;return!1}if(!/^:?-+:?$/.test(A))return!1;A.charCodeAt(A.length-1)===58?d.push(A.charCodeAt(0)===58?"center":"right"):A.charCodeAt(0)===58?d.push("left"):d.push("")}if(a=Ju(e,u).trim(),a.indexOf("|")===-1||e.sCount[u]-e.blkIndent>=4)return!1;l=ln(a),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop();const f=l.length;if(f===0||f!==d.length)return!1;if(n)return!0;const m=e.parentType;e.parentType="table";const b=e.md.block.ruler.getRules("blockquote"),p=e.push("table_open","table",1),k=[u,0];p.map=k;const w=e.push("thead_open","thead",1);w.map=[u,u+1];const C=e.push("tr_open","tr",1);C.map=[u,u+1];for(let _=0;_<l.length;_++){const A=e.push("th_open","th",1);d[_]&&(A.attrs=[["style","text-align:"+d[_]]]);const F=e.push("inline","",0);F.content=l[_].trim(),F.children=[],e.push("th_close","th",-1)}e.push("tr_close","tr",-1),e.push("thead_close","thead",-1);let y,D=0;for(r=u+2;r<t&&!(e.sCount[r]<e.blkIndent);r++){let _=!1;for(let F=0,R=b.length;F<R;F++)if(b[F](e,r,t,!0)){_=!0;break}if(_||(a=Ju(e,r).trim(),!a)||e.sCount[r]-e.blkIndent>=4||(l=ln(a),l.length&&l[0]===""&&l.shift(),l.length&&l[l.length-1]===""&&l.pop(),D+=f-l.length,D>oi))break;if(r===u+2){const F=e.push("tbody_open","tbody",1);F.map=y=[u+2,0]}const A=e.push("tr_open","tr",1);A.map=[r,r+1];for(let F=0;F<f;F++){const R=e.push("td_open","td",1);d[F]&&(R.attrs=[["style","text-align:"+d[F]]]);const K=e.push("inline","",0);K.content=l[F]?l[F].trim():"",K.children=[],e.push("td_close","td",-1)}e.push("tr_close","tr",-1)}return y&&(e.push("tbody_close","tbody",-1),y[1]=r),e.push("table_close","table",-1),k[1]=r,e.parentType=m,e.line=r,!0}function ai(e,u,t){if(e.sCount[u]-e.blkIndent<4)return!1;let n=u+1,r=n;for(;n<t;){if(e.isEmpty(n)){n++;continue}if(e.sCount[n]-e.blkIndent>=4){n++,r=n;continue}break}e.line=r;const i=e.push("code_block","code",0);return i.content=e.getLines(u,r,4+e.blkIndent,!1)+`
`,i.map=[u,e.line],!0}function ci(e,u,t,n){let r=e.bMarks[u]+e.tShift[u],i=e.eMarks[u];if(e.sCount[u]-e.blkIndent>=4||r+3>i)return!1;const o=e.src.charCodeAt(r);if(o!==126&&o!==96)return!1;let s=r;r=e.skipChars(r,o);let a=r-s;if(a<3)return!1;const l=e.src.slice(s,r),d=e.src.slice(r,i);if(o===96&&d.indexOf(String.fromCharCode(o))>=0)return!1;if(n)return!0;let f=u,m=!1;for(;f++,!(f>=t||(r=s=e.bMarks[f]+e.tShift[f],i=e.eMarks[f],r<i&&e.sCount[f]<e.blkIndent));)if(e.src.charCodeAt(r)===o&&!(e.sCount[f]-e.blkIndent>=4)&&(r=e.skipChars(r,o),!(r-s<a)&&(r=e.skipSpaces(r),!(r<i)))){m=!0;break}a=e.sCount[u],e.line=f+(m?1:0);const b=e.push("fence","code",0);return b.info=d,b.content=e.getLines(u+1,f,a,!0),b.markup=l,b.map=[u,e.line],!0}function li(e,u,t,n){let r=e.bMarks[u]+e.tShift[u],i=e.eMarks[u];const o=e.lineMax;if(e.sCount[u]-e.blkIndent>=4||e.src.charCodeAt(r)!==62)return!1;if(n)return!0;const s=[],a=[],l=[],d=[],f=e.md.block.ruler.getRules("blockquote"),m=e.parentType;e.parentType="blockquote";let b=!1,p;for(p=u;p<t;p++){const D=e.sCount[p]<e.blkIndent;if(r=e.bMarks[p]+e.tShift[p],i=e.eMarks[p],r>=i)break;if(e.src.charCodeAt(r++)===62&&!D){let A=e.sCount[p]+1,F,R;e.src.charCodeAt(r)===32?(r++,A++,R=!1,F=!0):e.src.charCodeAt(r)===9?(F=!0,(e.bsCount[p]+A)%4===3?(r++,A++,R=!1):R=!0):F=!1;let K=A;for(s.push(e.bMarks[p]),e.bMarks[p]=r;r<i;){const se=e.src.charCodeAt(r);if(L(se))se===9?K+=4-(K+e.bsCount[p]+(R?1:0))%4:K++;else break;r++}b=r>=i,a.push(e.bsCount[p]),e.bsCount[p]=e.sCount[p]+1+(F?1:0),l.push(e.sCount[p]),e.sCount[p]=K-A,d.push(e.tShift[p]),e.tShift[p]=r-e.bMarks[p];continue}if(b)break;let _=!1;for(let A=0,F=f.length;A<F;A++)if(f[A](e,p,t,!0)){_=!0;break}if(_){e.lineMax=p,e.blkIndent!==0&&(s.push(e.bMarks[p]),a.push(e.bsCount[p]),d.push(e.tShift[p]),l.push(e.sCount[p]),e.sCount[p]-=e.blkIndent);break}s.push(e.bMarks[p]),a.push(e.bsCount[p]),d.push(e.tShift[p]),l.push(e.sCount[p]),e.sCount[p]=-1}const k=e.blkIndent;e.blkIndent=0;const w=e.push("blockquote_open","blockquote",1);w.markup=">";const C=[u,0];w.map=C,e.md.block.tokenize(e,u,p);const y=e.push("blockquote_close","blockquote",-1);y.markup=">",e.lineMax=o,e.parentType=m,C[1]=e.line;for(let D=0;D<d.length;D++)e.bMarks[D+u]=s[D],e.tShift[D+u]=d[D],e.sCount[D+u]=l[D],e.bsCount[D+u]=a[D];return e.blkIndent=k,!0}function di(e,u,t,n){const r=e.eMarks[u];if(e.sCount[u]-e.blkIndent>=4)return!1;let i=e.bMarks[u]+e.tShift[u];const o=e.src.charCodeAt(i++);if(o!==42&&o!==45&&o!==95)return!1;let s=1;for(;i<r;){const l=e.src.charCodeAt(i++);if(l!==o&&!L(l))return!1;l===o&&s++}if(s<3)return!1;if(n)return!0;e.line=u+1;const a=e.push("hr","hr",0);return a.map=[u,e.line],a.markup=Array(s+1).join(String.fromCharCode(o)),!0}function dn(e,u){const t=e.eMarks[u];let n=e.bMarks[u]+e.tShift[u];const r=e.src.charCodeAt(n++);if(r!==42&&r!==45&&r!==43)return-1;if(n<t){const i=e.src.charCodeAt(n);if(!L(i))return-1}return n}function fn(e,u){const t=e.bMarks[u]+e.tShift[u],n=e.eMarks[u];let r=t;if(r+1>=n)return-1;let i=e.src.charCodeAt(r++);if(i<48||i>57)return-1;for(;;){if(r>=n)return-1;if(i=e.src.charCodeAt(r++),i>=48&&i<=57){if(r-t>=10)return-1;continue}if(i===41||i===46)break;return-1}return r<n&&(i=e.src.charCodeAt(r),!L(i))?-1:r}function fi(e,u){const t=e.level+2;for(let n=u+2,r=e.tokens.length-2;n<r;n++)e.tokens[n].level===t&&e.tokens[n].type==="paragraph_open"&&(e.tokens[n+2].hidden=!0,e.tokens[n].hidden=!0,n+=2)}function hi(e,u,t,n){let r,i,o,s,a=u,l=!0;if(e.sCount[a]-e.blkIndent>=4||e.listIndent>=0&&e.sCount[a]-e.listIndent>=4&&e.sCount[a]<e.blkIndent)return!1;let d=!1;n&&e.parentType==="paragraph"&&e.sCount[a]>=e.blkIndent&&(d=!0);let f,m,b;if((b=fn(e,a))>=0){if(f=!0,o=e.bMarks[a]+e.tShift[a],m=Number(e.src.slice(o,b-1)),d&&m!==1)return!1}else if((b=dn(e,a))>=0)f=!1;else return!1;if(d&&e.skipSpaces(b)>=e.eMarks[a])return!1;if(n)return!0;const p=e.src.charCodeAt(b-1),k=e.tokens.length;f?(s=e.push("ordered_list_open","ol",1),m!==1&&(s.attrs=[["start",m]])):s=e.push("bullet_list_open","ul",1);const w=[a,0];s.map=w,s.markup=String.fromCharCode(p);let C=!1;const y=e.md.block.ruler.getRules("list"),D=e.parentType;for(e.parentType="list";a<t;){i=b,r=e.eMarks[a];const _=e.sCount[a]+b-(e.bMarks[a]+e.tShift[a]);let A=_;for(;i<r;){const ce=e.src.charCodeAt(i);if(ce===9)A+=4-(A+e.bsCount[a])%4;else if(ce===32)A++;else break;i++}const F=i;let R;F>=r?R=1:R=A-_,R>4&&(R=1);const K=_+R;s=e.push("list_item_open","li",1),s.markup=String.fromCharCode(p);const se=[a,0];s.map=se,f&&(s.info=e.src.slice(o,b-1));const ae=e.tight,We=e.tShift[a],Se=e.sCount[a],it=e.listIndent;if(e.listIndent=e.blkIndent,e.blkIndent=K,e.tight=!0,e.tShift[a]=F-e.bMarks[a],e.sCount[a]=A,F>=r&&e.isEmpty(a+1)?e.line=Math.min(e.line+2,t):e.md.block.tokenize(e,a,t,!0),(!e.tight||C)&&(l=!1),C=e.line-a>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=it,e.tShift[a]=We,e.sCount[a]=Se,e.tight=ae,s=e.push("list_item_close","li",-1),s.markup=String.fromCharCode(p),a=e.line,se[1]=a,a>=t||e.sCount[a]<e.blkIndent||e.sCount[a]-e.blkIndent>=4)break;let Au=!1;for(let ce=0,lu=y.length;ce<lu;ce++)if(y[ce](e,a,t,!0)){Au=!0;break}if(Au)break;if(f){if(b=fn(e,a),b<0)break;o=e.bMarks[a]+e.tShift[a]}else if(b=dn(e,a),b<0)break;if(p!==e.src.charCodeAt(b-1))break}return f?s=e.push("ordered_list_close","ol",-1):s=e.push("bullet_list_close","ul",-1),s.markup=String.fromCharCode(p),w[1]=a,e.line=a,e.parentType=D,l&&fi(e,k),!0}function pi(e,u,t,n){let r=e.bMarks[u]+e.tShift[u],i=e.eMarks[u],o=u+1;if(e.sCount[u]-e.blkIndent>=4||e.src.charCodeAt(r)!==91)return!1;function s(y){const D=e.lineMax;if(y>=D||e.isEmpty(y))return null;let _=!1;if(e.sCount[y]-e.blkIndent>3&&(_=!0),e.sCount[y]<0&&(_=!0),!_){const R=e.md.block.ruler.getRules("reference"),K=e.parentType;e.parentType="reference";let se=!1;for(let ae=0,We=R.length;ae<We;ae++)if(R[ae](e,y,D,!0)){se=!0;break}if(e.parentType=K,se)return null}const A=e.bMarks[y]+e.tShift[y],F=e.eMarks[y];return e.src.slice(A,F+1)}let a=e.src.slice(r,i+1);i=a.length;let l=-1;for(r=1;r<i;r++){const y=a.charCodeAt(r);if(y===91)return!1;if(y===93){l=r;break}else if(y===10){const D=s(o);D!==null&&(a+=D,i=a.length,o++)}else if(y===92&&(r++,r<i&&a.charCodeAt(r)===10)){const D=s(o);D!==null&&(a+=D,i=a.length,o++)}}if(l<0||a.charCodeAt(l+1)!==58)return!1;for(r=l+2;r<i;r++){const y=a.charCodeAt(r);if(y===10){const D=s(o);D!==null&&(a+=D,i=a.length,o++)}else if(!L(y))break}const d=e.md.helpers.parseLinkDestination(a,r,i);if(!d.ok)return!1;const f=e.md.normalizeLink(d.str);if(!e.md.validateLink(f))return!1;r=d.pos;const m=r,b=o,p=r;for(;r<i;r++){const y=a.charCodeAt(r);if(y===10){const D=s(o);D!==null&&(a+=D,i=a.length,o++)}else if(!L(y))break}let k=e.md.helpers.parseLinkTitle(a,r,i);for(;k.can_continue;){const y=s(o);if(y===null)break;a+=y,r=i,i=a.length,o++,k=e.md.helpers.parseLinkTitle(a,r,i,k)}let w;for(r<i&&p!==r&&k.ok?(w=k.str,r=k.pos):(w="",r=m,o=b);r<i;){const y=a.charCodeAt(r);if(!L(y))break;r++}if(r<i&&a.charCodeAt(r)!==10&&w)for(w="",r=m,o=b;r<i;){const y=a.charCodeAt(r);if(!L(y))break;r++}if(r<i&&a.charCodeAt(r)!==10)return!1;const C=gu(a.slice(1,l));return C?(n||(typeof e.env.references>"u"&&(e.env.references={}),typeof e.env.references[C]>"u"&&(e.env.references[C]={title:w,href:f}),e.line=o),!0):!1}const bi=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"],mi="[a-zA-Z_:][a-zA-Z0-9:._-]*",gi="(?:"+"[^\"'=<>`\\x00-\\x20]+"+"|"+"'[^']*'"+"|"+'"[^"]*"'+")",hn="<[A-Za-z][A-Za-z0-9\\-]*"+("(?:\\s+"+mi+"(?:\\s*=\\s*"+gi+")?)")+"*\\s*\\/?>",pn="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",xi="<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->",_i="<[?][\\s\\S]*?[?]>",yi="<![A-Za-z][^>]*>",ki="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",Ei=new RegExp("^(?:"+hn+"|"+pn+"|"+xi+"|"+_i+"|"+yi+"|"+ki+")"),wi=new RegExp("^(?:"+hn+"|"+pn+")"),ze=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+bi.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(wi.source+"\\s*$"),/^$/,!1]];function Ai(e,u,t,n){let r=e.bMarks[u]+e.tShift[u],i=e.eMarks[u];if(e.sCount[u]-e.blkIndent>=4||!e.md.options.html||e.src.charCodeAt(r)!==60)return!1;let o=e.src.slice(r,i),s=0;for(;s<ze.length&&!ze[s][0].test(o);s++);if(s===ze.length)return!1;if(n)return ze[s][2];let a=u+1;const l=ze[s][1].test("");if(!ze[s][1].test(o)){for(;a<t&&!(e.sCount[a]<e.blkIndent&&(l||!e.isEmpty(a)));a++)if(r=e.bMarks[a]+e.tShift[a],i=e.eMarks[a],o=e.src.slice(r,i),ze[s][1].test(o)){o.length!==0&&a++;break}}e.line=a;const d=e.push("html_block","",0);return d.map=[u,a],d.content=e.getLines(u,a,e.blkIndent,!0),!0}function Di(e,u,t,n){let r=e.bMarks[u]+e.tShift[u],i=e.eMarks[u];if(e.sCount[u]-e.blkIndent>=4)return!1;let o=e.src.charCodeAt(r);if(o!==35||r>=i)return!1;let s=1;for(o=e.src.charCodeAt(++r);o===35&&r<i&&s<=6;)s++,o=e.src.charCodeAt(++r);if(s>6||r<i&&!L(o))return!1;if(n)return!0;i=e.skipSpacesBack(i,r);const a=e.skipCharsBack(i,35,r);a>r&&L(e.src.charCodeAt(a-1))&&(i=a),e.line=u+1;const l=e.push("heading_open","h"+String(s),1);l.markup="########".slice(0,s),l.map=[u,e.line];const d=e.push("inline","",0);d.content=xu(e.src.slice(r,i)),d.map=[u,e.line],d.children=[];const f=e.push("heading_close","h"+String(s),-1);return f.markup="########".slice(0,s),!0}function Ci(e,u,t){const n=e.md.block.ruler.getRules("paragraph");if(e.sCount[u]-e.blkIndent>=4)return!1;const r=e.parentType;e.parentType="paragraph";let i=0,o,s=u+1;for(;s<t&&!e.isEmpty(s);s++){if(e.sCount[s]-e.blkIndent>3)continue;if(e.sCount[s]>=e.blkIndent){let b=e.bMarks[s]+e.tShift[s];const p=e.eMarks[s];if(b<p&&(o=e.src.charCodeAt(b),(o===45||o===61)&&(b=e.skipChars(b,o),b=e.skipSpaces(b),b>=p))){i=o===61?1:2;break}}if(e.sCount[s]<0)continue;let m=!1;for(let b=0,p=n.length;b<p;b++)if(n[b](e,s,t,!0)){m=!0;break}if(m)break}if(!i)return e.parentType=r,!1;const a=xu(e.getLines(u,s,e.blkIndent,!1));e.line=s+1;const l=e.push("heading_open","h"+String(i),1);l.markup=String.fromCharCode(o),l.map=[u,e.line];const d=e.push("inline","",0);d.content=a,d.map=[u,e.line-1],d.children=[];const f=e.push("heading_close","h"+String(i),-1);return f.markup=String.fromCharCode(o),e.parentType=r,!0}function Ti(e,u,t){const n=e.md.block.ruler.getRules("paragraph"),r=e.parentType;let i=u+1;for(e.parentType="paragraph";i<t&&!e.isEmpty(i);i++){if(e.sCount[i]-e.blkIndent>3||e.sCount[i]<0)continue;let l=!1;for(let d=0,f=n.length;d<f;d++)if(n[d](e,i,t,!0)){l=!0;break}if(l)break}const o=xu(e.getLines(u,i,e.blkIndent,!1));e.line=i;const s=e.push("paragraph_open","p",1);s.map=[u,e.line];const a=e.push("inline","",0);return a.content=o,a.map=[u,e.line],a.children=[],e.push("paragraph_close","p",-1),e.parentType=r,!0}const yu=[["table",si,["paragraph","reference"]],["code",ai],["fence",ci,["paragraph","reference","blockquote","list"]],["blockquote",li,["paragraph","reference","blockquote","list"]],["hr",di,["paragraph","reference","blockquote","list"]],["list",hi,["paragraph","reference","blockquote"]],["reference",pi],["html_block",Ai,["paragraph","reference","blockquote"]],["heading",Di,["paragraph","reference","blockquote"]],["lheading",Ci],["paragraph",Ti]];function ku(){this.ruler=new ee;for(let e=0;e<yu.length;e++)this.ruler.push(yu[e][0],yu[e][1],{alt:(yu[e][2]||[]).slice()})}ku.prototype.tokenize=function(e,u,t){const n=this.ruler.getRules(""),r=n.length,i=e.md.options.maxNesting;let o=u,s=!1;for(;o<t&&(e.line=o=e.skipEmptyLines(o),!(o>=t||e.sCount[o]<e.blkIndent));){if(e.level>=i){e.line=t;break}const a=e.line;let l=!1;for(let d=0;d<r;d++)if(l=n[d](e,o,t,!1),l){if(a>=e.line)throw new Error("block rule didn't increment state.line");break}if(!l)throw new Error("none of the block rules matched");e.tight=!s,e.isEmpty(e.line-1)&&(s=!0),o=e.line,o<t&&e.isEmpty(o)&&(s=!0,o++,e.line=o)}},ku.prototype.parse=function(e,u,t,n){if(!e)return;const r=new this.State(e,u,t,n);this.tokenize(r,r.line,r.lineMax)},ku.prototype.State=pe;function iu(e,u,t,n){this.src=e,this.env=t,this.md=u,this.tokens=n,this.tokens_meta=Array(n.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}iu.prototype.pushPending=function(){const e=new oe("text","",0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending="",e},iu.prototype.push=function(e,u,t){this.pending&&this.pushPending();const n=new oe(e,u,t);let r=null;return t<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),n.level=this.level,t>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],r={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(n),this.tokens_meta.push(r),n},iu.prototype.scanDelims=function(e,u){const t=this.posMax,n=this.src.charCodeAt(e);let r;if(e===0)r=32;else if(e===1)r=this.src.charCodeAt(0),(r&63488)===55296&&(r=65533);else if(r=this.src.charCodeAt(e-1),(r&64512)===56320){const w=this.src.charCodeAt(e-2);r=(w&64512)===55296?65536+(w-55296<<10)+(r-56320):65533}else(r&64512)===55296&&(r=65533);let i=e;for(;i<t&&this.src.charCodeAt(i)===n;)i++;const o=i-e;let s=i<t?this.src.charCodeAt(i):32;if((s&64512)===55296){const w=this.src.charCodeAt(i+1);s=(w&64512)===56320?65536+(s-55296<<10)+(w-56320):65533}else(s&64512)===56320&&(s=65533);const a=ru(r)||nu(r),l=ru(s)||nu(s),d=tu(r),f=tu(s),m=!f&&(!l||d||a),b=!d&&(!a||f||l);return{can_open:m&&(u||!b||a),can_close:b&&(u||!m||l),length:o}},iu.prototype.Token=oe;function Fi(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function Si(e,u){let t=e.pos;for(;t<e.posMax&&!Fi(e.src.charCodeAt(t));)t++;return t===e.pos?!1:(u||(e.pending+=e.src.slice(e.pos,t)),e.pos=t,!0)}const vi=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function Ri(e,u){if(!e.md.options.linkify||e.linkLevel>0)return!1;const t=e.pos,n=e.posMax;if(t+3>n||e.src.charCodeAt(t)!==58||e.src.charCodeAt(t+1)!==47||e.src.charCodeAt(t+2)!==47)return!1;const r=e.pending.match(vi);if(!r)return!1;const i=r[1],o=e.md.linkify.matchAtStart(e.src.slice(t-i.length));if(!o)return!1;let s=o.url;if(s.length<=i.length)return!1;let a=s.length;for(;a>0&&s.charCodeAt(a-1)===42;)a--;a!==s.length&&(s=s.slice(0,a));const l=e.md.normalizeLink(s);if(!e.md.validateLink(l))return!1;if(!u){e.pending=e.pending.slice(0,-i.length);const d=e.push("link_open","a",1);d.attrs=[["href",l]],d.markup="linkify",d.info="auto";const f=e.push("text","",0);f.content=e.md.normalizeLinkText(s);const m=e.push("link_close","a",-1);m.markup="linkify",m.info="auto"}return e.pos+=s.length-i.length,!0}function Ii(e,u){let t=e.pos;if(e.src.charCodeAt(t)!==10)return!1;const n=e.pending.length-1,r=e.posMax;if(!u)if(n>=0&&e.pending.charCodeAt(n)===32)if(n>=1&&e.pending.charCodeAt(n-1)===32){let i=n-1;for(;i>=1&&e.pending.charCodeAt(i-1)===32;)i--;e.pending=e.pending.slice(0,i),e.push("hardbreak","br",0)}else e.pending=e.pending.slice(0,-1),e.push("softbreak","br",0);else e.push("softbreak","br",0);for(t++;t<r&&L(e.src.charCodeAt(t));)t++;return e.pos=t,!0}const Ku=[];for(let e=0;e<256;e++)Ku.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e){Ku[e.charCodeAt(0)]=1});function Li(e,u){let t=e.pos;const n=e.posMax;if(e.src.charCodeAt(t)!==92||(t++,t>=n))return!1;let r=e.src.charCodeAt(t);if(r===10){for(u||e.push("hardbreak","br",0),t++;t<n&&(r=e.src.charCodeAt(t),!!L(r));)t++;return e.pos=t,!0}if(r===32){if(!u){const s=e.push("text_special","",0);s.content="\\",s.markup="\\",s.info="escape"}return e.pos=t,!0}let i=e.src[t];if(r>=55296&&r<=56319&&t+1<n){const s=e.src.charCodeAt(t+1);s>=56320&&s<=57343&&(i+=e.src[t+1],t++)}const o="\\"+i;if(!u){const s=e.push("text_special","",0);r<256&&Ku[r]!==0?s.content=i:s.content=o,s.markup=o,s.info="escape"}return e.pos=t+1,!0}function Mi(e,u){let t=e.pos;if(e.src.charCodeAt(t)!==96)return!1;const r=t;t++;const i=e.posMax;for(;t<i&&e.src.charCodeAt(t)===96;)t++;const o=e.src.slice(r,t),s=o.length;if(e.backticksScanned&&(e.backticks[s]||0)<=r)return u||(e.pending+=o),e.pos+=s,!0;let a=t,l;for(;(l=e.src.indexOf("`",a))!==-1;){for(a=l+1;a<i&&e.src.charCodeAt(a)===96;)a++;const d=a-l;if(d===s){if(!u){const f=e.push("code_inline","code",0);f.markup=o,f.content=e.src.slice(t,l).replace(/\n/g," ").replace(/^ (.+) $/,"$1")}return e.pos=a,!0}e.backticks[d]=l}return e.backticksScanned=!0,u||(e.pending+=o),e.pos+=s,!0}function zi(e,u){const t=e.pos,n=e.src.charCodeAt(t);if(u||n!==126)return!1;const r=e.scanDelims(e.pos,!0);let i=r.length;const o=String.fromCharCode(n);if(i<2)return!1;let s;i%2&&(s=e.push("text","",0),s.content=o,i--);for(let a=0;a<i;a+=2)s=e.push("text","",0),s.content=o+o,e.delimiters.push({marker:n,length:0,token:e.tokens.length-1,end:-1,open:r.can_open,close:r.can_close});return e.pos+=r.length,!0}function bn(e,u){let t;const n=[],r=u.length;for(let i=0;i<r;i++){const o=u[i];if(o.marker!==126||o.end===-1)continue;const s=u[o.end];t=e.tokens[o.token],t.type="s_open",t.tag="s",t.nesting=1,t.markup="~~",t.content="",t=e.tokens[s.token],t.type="s_close",t.tag="s",t.nesting=-1,t.markup="~~",t.content="",e.tokens[s.token-1].type==="text"&&e.tokens[s.token-1].content==="~"&&n.push(s.token-1)}for(;n.length;){const i=n.pop();let o=i+1;for(;o<e.tokens.length&&e.tokens[o].type==="s_close";)o++;o--,i!==o&&(t=e.tokens[o],e.tokens[o]=e.tokens[i],e.tokens[i]=t)}}function Oi(e){const u=e.tokens_meta,t=e.tokens_meta.length;bn(e,e.delimiters);for(let n=0;n<t;n++)u[n]&&u[n].delimiters&&bn(e,u[n].delimiters)}const mn={tokenize:zi,postProcess:Oi};function Pi(e,u){const t=e.pos,n=e.src.charCodeAt(t);if(u||n!==95&&n!==42)return!1;const r=e.scanDelims(e.pos,n===42);for(let i=0;i<r.length;i++){const o=e.push("text","",0);o.content=String.fromCharCode(n),e.delimiters.push({marker:n,length:r.length,token:e.tokens.length-1,end:-1,open:r.can_open,close:r.can_close})}return e.pos+=r.length,!0}function gn(e,u){const t=u.length;for(let n=t-1;n>=0;n--){const r=u[n];if(r.marker!==95&&r.marker!==42||r.end===-1)continue;const i=u[r.end],o=n>0&&u[n-1].end===r.end+1&&u[n-1].marker===r.marker&&u[n-1].token===r.token-1&&u[r.end+1].token===i.token+1,s=String.fromCharCode(r.marker),a=e.tokens[r.token];a.type=o?"strong_open":"em_open",a.tag=o?"strong":"em",a.nesting=1,a.markup=o?s+s:s,a.content="";const l=e.tokens[i.token];l.type=o?"strong_close":"em_close",l.tag=o?"strong":"em",l.nesting=-1,l.markup=o?s+s:s,l.content="",o&&(e.tokens[u[n-1].token].content="",e.tokens[u[r.end+1].token].content="",n--)}}function Ni(e){const u=e.tokens_meta,t=e.tokens_meta.length;gn(e,e.delimiters);for(let n=0;n<t;n++)u[n]&&u[n].delimiters&&gn(e,u[n].delimiters)}const xn={tokenize:Pi,postProcess:Ni};function Bi(e,u){let t,n,r,i,o="",s="",a=e.pos,l=!0;if(e.src.charCodeAt(e.pos)!==91)return!1;const d=e.pos,f=e.posMax,m=e.pos+1,b=e.md.helpers.parseLinkLabel(e,e.pos,!0);if(b<0)return!1;let p=b+1;if(p<f&&e.src.charCodeAt(p)===40){for(l=!1,p++;p<f&&(t=e.src.charCodeAt(p),!(!L(t)&&t!==10));p++);if(p>=f)return!1;if(a=p,r=e.md.helpers.parseLinkDestination(e.src,p,e.posMax),r.ok){for(o=e.md.normalizeLink(r.str),e.md.validateLink(o)?p=r.pos:o="",a=p;p<f&&(t=e.src.charCodeAt(p),!(!L(t)&&t!==10));p++);if(r=e.md.helpers.parseLinkTitle(e.src,p,e.posMax),p<f&&a!==p&&r.ok)for(s=r.str,p=r.pos;p<f&&(t=e.src.charCodeAt(p),!(!L(t)&&t!==10));p++);}(p>=f||e.src.charCodeAt(p)!==41)&&(l=!0),p++}if(l){if(typeof e.env.references>"u")return!1;if(p<f&&e.src.charCodeAt(p)===91?(a=p+1,p=e.md.helpers.parseLinkLabel(e,p),p>=0?n=e.src.slice(a,p++):p=b+1):p=b+1,n||(n=e.src.slice(m,b)),i=e.env.references[gu(n)],!i)return e.pos=d,!1;o=i.href,s=i.title}if(!u){e.pos=m,e.posMax=b;const k=e.push("link_open","a",1),w=[["href",o]];k.attrs=w,s&&w.push(["title",s]),e.linkLevel++,e.md.inline.tokenize(e),e.linkLevel--,e.push("link_close","a",-1)}return e.pos=p,e.posMax=f,!0}function $i(e,u){let t,n,r,i,o,s,a,l,d="";const f=e.pos,m=e.posMax;if(e.src.charCodeAt(e.pos)!==33||e.src.charCodeAt(e.pos+1)!==91)return!1;const b=e.pos+2,p=e.md.helpers.parseLinkLabel(e,e.pos+1,!1);if(p<0)return!1;if(i=p+1,i<m&&e.src.charCodeAt(i)===40){for(i++;i<m&&(t=e.src.charCodeAt(i),!(!L(t)&&t!==10));i++);if(i>=m)return!1;for(l=i,s=e.md.helpers.parseLinkDestination(e.src,i,e.posMax),s.ok&&(d=e.md.normalizeLink(s.str),e.md.validateLink(d)?i=s.pos:d=""),l=i;i<m&&(t=e.src.charCodeAt(i),!(!L(t)&&t!==10));i++);if(s=e.md.helpers.parseLinkTitle(e.src,i,e.posMax),i<m&&l!==i&&s.ok)for(a=s.str,i=s.pos;i<m&&(t=e.src.charCodeAt(i),!(!L(t)&&t!==10));i++);else a="";if(i>=m||e.src.charCodeAt(i)!==41)return e.pos=f,!1;i++}else{if(typeof e.env.references>"u")return!1;if(i<m&&e.src.charCodeAt(i)===91?(l=i+1,i=e.md.helpers.parseLinkLabel(e,i),i>=0?r=e.src.slice(l,i++):i=p+1):i=p+1,r||(r=e.src.slice(b,p)),o=e.env.references[gu(r)],!o)return e.pos=f,!1;d=o.href,a=o.title}if(!u){n=e.src.slice(b,p);const k=[];e.md.inline.parse(n,e.md,e.env,k);const w=e.push("image","img",0),C=[["src",d],["alt",""]];w.attrs=C,w.children=k,w.content=n,a&&C.push(["title",a])}return e.pos=i,e.posMax=m,!0}const qi=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,Ui=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function Hi(e,u){let t=e.pos;if(e.src.charCodeAt(t)!==60)return!1;const n=e.pos,r=e.posMax;for(;;){if(++t>=r)return!1;const o=e.src.charCodeAt(t);if(o===60)return!1;if(o===62)break}const i=e.src.slice(n+1,t);if(Ui.test(i)){const o=e.md.normalizeLink(i);if(!e.md.validateLink(o))return!1;if(!u){const s=e.push("link_open","a",1);s.attrs=[["href",o]],s.markup="autolink",s.info="auto";const a=e.push("text","",0);a.content=e.md.normalizeLinkText(i);const l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=i.length+2,!0}if(qi.test(i)){const o=e.md.normalizeLink("mailto:"+i);if(!e.md.validateLink(o))return!1;if(!u){const s=e.push("link_open","a",1);s.attrs=[["href",o]],s.markup="autolink",s.info="auto";const a=e.push("text","",0);a.content=e.md.normalizeLinkText(i);const l=e.push("link_close","a",-1);l.markup="autolink",l.info="auto"}return e.pos+=i.length+2,!0}return!1}function ji(e){return/^<a[>\s]/i.test(e)}function Wi(e){return/^<\/a\s*>/i.test(e)}function Gi(e){const u=e|32;return u>=97&&u<=122}function Vi(e,u){if(!e.md.options.html)return!1;const t=e.posMax,n=e.pos;if(e.src.charCodeAt(n)!==60||n+2>=t)return!1;const r=e.src.charCodeAt(n+1);if(r!==33&&r!==63&&r!==47&&!Gi(r))return!1;const i=e.src.slice(n).match(Ei);if(!i)return!1;if(!u){const o=e.push("html_inline","",0);o.content=i[0],ji(o.content)&&e.linkLevel++,Wi(o.content)&&e.linkLevel--}return e.pos+=i[0].length,!0}const Zi=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,Yi=/^&([a-z][a-z0-9]{1,31});/i;function Xi(e,u){const t=e.pos,n=e.posMax;if(e.src.charCodeAt(t)!==38||t+1>=n)return!1;if(e.src.charCodeAt(t+1)===35){const i=e.src.slice(t).match(Zi);if(i){if(!u){const o=i[1][0].toLowerCase()==="x"?parseInt(i[1].slice(1),16):parseInt(i[1],10),s=e.push("text_special","",0);s.content=Zu(o)?uu(o):uu(65533),s.markup=i[0],s.info="entity"}return e.pos+=i[0].length,!0}}else{const i=e.src.slice(t).match(Yi);if(i){const o=y0(i[0]);if(o!==i[0]){if(!u){const s=e.push("text_special","",0);s.content=o,s.markup=i[0],s.info="entity"}return e.pos+=i[0].length,!0}}}return!1}function _n(e){const u={},t=e.length;if(!t)return;let n=0,r=-2;const i=[];for(let o=0;o<t;o++){const s=e[o];if(i.push(0),(e[n].marker!==s.marker||r!==s.token-1)&&(n=o),r=s.token,s.length=s.length||0,!s.close)continue;u.hasOwnProperty(s.marker)||(u[s.marker]=[-1,-1,-1,-1,-1,-1]);const a=u[s.marker][(s.open?3:0)+s.length%3];let l=n-i[n]-1,d=l;for(;l>a;l-=i[l]+1){const f=e[l];if(f.marker===s.marker&&f.open&&f.end<0){let m=!1;if((f.close||s.open)&&(f.length+s.length)%3===0&&(f.length%3!==0||s.length%3!==0)&&(m=!0),!m){const b=l>0&&!e[l-1].open?i[l-1]+1:0;i[o]=o-l+b,i[l]=b,s.open=!1,f.end=o,f.close=!1,d=-1,r=-2;break}}}d!==-1&&(u[s.marker][(s.open?3:0)+(s.length||0)%3]=d)}}function Ji(e){const u=e.tokens_meta,t=e.tokens_meta.length;_n(e.delimiters);for(let n=0;n<t;n++)u[n]&&u[n].delimiters&&_n(u[n].delimiters)}function Ki(e){let u,t,n=0;const r=e.tokens,i=e.tokens.length;for(u=t=0;u<i;u++)r[u].nesting<0&&n--,r[u].level=n,r[u].nesting>0&&n++,r[u].type==="text"&&u+1<i&&r[u+1].type==="text"?r[u+1].content=r[u].content+r[u+1].content:(u!==t&&(r[t]=r[u]),t++);u!==t&&(r.length=t)}const Qu=[["text",Si],["linkify",Ri],["newline",Ii],["escape",Li],["backticks",Mi],["strikethrough",mn.tokenize],["emphasis",xn.tokenize],["link",Bi],["image",$i],["autolink",Hi],["html_inline",Vi],["entity",Xi]],et=[["balance_pairs",Ji],["strikethrough",mn.postProcess],["emphasis",xn.postProcess],["fragments_join",Ki]];function ou(){this.ruler=new ee;for(let e=0;e<Qu.length;e++)this.ruler.push(Qu[e][0],Qu[e][1]);this.ruler2=new ee;for(let e=0;e<et.length;e++)this.ruler2.push(et[e][0],et[e][1])}ou.prototype.skipToken=function(e){const u=e.pos,t=this.ruler.getRules(""),n=t.length,r=e.md.options.maxNesting,i=e.cache;if(typeof i[u]<"u"){e.pos=i[u];return}let o=!1;if(e.level<r){for(let s=0;s<n;s++)if(e.level++,o=t[s](e,!0),e.level--,o){if(u>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}else e.pos=e.posMax;o||e.pos++,i[u]=e.pos},ou.prototype.tokenize=function(e){const u=this.ruler.getRules(""),t=u.length,n=e.posMax,r=e.md.options.maxNesting;for(;e.pos<n;){const i=e.pos;let o=!1;if(e.level<r){for(let s=0;s<t;s++)if(o=u[s](e,!1),o){if(i>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}if(o){if(e.pos>=n)break;continue}e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()},ou.prototype.parse=function(e,u,t,n){const r=new this.State(e,u,t,n);this.tokenize(r);const i=this.ruler2.getRules(""),o=i.length;for(let s=0;s<o;s++)i[s](r)},ou.prototype.State=iu;function Qi(e){const u={};e=e||{},u.src_Any=Yt.source,u.src_Cc=Xt.source,u.src_Z=Kt.source,u.src_P=ju.source,u.src_ZPCc=[u.src_Z,u.src_P,u.src_Cc].join("|"),u.src_ZCc=[u.src_Z,u.src_Cc].join("|");const t="[><｜]";return u.src_pseudo_letter=`(?:(?!${t}|${u.src_ZPCc})${u.src_Any})`,u.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",u.src_auth=`(?:(?:(?!${u.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`,u.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",u.src_host_terminator=`(?=$|${t}|${u.src_ZPCc})(?!${e["---"]?"-(?!--)|":"-|"}_|:\\d|\\.-|\\.(?!$|${u.src_ZPCc}))`,u.src_path=`(?:[/?#](?:(?!${u.src_ZCc}|${t}|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!${u.src_ZCc}|\\]).)*\\]|\\((?:(?!${u.src_ZCc}|[)]).)*\\)|\\{(?:(?!${u.src_ZCc}|[}]).)*\\}|\\"(?:(?!${u.src_ZCc}|["]).)+\\"|\\'(?:(?!${u.src_ZCc}|[']).)+\\'|\\'(?=${u.src_pseudo_letter}|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!${u.src_ZCc}|[.]|$)|`+(e["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+`,(?!${u.src_ZCc}|$)|;(?!${u.src_ZCc}|$)|\\!+(?!${u.src_ZCc}|[!]|$)|\\?(?!${u.src_ZCc}|[?]|$))+|\\/)?`,u.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]{0,63}',u.src_xn="xn--[a-z0-9\\-]{1,59}",u.src_domain_root="(?:"+u.src_xn+`|${u.src_pseudo_letter}{1,63})`,u.src_domain="(?:"+u.src_xn+`|(?:${u.src_pseudo_letter})|(?:${u.src_pseudo_letter}(?:-|${u.src_pseudo_letter}){0,61}${u.src_pseudo_letter}))`,u.src_host=`(?:(?:(?:(?:${u.src_domain})\\.)*${u.src_domain}))`,u.tpl_host_fuzzy="(?:"+u.src_ip4+`|(?:(?:(?:${u.src_domain})\\.)+(?:%TLDS%)))`,u.tpl_host_no_ip_fuzzy=`(?:(?:(?:${u.src_domain})\\.)+(?:%TLDS%))`,u.src_host_strict=u.src_host+u.src_host_terminator,u.tpl_host_fuzzy_strict=u.tpl_host_fuzzy+u.src_host_terminator,u.src_host_port_strict=u.src_host+u.src_port+u.src_host_terminator,u.tpl_host_port_fuzzy_strict=u.tpl_host_fuzzy+u.src_port+u.src_host_terminator,u.tpl_host_port_no_ip_fuzzy_strict=u.tpl_host_no_ip_fuzzy+u.src_port+u.src_host_terminator,u.tpl_host_fuzzy_test=`localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:${u.src_ZPCc}|>|$))`,u.tpl_email_fuzzy=`(^|${t}|"|\\(|${u.src_ZCc})(${u.src_email_name}@${u.tpl_host_fuzzy_strict})`,u.tpl_link_fuzzy=`(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${u.src_ZPCc}))((?![$+<=>^\`|｜])${u.tpl_host_port_fuzzy_strict}${u.src_path})`,u.tpl_link_no_ip_fuzzy=`(^|(?![.:/\\-_@])(?:[$+<=>^\`|｜]|${u.src_ZPCc}))((?![$+<=>^\`|｜])${u.tpl_host_port_no_ip_fuzzy_strict}${u.src_path})`,u}function ut(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){t&&Object.keys(t).forEach(function(n){e[n]=t[n]})}),e}function Eu(e){return Object.prototype.toString.call(e)}function eo(e){return Eu(e)==="[object String]"}function uo(e){return Eu(e)==="[object Object]"}function to(e){return Eu(e)==="[object RegExp]"}function yn(e){return Eu(e)==="[object Function]"}function no(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}const kn={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function ro(e){return Object.keys(e||{}).reduce(function(u,t){return u||kn.hasOwnProperty(t)},!1)}const io={"http:":{validate:function(e,u,t){const n=e.slice(u);return t.re.http||(t.re.http=new RegExp(`^\\/\\/${t.re.src_auth}${t.re.src_host_port_strict}${t.re.src_path}`,"i")),t.re.http.test(n)?n.match(t.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(e,u,t){const n=e.slice(u);return t.re.no_http||(t.re.no_http=new RegExp("^"+t.re.src_auth+`(?:localhost|(?:(?:${t.re.src_domain})\\.)+${t.re.src_domain_root})`+t.re.src_port+t.re.src_host_terminator+t.re.src_path,"i")),t.re.no_http.test(n)?u>=3&&e[u-3]===":"||u>=3&&e[u-3]==="/"?0:n.match(t.re.no_http)[0].length:0}},"mailto:":{validate:function(e,u,t){const n=e.slice(u);return t.re.mailto||(t.re.mailto=new RegExp(`^${t.re.src_email_name}@${t.re.src_host_strict}`,"i")),t.re.mailto.test(n)?n.match(t.re.mailto)[0].length:0}}},oo="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",so="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф".split("|");function ao(e){return function(u,t){const n=u.slice(t);return e.test(n)?n.match(e)[0].length:0}}function En(){return function(e,u){u.normalize(e)}}function wu(e){const u=e.re=Qi(e.__opts__),t=e.__tlds__.slice();e.onCompile(),e.__tlds_replaced__||t.push(oo),t.push(u.src_xn),u.src_tlds=t.join("|");function n(s){return s.replace("%TLDS%",u.src_tlds)}u.email_fuzzy=RegExp(n(u.tpl_email_fuzzy),"i"),u.email_fuzzy_global=RegExp(n(u.tpl_email_fuzzy),"ig"),u.link_fuzzy=RegExp(n(u.tpl_link_fuzzy),"i"),u.link_fuzzy_global=RegExp(n(u.tpl_link_fuzzy),"ig"),u.link_no_ip_fuzzy=RegExp(n(u.tpl_link_no_ip_fuzzy),"i"),u.link_no_ip_fuzzy_global=RegExp(n(u.tpl_link_no_ip_fuzzy),"ig"),u.host_fuzzy_test=RegExp(n(u.tpl_host_fuzzy_test),"i");const r=[];e.__compiled__={};function i(s,a){throw new Error(`(LinkifyIt) Invalid schema "${s}": ${a}`)}Object.keys(e.__schemas__).forEach(function(s){const a=e.__schemas__[s];if(a===null)return;const l={validate:null,link:null};if(e.__compiled__[s]=l,uo(a)){to(a.validate)?l.validate=ao(a.validate):yn(a.validate)?l.validate=a.validate:i(s,a),yn(a.normalize)?l.normalize=a.normalize:a.normalize?i(s,a):l.normalize=En();return}if(eo(a)){r.push(s);return}i(s,a)}),r.forEach(function(s){e.__compiled__[e.__schemas__[s]]&&(e.__compiled__[s].validate=e.__compiled__[e.__schemas__[s]].validate,e.__compiled__[s].normalize=e.__compiled__[e.__schemas__[s]].normalize)}),e.__compiled__[""]={validate:null,normalize:En()};const o=Object.keys(e.__compiled__).filter(function(s){return s.length>0&&e.__compiled__[s]}).map(no).join("|");e.re.schema_test=RegExp(`(^|(?!_)(?:[><｜]|${u.src_ZPCc}))(${o})`,"i"),e.re.schema_search=RegExp(`(^|(?!_)(?:[><｜]|${u.src_ZPCc}))(${o})`,"ig"),e.re.schema_at_start=RegExp(`^${e.re.schema_search.source}`,"i"),e.re.pretest=RegExp(`(${e.re.schema_test.source})|(${e.re.host_fuzzy_test.source})|@`,"i")}function wn(e,u,t,n){const r=e.slice(t,n);this.schema=u.toLowerCase(),this.index=t,this.lastIndex=n,this.raw=r,this.text=r,this.url=r}function re(e,u){if(!(this instanceof re))return new re(e,u);u||ro(e)&&(u=e,e={}),this.__opts__=ut({},kn,u),this.__schemas__=ut({},io,e),this.__compiled__={},this.__tlds__=so,this.__tlds_replaced__=!1,this.re={},wu(this)}re.prototype.add=function(u,t){return this.__schemas__[u]=t,wu(this),this},re.prototype.set=function(u){return this.__opts__=ut(this.__opts__,u),this},re.prototype.test=function(u){if(!u.length)return!1;let t,n;if(this.re.schema_test.test(u)){for(n=this.re.schema_search,n.lastIndex=0;(t=n.exec(u))!==null;)if(this.testSchemaAt(u,t[2],n.lastIndex))return!0}return!!(this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&u.search(this.re.host_fuzzy_test)>=0&&u.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy)!==null||this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&u.indexOf("@")>=0&&u.match(this.re.email_fuzzy)!==null)},re.prototype.pretest=function(u){return this.re.pretest.test(u)},re.prototype.testSchemaAt=function(u,t,n){return this.__compiled__[t.toLowerCase()]?this.__compiled__[t.toLowerCase()].validate(u,n,this):0},re.prototype.match=function(u){const t=[],n=[],r=[],i=[];let o,s,a;function l(m,b){return m?b?m.index!==b.index?m.index<b.index?m:b:m.lastIndex>=b.lastIndex?m:b:m:b}if(!u.length)return null;if(this.re.schema_test.test(u))for(a=this.re.schema_search,a.lastIndex=0;(o=a.exec(u))!==null;)s=this.testSchemaAt(u,o[2],a.lastIndex),s&&n.push({schema:o[2],index:o.index+o[1].length,lastIndex:o.index+o[0].length+s});if(this.__opts__.fuzzyLink&&this.__compiled__["http:"])for(a=this.__opts__.fuzzyIP?this.re.link_fuzzy_global:this.re.link_no_ip_fuzzy_global,a.lastIndex=0;(o=a.exec(u))!==null;)r.push({schema:"",index:o.index+o[1].length,lastIndex:o.index+o[0].length});if(this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"])for(a=this.re.email_fuzzy_global,a.lastIndex=0;(o=a.exec(u))!==null;)i.push({schema:"mailto:",index:o.index+o[1].length,lastIndex:o.index+o[0].length});const d=[0,0,0];let f=0;for(;;){const m=[n[d[0]],i[d[1]],r[d[2]]],b=l(l(m[0],m[1]),m[2]);if(!b)break;if(b===m[0]?d[0]++:b===m[1]?d[1]++:d[2]++,b.index<f)continue;const p=new wn(u,b.schema,b.index,b.lastIndex);this.__compiled__[p.schema].normalize(p,this),t.push(p),f=b.lastIndex}return t.length?t:null},re.prototype.matchAtStart=function(u){if(!u.length)return null;const t=this.re.schema_at_start.exec(u);if(!t)return null;const n=this.testSchemaAt(u,t[2],t[0].length);if(!n)return null;const r=new wn(u,t[2],t.index+t[1].length,t.index+t[0].length+n);return this.__compiled__[r.schema].normalize(r,this),r},re.prototype.tlds=function(u,t){return u=Array.isArray(u)?u:[u],t?(this.__tlds__=this.__tlds__.concat(u).sort().filter(function(n,r,i){return n!==i[r-1]}).reverse(),wu(this),this):(this.__tlds__=u.slice(),this.__tlds_replaced__=!0,wu(this),this)},re.prototype.normalize=function(u){u.schema||(u.url=`http://${u.url}`),u.schema==="mailto:"&&!/^mailto:/i.test(u.url)&&(u.url=`mailto:${u.url}`)},re.prototype.onCompile=function(){};const je=2147483647,be=36,tt=1,su=26,co=38,lo=700,An=72,Dn=128,Cn="-",fo=/^xn--/,ho=/[^\0-\x7F]/,po=/[\x2E\u3002\uFF0E\uFF61]/g,bo={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},nt=be-tt,me=Math.floor,rt=String.fromCharCode;function Te(e){throw new RangeError(bo[e])}function mo(e,u){const t=[];let n=e.length;for(;n--;)t[n]=u(e[n]);return t}function Tn(e,u){const t=e.split("@");let n="";t.length>1&&(n=t[0]+"@",e=t[1]),e=e.replace(po,".");const r=e.split("."),i=mo(r,u).join(".");return n+i}function Fn(e){const u=[];let t=0;const n=e.length;for(;t<n;){const r=e.charCodeAt(t++);if(r>=55296&&r<=56319&&t<n){const i=e.charCodeAt(t++);(i&64512)==56320?u.push(((r&1023)<<10)+(i&1023)+65536):(u.push(r),t--)}else u.push(r)}return u}const go=e=>String.fromCodePoint(...e),xo=function(e){return e>=48&&e<58?26+(e-48):e>=65&&e<91?e-65:e>=97&&e<123?e-97:be},Sn=function(e,u){return e+22+75*(e<26)-((u!=0)<<5)},vn=function(e,u,t){let n=0;for(e=t?me(e/lo):e>>1,e+=me(e/u);e>nt*su>>1;n+=be)e=me(e/nt);return me(n+(nt+1)*e/(e+co))},Rn=function(e){const u=[],t=e.length;let n=0,r=Dn,i=An,o=e.lastIndexOf(Cn);o<0&&(o=0);for(let s=0;s<o;++s)e.charCodeAt(s)>=128&&Te("not-basic"),u.push(e.charCodeAt(s));for(let s=o>0?o+1:0;s<t;){const a=n;for(let d=1,f=be;;f+=be){s>=t&&Te("invalid-input");const m=xo(e.charCodeAt(s++));m>=be&&Te("invalid-input"),m>me((je-n)/d)&&Te("overflow"),n+=m*d;const b=f<=i?tt:f>=i+su?su:f-i;if(m<b)break;const p=be-b;d>me(je/p)&&Te("overflow"),d*=p}const l=u.length+1;i=vn(n-a,l,a==0),me(n/l)>je-r&&Te("overflow"),r+=me(n/l),n%=l,u.splice(n++,0,r)}return String.fromCodePoint(...u)},In=function(e){const u=[];e=Fn(e);const t=e.length;let n=Dn,r=0,i=An;for(const a of e)a<128&&u.push(rt(a));const o=u.length;let s=o;for(o&&u.push(Cn);s<t;){let a=je;for(const d of e)d>=n&&d<a&&(a=d);const l=s+1;a-n>me((je-r)/l)&&Te("overflow"),r+=(a-n)*l,n=a;for(const d of e)if(d<n&&++r>je&&Te("overflow"),d===n){let f=r;for(let m=be;;m+=be){const b=m<=i?tt:m>=i+su?su:m-i;if(f<b)break;const p=f-b,k=be-b;u.push(rt(Sn(b+p%k,0))),f=me(p/k)}u.push(rt(Sn(f,0))),i=vn(r,l,s===o),r=0,++s}++r,++n}return u.join("")},Ln={version:"2.3.1",ucs2:{decode:Fn,encode:go},decode:Rn,encode:In,toASCII:function(e){return Tn(e,function(u){return ho.test(u)?"xn--"+In(u):u})},toUnicode:function(e){return Tn(e,function(u){return fo.test(u)?Rn(u.slice(4).toLowerCase()):u})}},_o={default:{options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}},zero:{options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","fragments_join"]}}},commonmark:{options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"“”‘’",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","fragments_join"]}}}},yo=/^(vbscript|javascript|file|data):/,ko=/^data:image\/(gif|png|jpeg|webp);/;function Eo(e){const u=e.trim().toLowerCase();return yo.test(u)?ko.test(u):!0}const Mn=["http:","https:","mailto:"];function wo(e){const u=Hu(e,!0);if(u.hostname&&(!u.protocol||Mn.indexOf(u.protocol)>=0))try{u.hostname=Ln.toASCII(u.hostname)}catch{}return eu(Uu(u))}function Ao(e){const u=Hu(e,!0);if(u.hostname&&(!u.protocol||Mn.indexOf(u.protocol)>=0))try{u.hostname=Ln.toUnicode(u.hostname)}catch{}return qe(Uu(u),qe.defaultChars+"%")}function ie(e,u){if(!(this instanceof ie))return new ie(e,u);u||Vu(e)||(u=e||{},e="default"),this.inline=new ou,this.block=new ku,this.core=new Xu,this.renderer=new He,this.linkify=new re,this.validateLink=Eo,this.normalizeLink=wo,this.normalizeLinkText=Ao,this.utils=z0,this.helpers=mu({},B0),this.options={},this.configure(e),u&&this.set(u)}ie.prototype.set=function(e){return mu(this.options,e),this},ie.prototype.configure=function(e){const u=this;if(Vu(e)){const t=e;if(e=_o[t],!e)throw new Error('Wrong `markdown-it` preset "'+t+'", check name')}if(!e)throw new Error("Wrong `markdown-it` preset, can't be empty");return e.options&&u.set(e.options),e.components&&Object.keys(e.components).forEach(function(t){e.components[t].rules&&u[t].ruler.enableOnly(e.components[t].rules),e.components[t].rules2&&u[t].ruler2.enableOnly(e.components[t].rules2)}),this},ie.prototype.enable=function(e,u){let t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(r){t=t.concat(this[r].ruler.enable(e,!0))},this),t=t.concat(this.inline.ruler2.enable(e,!0));const n=e.filter(function(r){return t.indexOf(r)<0});if(n.length&&!u)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+n);return this},ie.prototype.disable=function(e,u){let t=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(r){t=t.concat(this[r].ruler.disable(e,!0))},this),t=t.concat(this.inline.ruler2.disable(e,!0));const n=e.filter(function(r){return t.indexOf(r)<0});if(n.length&&!u)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+n);return this},ie.prototype.use=function(e){const u=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,u),this},ie.prototype.parse=function(e,u){if(typeof e!="string")throw new Error("Input data should be a String");const t=new this.core.State(e,this,u);return this.core.process(t),t.tokens},ie.prototype.render=function(e,u){return u=u||{},this.renderer.render(this.parse(e,u),this.options,u)},ie.prototype.parseInline=function(e,u){const t=new this.core.State(e,this,u);return t.inlineMode=!0,this.core.process(t),t.tokens},ie.prototype.renderInline=function(e,u){return u=u||{},this.renderer.render(this.parseInline(e,u),this.options,u)};const au=new ie({html:!1,linkify:!0,breaks:!0,typographer:!1}),Do=au.renderer.rules.link_open??((e,u,t,n,r)=>r.renderToken(e,u,t));au.renderer.rules.link_open=(e,u,t,n,r)=>{const i=e[u];return i.attrSet("target","_blank"),i.attrSet("rel","noopener noreferrer"),Do(e,u,t,n,r)},au.renderer.rules.image=(e,u)=>au.utils.escapeHtml(e[u].content);const Co={ALLOWED_TAGS:["a","blockquote","br","code","em","h1","h2","h3","h4","h5","h6","hr","li","ol","p","pre","s","strong","table","tbody","td","th","thead","tr","ul"],ALLOWED_ATTR:["class","href","rel","start","target","title"],ALLOW_ARIA_ATTR:!1,ALLOW_DATA_ATTR:!1,RETURN_TRUSTED_TYPE:!1};let zn;function On(e){const u=au.render(e),t=To();return t?t.sanitize(u,Co):u}function To(){if(!(typeof window>"u"))return zn??(zn=Zr(window)),zn}const Fo=`
:host {
  --eag-bg: #ffffff;
  --eag-surface: #f7f9fc;
  --eag-text: #172033;
  --eag-muted: #667085;
  --eag-border: #e7ebf2;
  --eag-primary: #2563eb;
  --eag-primary-hover: #1d4ed8;
  --eag-user-bg: #2563eb;
  --eag-user-text: #ffffff;
  --eag-agent-bg: #f0f4fa;
  --eag-code-bg: #111827;
  --eag-code-text: #e5e7eb;
  --eag-inline-code-bg: rgb(15 23 42 / 8%);
  --eag-launcher-gap: 28px;
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  width: 0;
  height: 0;
  color: var(--eag-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  pointer-events: none;
}

:host([theme="dark"]) {
  --eag-bg: #101828;
  --eag-surface: #182230;
  --eag-text: #f8fafc;
  --eag-muted: #98a2b3;
  --eag-border: #344054;
  --eag-agent-bg: #253044;
  --eag-inline-code-bg: rgb(255 255 255 / 10%);
}

* {
  box-sizing: border-box;
}

button,
input,
textarea {
  font: inherit;
}

svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.launcher {
  position: fixed;
  right: var(--eag-launcher-gap);
  bottom: var(--eag-launcher-gap);
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  padding: 0;
  color: #fff;
  cursor: grab;
  background: linear-gradient(145deg, #3b82f6 0%, #1d4ed8 58%, #1e40af 100%);
  border: 0;
  border-radius: 50%;
  box-shadow: 0 14px 32px rgb(37 99 235 / 36%), 0 3px 8px rgb(15 23 42 / 18%);
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  transition:
    left 240ms cubic-bezier(.2, .8, .2, 1),
    transform 160ms ease,
    box-shadow 160ms ease;
}

.launcher::after {
  content: "";
  position: absolute;
  inset: -5px;
  border: 1px solid rgb(59 130 246 / 22%);
  border-radius: 50%;
}

.launcher:not(.launcher--dragging):hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 18px 38px rgb(37 99 235 / 40%), 0 4px 10px rgb(15 23 42 / 20%);
}

.launcher--dragging {
  cursor: grabbing;
  transform: none;
  transition: none;
}

.launcher:focus-visible,
.icon-button:focus-visible,
.send-button:focus-visible,
.scroll-latest:focus-visible,
.input:focus-visible {
  outline: 3px solid rgb(59 130 246 / 24%);
  outline-offset: 2px;
}

.launcher svg {
  width: 27px;
  height: 27px;
  stroke-width: 1.7;
}

.launcher .icon-dots {
  stroke-width: 3;
}

.panel {
  position: fixed;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  color: var(--eag-text);
  background: var(--eag-bg);
  pointer-events: auto;
}

.panel--drawer {
  top: 0;
  right: 0;
  bottom: 0;
  width: min(430px, 100vw);
  border-left: 1px solid var(--eag-border);
  box-shadow: -18px 0 48px rgb(15 23 42 / 15%);
}

.panel--window {
  right: 28px;
  bottom: 98px;
  width: min(430px, calc(100vw - 32px));
  height: min(650px, calc(100vh - 122px));
  border: 1px solid var(--eag-border);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 22%), 0 4px 18px rgb(15 23 42 / 10%);
}

.panel--resizing {
  border-color: color-mix(in srgb, var(--eag-primary) 58%, var(--eag-border));
  user-select: none;
}

.resize-handle {
  position: absolute;
  z-index: 5;
  display: block;
  touch-action: none;
}

.panel--drawer .resize-handle--w {
  top: 0;
  bottom: 0;
  left: 0;
  width: 10px;
  cursor: ew-resize;
}

.panel--drawer .resize-handle--w::after {
  content: "";
  position: absolute;
  top: 50%;
  bottom: auto;
  left: 2px;
  width: 3px;
  height: 48px;
  background: var(--eag-primary);
  border-radius: 999px;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity 120ms ease;
}

.panel--drawer .resize-handle--w:hover::after {
  opacity: .45;
}

.panel--window .resize-handle--n,
.panel--window .resize-handle--s {
  right: 12px;
  left: 12px;
  height: 8px;
  cursor: ns-resize;
}

.panel--window .resize-handle--n { top: 0; }
.panel--window .resize-handle--s { bottom: 0; }

.panel--window .resize-handle--e,
.panel--window .resize-handle--w {
  top: 12px;
  bottom: 12px;
  width: 8px;
  cursor: ew-resize;
}

.panel--window .resize-handle--e { right: 0; }
.panel--window .resize-handle--w { left: 0; }

.panel--window .resize-handle--ne,
.panel--window .resize-handle--nw,
.panel--window .resize-handle--se,
.panel--window .resize-handle--sw {
  width: 14px;
  height: 14px;
}

.panel--window .resize-handle--ne,
.panel--window .resize-handle--sw {
  cursor: nesw-resize;
}

.panel--window .resize-handle--nw,
.panel--window .resize-handle--se {
  cursor: nwse-resize;
}

.panel--window .resize-handle--ne { top: 0; right: 0; }
.panel--window .resize-handle--nw { top: 0; left: 0; }
.panel--window .resize-handle--se { right: 0; bottom: 0; }
.panel--window .resize-handle--sw { bottom: 0; left: 0; }

.panel--drawer.panel--enter {
  animation: drawer-in 200ms ease-out;
}

.panel--window.panel--enter {
  animation: window-in 160ms ease-out;
}

@keyframes drawer-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes window-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.header {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px 12px 16px;
  background: color-mix(in srgb, var(--eag-bg) 92%, transparent);
  border-bottom: 1px solid var(--eag-border);
  user-select: none;
  touch-action: none;
}

.panel--window .header {
  cursor: move;
}

.header__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
}

.header__mark {
  width: 38px;
  height: 38px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #fff;
  background: linear-gradient(145deg, #3b82f6, #1d4ed8);
  border-radius: 11px;
  box-shadow: 0 7px 18px rgb(37 99 235 / 24%);
}

.header__mark svg {
  width: 21px;
  height: 21px;
  fill: currentColor;
  stroke: none;
}

.header__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--eag-muted);
  font-size: 12px;
  line-height: 1;
}

.status i {
  width: 7px;
  height: 7px;
  background: currentColor;
  border-radius: 50%;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 12%, transparent);
}

.status--ready {
  color: #16a34a;
}

.status--loading {
  color: #d97706;
}

.status--loading i {
  animation: status-pulse 1.2s ease-in-out infinite;
}

.status--error {
  color: #dc2626;
}

@keyframes status-pulse {
  50% { opacity: .35; transform: scale(.78); }
}

.header__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--eag-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.icon-button:hover {
  color: var(--eag-text);
  background: var(--eag-surface);
}

.icon-button svg {
  width: 18px;
  height: 18px;
}

.messages-shell {
  position: relative;
  min-height: 0;
  overflow: hidden;
}

.messages {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 18px;
  overflow: auto;
  overscroll-behavior: contain;
  background:
    radial-gradient(circle at 100% 0, rgb(59 130 246 / 6%), transparent 32%),
    var(--eag-bg);
}

.scroll-latest {
  position: absolute;
  right: 16px;
  bottom: 14px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--eag-primary);
  cursor: pointer;
  background: var(--eag-bg);
  border: 1px solid var(--eag-border);
  border-radius: 50%;
  box-shadow: 0 8px 20px rgb(15 23 42 / 16%);
}

.scroll-latest[hidden] {
  display: none;
}

.scroll-latest:hover {
  background: var(--eag-surface);
}

.scroll-latest svg {
  width: 18px;
  height: 18px;
}

.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-thumb {
  background: rgb(148 163 184 / 44%);
  border-radius: 999px;
}

.empty {
  max-width: 280px;
  display: grid;
  justify-items: center;
  gap: 9px;
  margin: auto;
  color: var(--eag-muted);
  font-size: 13px;
  line-height: 1.65;
  text-align: center;
}

.empty strong {
  color: var(--eag-text);
  font-size: 16px;
}

.empty__icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  margin-bottom: 4px;
  color: var(--eag-primary);
  background: rgb(37 99 235 / 9%);
  border-radius: 16px;
}

.empty__icon svg {
  width: 27px;
  height: 27px;
  fill: currentColor;
  stroke: none;
}

.message-row {
  display: flex;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message {
  max-width: 86%;
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
}

.message.user {
  color: var(--eag-user-text);
  background: var(--eag-user-bg);
  border-bottom-right-radius: 4px;
  box-shadow: 0 5px 14px rgb(37 99 235 / 16%);
  white-space: pre-wrap;
}

.message.assistant {
  background: var(--eag-agent-bg);
  border-bottom-left-radius: 4px;
  white-space: normal;
}

.message__content {
  min-width: 0;
}

.message__content--text {
  white-space: pre-wrap;
}

.markdown-body > :first-child {
  margin-top: 0;
}

.markdown-body > :last-child {
  margin-bottom: 0;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body pre,
.markdown-body table,
.markdown-body hr {
  margin: 0 0 0.8em;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 1em 0 0.45em;
  color: inherit;
  font-weight: 700;
  line-height: 1.35;
}

.markdown-body h1 { font-size: 1.35em; }
.markdown-body h2 { font-size: 1.22em; }
.markdown-body h3 { font-size: 1.12em; }
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 { font-size: 1em; }

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.45em;
}

.markdown-body li + li {
  margin-top: 0.25em;
}

.markdown-body li > p {
  margin: 0.25em 0;
}

.markdown-body blockquote {
  padding: 0.35em 0.8em;
  color: var(--eag-muted);
  border-left: 3px solid var(--eag-primary);
}

.markdown-body a {
  color: var(--eag-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.markdown-body code {
  padding: 0.12em 0.35em;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.9em;
  background: var(--eag-inline-code-bg);
  border-radius: 4px;
}

.markdown-body pre {
  max-width: 100%;
  padding: 11px 12px;
  overflow-x: auto;
  color: var(--eag-code-text);
  background: var(--eag-code-bg);
  border-radius: 8px;
  overscroll-behavior-x: contain;
}

.markdown-body pre code {
  display: block;
  min-width: max-content;
  padding: 0;
  color: inherit;
  line-height: 1.55;
  white-space: pre;
  background: transparent;
  border-radius: 0;
}

.markdown-body table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.markdown-body th,
.markdown-body td {
  min-width: 72px;
  padding: 6px 8px;
  text-align: left;
  border: 1px solid var(--eag-border);
}

.markdown-body th {
  font-weight: 650;
  background: var(--eag-surface);
}

.markdown-body hr {
  height: 1px;
  background: var(--eag-border);
  border: 0;
}

.message--pending {
  min-width: 116px;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--eag-muted);
}

.typing__dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.typing__dots i {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  animation: typing-dot 1.1s ease-in-out infinite;
}

.typing__dots i:nth-child(2) { animation-delay: 140ms; }
.typing__dots i:nth-child(3) { animation-delay: 280ms; }

@keyframes typing-dot {
  0%, 70%, 100% { opacity: .35; transform: translateY(0); }
  35% { opacity: 1; transform: translateY(-3px); }
}

.message--error {
  color: #b42318;
  background: #fef3f2;
  border: 1px solid #fecdca;
}

:host([theme="dark"]) .message--error {
  color: #fda29b;
  background: #3b1f24;
  border-color: #7a271a;
}

.message__error {
  display: grid;
  gap: 3px;
}

.message__error strong {
  font-size: 13px;
}

.message__error span {
  color: inherit;
  font-size: 12px;
  line-height: 1.55;
  opacity: .86;
}

.message__content + .message__error {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid currentColor;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  padding: 13px 14px 14px;
  background: var(--eag-bg);
  border-top: 1px solid var(--eag-border);
}

.input {
  min-height: 42px;
  max-height: 120px;
  flex: 1;
  min-width: 0;
  padding: 10px 13px;
  overflow: hidden;
  color: var(--eag-text);
  background: var(--eag-surface);
  border: 1px solid transparent;
  border-radius: 10px;
  outline: none;
  line-height: 1.5;
  resize: none;
  transition: border-color 150ms ease, background 150ms ease;
}

.input::placeholder {
  color: #98a2b3;
}

.input:focus {
  background: var(--eag-bg);
  border-color: var(--eag-primary);
}

.send-button {
  width: 42px;
  height: 42px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: var(--eag-primary);
  border: 0;
  border-radius: 10px;
  box-shadow: 0 7px 16px rgb(37 99 235 / 22%);
}

.send-button:hover {
  background: var(--eag-primary-hover);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.send-button:disabled:hover {
  background: var(--eag-primary);
}

.send-button svg {
  width: 19px;
  height: 19px;
}

@media (max-width: 480px) {
  :host {
    --eag-launcher-gap: 18px;
  }

  .panel--window {
    right: 8px;
    bottom: 8px;
    width: calc(100vw - 16px);
    height: calc(100vh - 16px);
  }

  .composer {
    padding-bottom: max(14px, env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .launcher,
  .input,
  .panel--enter,
  .status--loading i,
  .typing__dots i {
    animation: none !important;
    transition: none !important;
  }
}
`,Pn="easy-agent-chat",So=430,Nn=320,vo=320,Ro=400,M=8,Io=28,Lo=4,Mo=typeof HTMLElement>"u"?class{}:HTMLElement;class Bn extends Mo{constructor(){var t;super();I(this,"headers",{});I(this,"messages",[]);I(this,"loading",!1);I(this,"statusText","Ready");I(this,"inputValue","");I(this,"opened",!1);I(this,"panelMode","drawer");I(this,"drawerWidth",So);I(this,"launcherPosition");I(this,"windowPosition");I(this,"windowSize");I(this,"animatePanel",!1);I(this,"requestFailed",!1);I(this,"stickToBottom",!0);I(this,"suppressLauncherClickUntil",0);I(this,"assistantRenderFrame");I(this,"handleDocumentKeyDown",t=>{var n;t.key!=="Escape"||!this.opened||!((n=this.shadowRoot)!=null&&n.activeElement)||(t.preventDefault(),this.closePanel())});I(this,"handleViewportResize",()=>{this.constrainPanelToViewport(),this.constrainLauncherToViewport()});(t=this.attachShadow)==null||t.call(this,{mode:"open"})}static get observedAttributes(){return["api-base-url","session-id","user-label","title","placeholder","theme","render-mode"]}connectedCallback(){var t;this.ownerDocument.addEventListener("keydown",this.handleDocumentKeyDown),(t=this.ownerDocument.defaultView)==null||t.addEventListener("resize",this.handleViewportResize),this.render()}disconnectedCallback(){var t;this.ownerDocument.removeEventListener("keydown",this.handleDocumentKeyDown),(t=this.ownerDocument.defaultView)==null||t.removeEventListener("resize",this.handleViewportResize),this.cancelAssistantRenderFrame()}attributeChangedCallback(){this.render()}get apiBaseUrl(){return this.getAttribute("api-base-url")||""}set apiBaseUrl(t){this.setAttribute("api-base-url",t)}get sessionId(){return this.getAttribute("session-id")||""}set sessionId(t){t?this.setAttribute("session-id",t):this.removeAttribute("session-id")}get userLabel(){return this.getAttribute("user-label")||""}set userLabel(t){this.setAttribute("user-label",t)}get title(){return this.getAttribute("title")||"AI 助手"}set title(t){this.setAttribute("title",t)}get placeholder(){return this.getAttribute("placeholder")||"请输入问题"}set placeholder(t){this.setAttribute("placeholder",t)}get theme(){return this.getAttribute("theme")||"light"}set theme(t){this.setAttribute("theme",t)}get renderMode(){return this.getAttribute("render-mode")==="text"?"text":"markdown"}set renderMode(t){this.setAttribute("render-mode",t)}get client(){return new wt({apiBaseUrl:this.apiBaseUrl,headers:this.headers})}async handleSubmit(t){var i;t.preventDefault();const n=(i=this.shadowRoot)==null?void 0:i.querySelector(".input"),r=(n==null?void 0:n.value.trim())||"";if(!(!r||this.loading)){this.loading=!0,this.requestFailed=!1,this.inputValue="",this.statusText="Thinking",this.messages.push({role:"user",content:r}),this.messages.push({role:"assistant",content:"",state:"pending"}),this.stickToBottom=!0,this.render(),this.focusInput();try{let o=this.sessionId;if(!o){const s=await this.client.createSession(this.userLabel);o=s.sessionId,this.sessionId=s.sessionId,this.emit("session-created",s)}this.emit("message-start",{sessionId:o,content:r}),await this.client.sendMessage(o,r,{onEvent:s=>this.handleAgentEvent(o,s)})}catch(o){this.requestFailed=!0,this.fail(o instanceof Error?o.message:"Agent request failed",o)}finally{this.loading=!1,this.requestFailed||(this.statusText="Ready",this.finalizeAssistantMessage(),this.flushLastAssistantMessageSync()),this.syncPanelState()}}}handleAgentEvent(t,n){if(n.type==="text"){const r=typeof n.payload=="string"?n.payload:"";this.appendAssistantText(r),this.emit("message-delta",{sessionId:t,text:r}),this.scheduleLastAssistantMessageSync();return}if(n.type==="tool_status"){this.statusText="Tool finished",this.syncPanelState();return}if(n.type==="done"){const r=n.payload,i=(r==null?void 0:r.assistantContent)||this.currentAssistantContent();this.replaceAssistantText(i),this.emit("message-done",{sessionId:t,content:i}),this.flushLastAssistantMessageSync();return}if(n.type==="error"){const r=n.payload;this.requestFailed=!0,this.fail((r==null?void 0:r.code)||"Agent returned an error",n.payload)}}appendAssistantText(t){const n=this.messages[this.messages.length-1];(n==null?void 0:n.role)==="assistant"&&(n.content+=t)}replaceAssistantText(t){const n=this.messages[this.messages.length-1];(n==null?void 0:n.role)==="assistant"&&(n.content=t,n.state=void 0,n.error=void 0)}finalizeAssistantMessage(){const t=this.messages[this.messages.length-1];(t==null?void 0:t.role)==="assistant"&&(t.state=void 0,t.error=void 0,t.content.trim()||(t.content="暂未返回有效内容。"))}currentAssistantContent(){const t=this.messages[this.messages.length-1];return(t==null?void 0:t.role)==="assistant"?t.content:""}fail(t,n){this.statusText="Error";const r=this.messages[this.messages.length-1];(r==null?void 0:r.role)==="assistant"?(r.state="error",r.error=t):this.messages.push({role:"assistant",content:"",state:"error",error:t}),this.flushLastAssistantMessageSync(),this.syncPanelState(),this.emit("agent-error",{sessionId:this.sessionId||void 0,message:t,detail:n})}emit(t,n){this.dispatchEvent(new CustomEvent(t,{detail:n,bubbles:!0,composed:!0}))}render(){var w;if(!this.shadowRoot)return;const t=this.shadowRoot.querySelector(".messages"),n=(t==null?void 0:t.scrollTop)||0,r=((w=this.shadowRoot.activeElement)==null?void 0:w.classList.contains("input"))||!1;this.shadowRoot.innerHTML=`
      <style>${Fo}</style>
      ${this.opened?this.renderPanel():this.renderLauncher()}
    `,this.animatePanel=!1;const i=this.shadowRoot.querySelector(".launcher");i==null||i.addEventListener("click",C=>{if(Date.now()<this.suppressLauncherClickUntil){C.preventDefault();return}this.openPanel()}),i&&this.bindLauncherDragging(i);const o=this.shadowRoot.querySelector("[data-action='close']");o==null||o.addEventListener("click",()=>{this.closePanel()});const s=this.shadowRoot.querySelector("[data-action='mode']");s==null||s.addEventListener("click",()=>{var C,y;this.panelMode=this.panelMode==="drawer"?"window":"drawer",this.animatePanel=!0,this.render(),(y=(C=this.shadowRoot)==null?void 0:C.querySelector("[data-action='mode']"))==null||y.focus({preventScroll:!0})});const a=this.shadowRoot.querySelector(".composer"),l=this.shadowRoot.querySelector(".input");l==null||l.addEventListener("input",()=>{this.inputValue=l.value,this.resizeComposerInput(l),this.updateSendButtonState()}),l==null||l.addEventListener("keydown",C=>this.handleComposerKeyDown(C,a||void 0)),a==null||a.addEventListener("submit",C=>this.handleSubmit(C)),l&&this.resizeComposerInput(l),this.updateSendButtonState();const d=this.shadowRoot.querySelector(".panel--window"),f=this.shadowRoot.querySelector(".panel--window .header");d&&f&&(this.bindWindowDragging(f,d),f.addEventListener("dblclick",C=>{const y=C.target;y instanceof Element&&y.closest("button")||(this.windowPosition=void 0,this.windowSize=void 0,this.render(),this.focusInput())})),d&&this.shadowRoot.querySelectorAll(".panel--window [data-resize]").forEach(C=>this.bindWindowResizing(C,d));const m=this.shadowRoot.querySelector(".panel--drawer"),b=this.shadowRoot.querySelector(".panel--drawer [data-resize='w']");m&&b&&this.bindDrawerResizing(b,m);const p=this.shadowRoot.querySelector(".messages"),k=this.shadowRoot.querySelector("[data-action='scroll-latest']");p==null||p.addEventListener("scroll",()=>{this.stickToBottom=zo(p),k&&(k.hidden=this.stickToBottom)},{passive:!0}),k==null||k.addEventListener("click",()=>{p&&(this.stickToBottom=!0,k.hidden=!0,p.scrollTo({top:p.scrollHeight,behavior:"smooth"}))}),p&&(p.scrollTop=this.stickToBottom?p.scrollHeight:n,k&&(k.hidden=this.stickToBottom)),r&&this.focusInput()}openPanel(){this.opened=!0,this.animatePanel=!0,this.render(),this.focusInput()}closePanel(){var t,n;this.opened=!1,this.render(),this.constrainLauncherToViewport(),(n=(t=this.shadowRoot)==null?void 0:t.querySelector(".launcher"))==null||n.focus({preventScroll:!0})}focusInput(){var r;const t=(r=this.shadowRoot)==null?void 0:r.querySelector(".input");if(!t)return;t.focus({preventScroll:!0});const n=t.value.length;t.setSelectionRange(n,n)}handleComposerKeyDown(t,n){if(t.key==="Backspace"){t.stopPropagation();return}t.key!=="Enter"||t.shiftKey||t.isComposing||(t.preventDefault(),n==null||n.requestSubmit())}resizeComposerInput(t){t.style.height="0px";const n=Math.min(t.scrollHeight,120);t.style.height=`${Math.max(42,n)}px`,t.style.overflowY=t.scrollHeight>120?"auto":"hidden"}updateSendButtonState(){var n;const t=(n=this.shadowRoot)==null?void 0:n.querySelector(".send-button");t&&(t.disabled=this.loading||!this.inputValue.trim())}renderLauncher(){const t=this.launcherPosition?` style="left:${this.launcherPosition.left}px;top:${this.launcherPosition.top}px;right:auto;bottom:auto"`:"";return`
      <button class="launcher" part="launcher" type="button" aria-label="打开${cu(this.title)}" title="打开${cu(this.title)}"${t}>
        ${No}
      </button>
    `}renderPanel(){const t=this.panelMode==="window",n=this.getPanelStyle(t),r=t?"切换为右侧抽屉":"切换为可拖拽浮窗",i=this.animatePanel?" panel--enter":"",o=this.getStatusState(),s=this.loading||!this.inputValue.trim();return`
      <section class="panel panel--${this.panelMode}${i}" part="panel" role="dialog" aria-modal="false" aria-label="${cu(this.title)}"${n}>
        <header class="header" part="header">
          <div class="header__identity">
            <span class="header__mark">${qn}</span>
            <span class="header__copy">
              <span class="title">${Fe(this.title)}</span>
              <span class="status status--${o}" aria-live="polite"><i></i><span class="status__label">${Fe(this.getStatusLabel())}</span></span>
            </span>
          </div>
          <div class="header__actions">
            <button class="icon-button" data-action="mode" type="button" aria-label="${r}" title="${r}">
              ${t?$o:Bo}
            </button>
            <button class="icon-button" data-action="close" type="button" aria-label="关闭" title="关闭">
              ${qo}
            </button>
          </div>
        </header>
        <div class="messages-shell">
          <div class="messages" part="messages" role="log" aria-live="polite" aria-relevant="additions text" aria-busy="${this.loading}">
            ${this.renderMessages()}
          </div>
          <button class="scroll-latest" data-action="scroll-latest" type="button" aria-label="回到最新消息" title="回到最新消息" hidden>
            ${Ho}
          </button>
        </div>
        <form class="composer" part="composer">
          <textarea class="input" part="input" rows="1" aria-label="${cu(this.placeholder)}" placeholder="${cu(this.placeholder)}">${Fe(this.inputValue)}</textarea>
          <button class="send-button" part="button" type="submit" aria-label="发送" title="发送" ${s?"disabled":""}>
            ${Uo}
          </button>
        </form>
        ${t?Po:Oo}
      </section>
    `}getPanelStyle(t){if(!t)return` style="width:${Math.min(this.drawerWidth,window.innerWidth)}px"`;const n=[];return this.windowPosition&&n.push(`left:${this.windowPosition.left}px`,`top:${this.windowPosition.top}px`,"right:auto","bottom:auto"),this.windowSize&&n.push(`width:${this.windowSize.width}px`,`height:${this.windowSize.height}px`),n.length?` style="${n.join(";")}"`:""}bindLauncherDragging(t){t.addEventListener("pointerdown",n=>{if(n.button!==0)return;t.classList.add("launcher--dragging");const r=t.getBoundingClientRect(),i=n.clientX,o=n.clientY,s=n.pointerId;let a=!1;t.setPointerCapture(s);const l=f=>{if(f.pointerId!==s)return;const m=f.clientX-i,b=f.clientY-o;if(!a&&Math.hypot(m,b)<Lo)return;a=!0,f.preventDefault();const p=ue(r.left+m,M,window.innerWidth-r.width-M),k=ue(r.top+b,M,window.innerHeight-r.height-M);this.launcherPosition={left:p,top:k},t.style.left=`${p}px`,t.style.top=`${k}px`,t.style.right="auto",t.style.bottom="auto"},d=f=>{var w;if(f.pointerId!==s||(t.removeEventListener("pointermove",l),t.removeEventListener("pointerup",d),t.removeEventListener("pointercancel",d),t.hasPointerCapture(s)&&t.releasePointerCapture(s),t.classList.remove("launcher--dragging"),!a))return;this.suppressLauncherClickUntil=Date.now()+400;const m=t.offsetWidth,b=t.offsetHeight,p=ue(((w=this.launcherPosition)==null?void 0:w.top)??t.getBoundingClientRect().top,M,window.innerHeight-b-M),k=Math.max(M,window.innerWidth-m-this.getLauncherGap(t));this.launcherPosition={left:k,top:p},t.style.left=`${k}px`,t.style.top=`${p}px`};t.addEventListener("pointermove",l),t.addEventListener("pointerup",d),t.addEventListener("pointercancel",d)})}getLauncherGap(t){const n=Number.parseFloat(window.getComputedStyle(t).getPropertyValue("--eag-launcher-gap"));return Number.isFinite(n)?n:Io}bindDrawerResizing(t,n){t.addEventListener("pointerdown",r=>{if(r.button!==0)return;r.preventDefault();const i=r.clientX,o=n.getBoundingClientRect().width,s=r.pointerId;n.classList.add("panel--resizing"),t.setPointerCapture(s);const a=d=>{if(d.pointerId!==s)return;const f=Math.min(Nn,window.innerWidth),m=ue(o-(d.clientX-i),f,window.innerWidth);this.drawerWidth=m,n.style.width=`${m}px`},l=d=>{d.pointerId===s&&(t.removeEventListener("pointermove",a),t.removeEventListener("pointerup",l),t.removeEventListener("pointercancel",l),n.classList.remove("panel--resizing"),t.hasPointerCapture(s)&&t.releasePointerCapture(s))};t.addEventListener("pointermove",a),t.addEventListener("pointerup",l),t.addEventListener("pointercancel",l)})}bindWindowDragging(t,n){t.addEventListener("pointerdown",r=>{const i=r.target;if(i instanceof Element&&i.closest("button")||r.button!==0)return;const o=n.getBoundingClientRect(),s=r.clientX-o.left,a=r.clientY-o.top,l=r.pointerId;t.setPointerCapture(l);const d=m=>{if(m.pointerId!==l)return;const b=Math.min(Math.max(M,m.clientX-s),Math.max(M,window.innerWidth-o.width-M)),p=Math.min(Math.max(M,m.clientY-a),Math.max(M,window.innerHeight-o.height-M));this.windowPosition={left:b,top:p},n.style.left=`${b}px`,n.style.top=`${p}px`,n.style.right="auto",n.style.bottom="auto"},f=m=>{m.pointerId===l&&(t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",f),t.removeEventListener("pointercancel",f),t.hasPointerCapture(l)&&t.releasePointerCapture(l))};t.addEventListener("pointermove",d),t.addEventListener("pointerup",f),t.addEventListener("pointercancel",f)})}bindWindowResizing(t,n){t.addEventListener("pointerdown",r=>{if(r.button!==0)return;const i=t.dataset.resize;if(!i)return;r.preventDefault(),r.stopPropagation();const o=n.getBoundingClientRect(),s=r.clientX,a=r.clientY,l=o.right,d=o.bottom,f=this.getWindowMinimumSize(),m=r.pointerId;n.classList.add("panel--resizing"),t.setPointerCapture(m);const b=k=>{if(k.pointerId!==m)return;const w=k.clientX-s,C=k.clientY-a;let y=o.left,D=o.top,_=o.width,A=o.height;i.includes("e")&&(_=ue(o.width+w,f.width,window.innerWidth-M-o.left)),i.includes("w")&&(y=ue(o.left+w,M,l-f.width),_=l-y),i.includes("s")&&(A=ue(o.height+C,f.height,window.innerHeight-M-o.top)),i.includes("n")&&(D=ue(o.top+C,M,d-f.height),A=d-D),this.windowPosition={left:y,top:D},this.windowSize={width:_,height:A},n.style.left=`${y}px`,n.style.top=`${D}px`,n.style.right="auto",n.style.bottom="auto",n.style.width=`${_}px`,n.style.height=`${A}px`},p=k=>{k.pointerId===m&&(t.removeEventListener("pointermove",b),t.removeEventListener("pointerup",p),t.removeEventListener("pointercancel",p),n.classList.remove("panel--resizing"),t.hasPointerCapture(m)&&t.releasePointerCapture(m))};t.addEventListener("pointermove",b),t.addEventListener("pointerup",p),t.addEventListener("pointercancel",p)})}getWindowMinimumSize(){return{width:Math.min(vo,Math.max(0,window.innerWidth-16)),height:Math.min(Ro,Math.max(0,window.innerHeight-16))}}constrainPanelToViewport(){if(!this.opened||!this.shadowRoot)return;const t=this.shadowRoot.querySelector(".panel--drawer");if(t){const d=Math.min(Nn,window.innerWidth);this.drawerWidth=ue(this.drawerWidth,d,window.innerWidth),t.style.width=`${this.drawerWidth}px`;return}const n=this.shadowRoot.querySelector(".panel--window");if(!n)return;const r=n.getBoundingClientRect(),i=this.getWindowMinimumSize(),o=ue(r.width,i.width,Math.max(0,window.innerWidth-16)),s=ue(r.height,i.height,Math.max(0,window.innerHeight-16)),a=ue(r.left,M,window.innerWidth-o-M),l=ue(r.top,M,window.innerHeight-s-M);this.windowPosition={left:a,top:l},this.windowSize={width:o,height:s},n.style.left=`${a}px`,n.style.top=`${l}px`,n.style.right="auto",n.style.bottom="auto",n.style.width=`${o}px`,n.style.height=`${s}px`}constrainLauncherToViewport(){if(!this.launcherPosition||this.opened||!this.shadowRoot)return;const t=this.shadowRoot.querySelector(".launcher");if(!t)return;const n=t.offsetWidth,r=t.offsetHeight,i=Math.max(M,window.innerWidth-n-this.getLauncherGap(t)),o=ue(this.launcherPosition.top,M,window.innerHeight-r-M);this.launcherPosition={left:i,top:o},t.style.left=`${i}px`,t.style.top=`${o}px`}getStatusLabel(){return this.statusText==="Ready"?"就绪":this.statusText==="Thinking"||this.statusText==="Tool finished"?"处理中":this.statusText==="Error"?"请求失败":this.statusText}getStatusState(){return this.requestFailed||this.statusText==="Error"?"error":this.loading?"loading":"ready"}syncPanelState(){var r,i;const t=(r=this.shadowRoot)==null?void 0:r.querySelector(".status");if(t){t.className=`status status--${this.getStatusState()}`;const o=t.querySelector(".status__label");o&&(o.textContent=this.getStatusLabel())}const n=(i=this.shadowRoot)==null?void 0:i.querySelector(".messages");n==null||n.setAttribute("aria-busy",String(this.loading)),this.updateSendButtonState()}syncLastAssistantMessage(){if(!this.shadowRoot)return;const t=this.shadowRoot.querySelectorAll(".message-row--assistant"),n=t[t.length-1],r=this.messages[this.messages.length-1];!n||(r==null?void 0:r.role)!=="assistant"||(n.innerHTML=this.renderMessageBubble(r),this.syncMessageScroll())}scheduleLastAssistantMessageSync(){const t=this.ownerDocument.defaultView;if(!(t!=null&&t.requestAnimationFrame)){this.syncLastAssistantMessage();return}this.assistantRenderFrame===void 0&&(this.assistantRenderFrame=t.requestAnimationFrame(()=>{this.assistantRenderFrame=void 0,this.syncLastAssistantMessage()}))}flushLastAssistantMessageSync(){this.cancelAssistantRenderFrame(),this.syncLastAssistantMessage()}cancelAssistantRenderFrame(){var t;this.assistantRenderFrame!==void 0&&((t=this.ownerDocument.defaultView)==null||t.cancelAnimationFrame(this.assistantRenderFrame),this.assistantRenderFrame=void 0)}syncMessageScroll(){var r,i;const t=(r=this.shadowRoot)==null?void 0:r.querySelector(".messages"),n=(i=this.shadowRoot)==null?void 0:i.querySelector("[data-action='scroll-latest']");t&&(this.stickToBottom&&(t.scrollTop=t.scrollHeight),n&&(n.hidden=this.stickToBottom))}renderMessages(){return this.messages.length?this.messages.map(t=>this.renderMessage(t)).join(""):`
        <div class="empty">
          <span class="empty__icon">${qn}</span>
          <strong>你好，我是${Fe(this.title)}</strong>
          <span>可以直接询问业务问题，我会按后台配置调用已授权能力。</span>
        </div>
      `}renderMessage(t){return`
      <div class="message-row message-row--${t.role}">
        ${this.renderMessageBubble(t)}
      </div>
    `}renderMessageBubble(t){if(t.role==="user")return`<div class="message user" part="message">${Fe(t.content)}</div>`;const n=this.renderMode==="markdown",r=n?On(t.content):Fe(t.content),i=n?"markdown-body":"message__content--text",o=t.content?`<div class="message__content ${i}">${r}</div>`:"",s=t.state==="pending"&&!t.content?'<span class="typing" role="status"><span>正在处理</span><span class="typing__dots" aria-hidden="true"><i></i><i></i><i></i></span></span>':"",a=t.state==="error"?`<div class="message__error"><strong>请求失败</strong><span>${Fe(t.error||"暂时无法完成请求，请稍后再试。")}</span></div>`:"";return`<div class="message assistant${t.state?` message--${t.state}`:""}" part="message">${o}${s}${a}</div>`}}function $n(){typeof window>"u"||!window.customElements||window.customElements.get(Pn)||window.customElements.define(Pn,Bn)}function Fe(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function cu(e){return Fe(e).replaceAll(`
`," ")}function ue(e,u,t){return Math.min(Math.max(e,u),Math.max(u,t))}function zo(e){return e.scrollHeight-e.scrollTop-e.clientHeight<=48}const Oo=`
  <span class="resize-handle resize-handle--w" data-resize="w" aria-hidden="true"></span>
`,Po=["n","s","e","w","ne","nw","se","sw"].map(e=>`<span class="resize-handle resize-handle--${e}" data-resize="${e}" aria-hidden="true"></span>`).join(""),No=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.5 18.2 4 20l.9-3.6A8 8 0 0 1 3 11.3C3 6.7 7 3 12 3s9 3.7 9 8.3-4 8.2-9 8.2c-1.6 0-3.1-.4-4.5-1.3Z" />
    <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" class="icon-dots" />
  </svg>
`,qn=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.8c.7 4.8 3.4 7.5 8.2 8.2-4.8.7-7.5 3.4-8.2 8.2-.7-4.8-3.4-7.5-8.2-8.2 4.8-.7 7.5-3.4 8.2-8.2Z" />
    <path d="M19 2.8c.2 1.5 1 2.3 2.5 2.5-1.5.2-2.3 1-2.5 2.5-.2-1.5-1-2.3-2.5-2.5 1.5-.2 2.3-1 2.5-2.5Z" />
  </svg>
`,Bo=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M4 9h16" />
  </svg>
`,$o=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M14 4v16" />
  </svg>
`,qo=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 7 10 10M17 7 7 17" />
  </svg>
`,Uo=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m4 4 17 8-17 8 3-8-3-8Z" />
    <path d="M7 12h14" />
  </svg>
`,Ho=`
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m7 10 5 5 5-5" />
  </svg>
`;$n(),q.AgentApiError=Mu,q.AgentClient=wt,q.EasyAgentChatElement=Bn,q.SseStreamParser=X,q.buildAgentUrl=Ee,q.defineEasyAgentChatElement=$n,q.normalizeAgentEvent=Lu,q.parseSseBlock=ke,q.parseSseText=pr,q.renderMarkdown=On,Object.defineProperty(q,Symbol.toStringTag,{value:"Module"})});
