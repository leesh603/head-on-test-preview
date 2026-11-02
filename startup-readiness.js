// A failed or stalled readiness task must expose recovery, never claim ready.
export function waitForStartup(promise,ms=30000,onTimeout){
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value)};
  const timer=setTimeout(()=>{onTimeout?.();finish(reject,new Error('Lobby readiness timed out'))},ms);
  Promise.resolve(promise).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
