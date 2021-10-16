import type { UndoRedoStore } from "immer-loves-svelte";
import type { Writable } from "../node_modules/svelte/types/runtime/store";

type Key = string | number;

export default class NestedStore<T> implements UndoRedoStore<T> {
  base: UndoRedoStore<pojo>;
  undo: ()=>void;
  redo: ()=>void;
  clear: ()=>void;
  path: Key[];

  get key() {
    return this.path[this.path.length-1]
  }

  constructor(store: UndoRedoStore<pojo>, ...path: Key[]) {
    this.base = store;
    this.undo = store.undo;
    this.redo = store.redo;
    this.clear = store.clear;
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
    let ref = this.getParent(b) || [];
    return ref[this.path[this.path.length-1]];
  }

  private getParent(b: pojo): pojo {
    let ref = b;
    for(let i = 0; i < this.path.length-1; i++) {
      console.log(ref, this.path[i]);
      ref = ref[this.path[i]];
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

  drill(...path: Key[]) {
    return new NestedStore(this.base, ...this.path, ...path);
  }

  get canRedo() {return this.base.canRedo}
  get canUndo() {return this.base.canUndo}

}
