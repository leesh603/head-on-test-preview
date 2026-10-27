// The four first-screen navigation icons are mandatory, even while queued images
// have no native src attribute yet. A failed download must not uncover a blank menu.
export function waitForLobbyIcons(tabs,gate){
 const images=['ranking','aces','medals','home'].map(key=>{
  const button=tabs.querySelector(`[data-tab="${key}"]`),image=button?.querySelector('img');
  if(!button?.textContent.trim()||!image?.src)throw new Error('Lobby control missing: '+key);
  return image;
 });
 gate?.raise?.(images.map(image=>image.src));
 return Promise.all(images.map(image=>new Promise((resolve,reject)=>{
  let decoding=false,settled=false;
  const cleanup=()=>{image.removeEventListener('load',loaded);image.removeEventListener('error',failed)};
  const failed=()=>{if(settled)return;settled=true;cleanup();reject(new Error('Lobby icon failed: '+image.src))};
  const loaded=async()=>{
   if(settled||decoding||!image.complete)return;
   if(!image.naturalWidth){failed();return}decoding=true;
   try{await image.decode?.();if(!image.naturalWidth)throw new Error('Empty icon');settled=true;cleanup();resolve()}
   catch{failed()}
  };
  image.addEventListener('load',loaded);image.addEventListener('error',failed);
  if(image.complete)void loaded();
 })));
}
