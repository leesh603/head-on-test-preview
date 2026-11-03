// Crisp text tags over the game canvas. The battlefield canvas renders at <=1 px per CSS px and
// is upscaled with image-rendering:pixelated, so label text drawn into it breaks up on
// high-DPI phones. Labels are pooled DOM nodes positioned in CSS px; shapes stay on the canvas.
export function createHudTags(host){
 const layer=document.createElement('div');layer.className='hud-tags';layer.setAttribute('aria-hidden','true');
 const vignette=host?.querySelector?.('.vignette');if(vignette)vignette.after(layer);else host?.append?.(layer);
 const pool=new Map();let frame=0;
 const dpr=()=>globalThis.devicePixelRatio||1,snap=v=>{const d=dpr();return Math.round(v*d)/d};
 function tag(key,{x,y,ax=.5,ay=.5,name='',dist='',detail='',accent='#e2c276',kind='edge',minX=8,maxX=Infinity}){
  let t=pool.get(key);
  if(!t){const el=document.createElement('div');el.className='hud-tag';el.innerHTML='<i></i><b></b><em></em><small></small>';layer.append(el);t={el,b:el.children[1],em:el.children[2],sm:el.children[3],kind:'',name:null,dist:null,detail:null,accent:null,left:NaN,top:NaN,w:0,h:0,measuredAt:-1e9,stale:false,shown:true,frame:0};pool.set(key,t)}
  t.frame=frame;
  // Field-wise compare (no per-frame string building). Layout is read only when the box can
  // change shape (kind/name/detail); a distance tick re-measures at most every 30 frames.
  let shape=false;
  if(t.kind!==kind){t.kind=kind;t.el.className='hud-tag '+kind;shape=true}
  if(t.name!==name){t.name=name;t.b.textContent=name;shape=true}
  if(t.detail!==detail){t.detail=detail;t.sm.textContent=detail;shape=true}
  if(t.accent!==accent){t.accent=accent;t.el.style.setProperty('--tag-accent',accent)}
  // Target chips show the distance inside the title line (b::after), edge chips in <em>.
  if(t.dist!==dist){t.dist=dist;if(kind==='target')t.b.dataset.dist=dist;else t.em.textContent=dist;t.stale=true}
  if(shape||t.stale&&frame-t.measuredAt>=30){t.w=t.el.offsetWidth;t.h=t.el.offsetHeight;t.measuredAt=frame;t.stale=false}
  const left=snap(Math.max(minX,Math.min(maxX-t.w,x-ax*t.w))),top=snap(y-ay*t.h);
  if(left!==t.left||top!==t.top){t.left=left;t.top=top;t.el.style.transform=`translate3d(${left}px,${top}px,0)`}
  if(!t.shown){t.shown=true;t.el.style.visibility=''}
  return t;
 }
 function begin(){frame++}
 function end(){for(const [key,t] of pool){if(t.frame===frame)continue;
  // Targets key by unit object; drop tags unused for ~5 s so dead units do not accumulate.
  if(frame-t.frame>300){t.el.remove();pool.delete(key)}else if(t.shown){t.shown=false;t.el.style.visibility='hidden'}}}
 return {tag,begin,end,layer};
}
