// Minimal DOM boundary for exercising the actual controller without WebGL.
// Browser rendering and native event delivery still need a browser check.
export const appHarness = function appHarness(app,html,configSource,dependencies,options={}){
  const nodes=new Map(),dialogs=[],timers=new Map();let nextTimer=0,document,clock=0;
  class Element {
    constructor(id='',tag='div'){this.id=id;this.tagName=tag.toUpperCase();this.style={};this.dataset={};this.attributes={};this.children=[];this.listeners={};this.hidden=false;this.open=false;this.disabled=false;this.scrollTop=0;this.returnValue='';this.textContent='';const classes=new Set();this.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),toggle:(n,force)=>{const on=force??!classes.has(n);on?classes.add(n):classes.delete(n);return on;},contains:n=>classes.has(n)};}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    fire(type='click',extra={}){if(type==='click'&&this.disabled)return;for(const fn of this.listeners[type]||[])fn({target:this,detail:0,clientX:0,clientY:0,stopPropagation(){},preventDefault(){},...extra});}
    setAttribute(key,value){this.attributes[key]=String(value);}
    getAttribute(key){return this.attributes[key]??null;}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=[...items];}
    contains(node){return node===this||this.children.some(child=>child.contains?.(node));}
    matches(){return false;}
    focus(){document.activeElement=this;}
    querySelector(selector){if(selector==='[data-close]')return this.closeButton??=new Element();if(selector==='svg')return this.svg??=new Element();return null;}
    getBoundingClientRect(){
      const height=options.height||844,width=options.width||390;
      if(this.id==='gratitude-card'){
        const shortLandscape=height<=500&&width>=height;
        const compact=this.classList.contains('is-compact')||shortLandscape;
        const w=compact?Math.min(280,width/2-24):Math.min(280,width-32);
        const length=nodes.get('gratitude-message')?.textContent.length||0;
        const h=Math.min(shortLandscape?height-96:Math.min(320,height*.42),60+Math.ceil(length/Math.max(8,(w-32)/7))*22);
        const left=parseFloat(this.style.left)||width-w-16,top=parseFloat(this.style.top)||68;
        return {left,top,right:left+w,bottom:top+h,width:w,height:h};
      }
      if(this.id==='reopen-letter')return {top:16,bottom:54,left:14,right:130,width:116,height:38};
      return {top:0,bottom:height,left:0,right:width,width,height};
    }
    get clientWidth(){return options.width||390;} get clientHeight(){return options.height||844;}
    showModal(){if(this.open)throw Error('Already open');this.open=true;this.focus();}
    close(value){if(!this.open)return;if(value!==undefined)this.returnValue=value;this.open=false;this.fire('close');}
    setPointerCapture(){} hasPointerCapture(){return false;} releasePointerCapture(){}
  }
  for(const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){
    const element=new Element(match[1]);element.hidden=/\bhidden\b/.test(match[0]);nodes.set(match[1],element);
  }
  const card=nodes.get('gratitude-card');
  if(card)card.append(nodes.get('gratitude-dismiss'),nodes.get('gratitude-message'));
  for(const match of html.matchAll(/<dialog id="([^"]+)"/g))dialogs.push(nodes.get(match[1]));
  document={activeElement:null,body:new Element('body'),hidden:false,getElementById:id=>nodes.get(id),
    createElement:tag=>new Element('',tag),querySelectorAll:selector=>selector==='dialog'?dialogs:[],
    querySelector:selector=>selector==='dialog[open]'?dialogs.find(d=>d.open)||null:selector==='.quiet-controls'?{getBoundingClientRect:()=>({bottom:54})}:null,
    addEventListener(){}};
  const win={addEventListener(){}};new Function('window',configSource)(win);
  const env={...dependencies,window:win,document,matchMedia:()=>({matches:options.reducedMotion!==false,addEventListener(){}}),
    localStorage:{getItem:key=>key==='room04:journey:v2'?options.savedState||null:null,setItem(){}},location:{search:''},URLSearchParams:class{get(){return null;}},
    performance:{now:()=>clock},getComputedStyle:()=>({paddingLeft:'0px',paddingRight:'0px',paddingBottom:'0px'}),
    requestAnimationFrame:fn=>{fn();return 1;},setTimeout:(fn,delay)=>{timers.set(++nextTimer,{fn,delay,due:clock+(Number(delay)||0)});return nextTimer;},clearTimeout:id=>timers.delete(id),
    setInterval:()=>1,clearInterval(){},MODEL_SOURCES:[]};
  const cutoff=app.indexOf("\nboot().catch(");
  if(cutoff<0)throw Error('Missing boot boundary');
  const body=app.slice(0,cutoff).replace(/^import .*;\n/gm,'');
  const api=new Function(...Object.keys(env),body+"\nreturn {interact,drawView,showWriting,showPhotograph,getState:()=>state,getTargets:()=>targets};")(...Object.values(env));
  api.drawView(dependencies.getView(api.getState()),true);
  function advance(ms){
    const end=clock+ms;let count=0;
    for(;;){
      const next=[...timers.entries()].filter(([,item])=>item.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];
      if(!next)break;
      clock=next[1].due;timers.delete(next[0]);next[1].fn();
      if(++count>1000)throw Error('Runaway timers');
    }
    clock=end;
  }
  return {api,nodes,dialogs,document,timers,advance,config:win.INVITATION};
};
