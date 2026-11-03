// Keep decoded originals alive so a newly opened codex never joins the boot
// download queue or waits for an asynchronous first paint.
export function prepareTacticalIcons(entries,{ImageClass=globalThis.Image,gate=globalThis.window?.HEADON_GATE}={}){
 const images=new Map();
 for(const entry of entries){
  const image=new ImageClass();image.decoding='sync';image.loading='eager';image.src=entry.icon;
  images.set(entry.id,image);
 }
 gate?.raise?.([...images.values()].map(image=>image.src));
 const ready=Promise.all([...images.values()].map(image=>image.decode().catch(()=>{})));
 return {ready,image(id){return images.get(id).cloneNode(false)}};
}
