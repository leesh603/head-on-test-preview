// Crisp text tags over the game canvas. The battlefield canvas renders at <=1 px per CSS px and
// is upscaled with image-rendering:pixelated, so label text drawn into it breaks up on
// high-DPI phones. Labels are pooled DOM nodes positioned in CSS px; shapes stay on the canvas.
export function createHudTags(host){
 const layer=document.createElement('div');layer.className='hud-tags';layer.setAttribute('aria-hidden','true');
 const vignette=host?.querySelector?.('.vignette');if(vignette)vignette.after(layer);else host?.append?.(layer);
 const pool=new Map();let frame=0;
 const snap=v=>{const d=globalThis.devicePixelRatio||1;return Math.round(v*d)/d};
 function tag(key,{x,y,ax=.5,ay=.5,name='',dist='',detail='',accent='#e2c276',kind='edge',minX=8,maxX=Infinity}){
  let t=pool.get(key);
  if(!t){const el=document.createElement('div');el.className='hud-tag';el.innerHTML='<i></i><b></b><em></em><small></small>';layer.append(el);t={el,b:el.children[1],em:el.children[2],sm:el.children[3],sig:'',pos:'',w:0,h:0,shown:true,frame:0};pool.set(key,t)}
  t.frame=frame;
  const sig=kind+'\u0000'+name+'\u0000'+dist+'\u0000'+detail+'\u0000'+accent;
  if(t.sig!==sig){t.sig=sig;t.el.className='hud-tag '+kind;t.b.textContent=name;t.em.textContent=dist;t.sm.textContent=detail;t.el.style.setProperty('--tag-accent',accent);t.w=t.el.offsetWidth;t.h=t.el.offsetHeight}
  const left=snap(Math.max(minX,Math.min(maxX-t.w,x-ax*t.w))),top=snap(y-ay*t.h),pos=left+','+top;
  if(t.pos!==pos){t.pos=pos;t.el.style.transform=`translate3d(${left}px,${top}px,0)`}
  if(!t.shown){t.shown=true;t.el.style.visibility=''}
  return t;
 }
 function begin(){frame++}
 function end(){for(const [key,t] of pool){if(t.frame===frame)continue;
  // Targets key by unit object; drop tags unused for ~5 s so dead units do not accumulate.
  if(frame-t.frame>300){t.el.remove();pool.delete(key)}else if(t.shown){t.shown=false;t.el.style.visibility='hidden'}}}
 return {tag,begin,end,layer};
}
