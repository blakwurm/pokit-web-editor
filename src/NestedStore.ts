import type { Writable } from "../node_modules/svelte/types/runtime/store";
import type ImmerStore from "./ImmerStore";
type Key = string | number;

export default class NestedStore<T> implements Writable<T> {
  base: Writable<pojo>;
  path: Key[];

  get key() {
    return this.path[this.path.length-1]
  }

  constructor(store: Writable<pojo>, ...path: Key[]) {
    this.base = store;
    this.path = path;
  }

  set(value: T): void {
    this.base.update(b=>{
      let ref = this.getParent(b);
      ref[this.path[this.path.length-1]] = value;
      return b;
    })
  }

  private get(b: pojo): T | undefined {
    let ref = this.getParent(b) || {};
    return ref[this.key];
  }

  private getParent(b: pojo): pojo {
    let ref = b;
    for(let i = 0; i < this.path.length-1; i++) {
      ref = ref[this.path[i]] || {};
    }
    return ref;
  }

  update(updater: (obj: T)=>T) {
    this.base.update(o=>{
      let ref = this.getParent(o);
      let key = this.path.length-1; 
      ref[this.path[key]] = updater(ref[this.path[key]]);
      return o;
    })
  }
  
  subscribe(subscriber: (obj:T)=>void) {
    return this.base.subscribe((o)=>{
      subscriber(this.get(o));
    });
  }

  drill<T>(...path: Key[]) {
    return new NestedStore<T>(this.base, ...this.path, ...path);
  }
}
