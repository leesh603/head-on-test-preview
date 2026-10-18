// Fixed capacity, dense active indices and O(1) release. No setTimeout or per-tick filter/splice.
export class FixedPool {
  constructor(capacity, factory = () => ({})) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid pool capacity');
    this.capacity=capacity;this.count=0;this.freeCount=capacity;this.dropped=0;
    this.records=Array.from({length:capacity},(_,i)=>Object.assign(factory(),{index:i,generation:0,active:false}));
    this.dense=new Int32Array(capacity);this.positions=new Int32Array(capacity);this.free=new Int32Array(capacity);
    for(let i=0;i<capacity;i++)this.free[i]=capacity-1-i;
  }
  acquire() {
    if(!this.freeCount){this.dropped++;return null;}
    const index=this.free[--this.freeCount],r=this.records[index];r.active=true;r.generation++;
    this.positions[index]=this.count;this.dense[this.count++]=index;return r;
  }
  release(index,generation) {
    const r=this.records[index];if(!r?.active||r.generation!==generation)return false;
    const at=this.positions[index],last=this.dense[--this.count];this.dense[at]=last;this.positions[last]=at;
    r.active=false;this.free[this.freeCount++]=index;return true;
  }
  visit(fn) {
    let i=0;while(i<this.count){const index=this.dense[i],r=this.records[index];fn(r);
      if(i<this.count&&this.dense[i]===index)i++;}
  }
  clear(predicate=()=>true){this.visit(r=>{if(predicate(r))this.release(r.index,r.generation);});}
}
