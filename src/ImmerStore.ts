import produce, { Draft } from "immer";
import type { Writable } from "../node_modules/svelte/store";

type subscriber<T> = (value: T)=>any;

export default class ImmerStore<T> implements Writable<T> {
  private subs: Set<subscriber<T>>;
  private states: T[];
  private index = 0;
  constructor(value: T) {
    this.states = [value];
    this.subs = new Set();
  }
  get currentState() {
    return this.states[this.index];
  }
  set(value: T): void {
    this.states = [value];
    this.index = 0;
    this.updateSubscribers();
  }
  update(updater: (obj: T)=>T) {
    const nextState = produce(this.currentState, updater);
    if(this.canRedo) {
      let del = this.index -1;
      this.states.splice(del, this.states.length - del);
    }
    this.states.push(nextState as T);
    this.index = this.states.length -1;
    this.updateSubscribers();
  }
  subscribe(s: subscriber<T>) {
    this.subs.add(s);
    s(this.currentState);
    return ()=>this.subs.delete(s);
  }

  undo() {
    if(!this.canUndo) return;
    this.index--;
    this.updateSubscribers();
  }

  redo() {
    if(!this.canRedo) return;
    this.index++;
    this.updateSubscribers();
  }

  filter(cb: (v:T)=>boolean) {
    console.log(this.states.length);
    this.states = this.states.filter(cb);
    console.log(this.states.length);
    this.index = this.states.length -1;
    this.updateSubscribers();
  }

  get canUndo() {
    return this.index > 0;
  }

  get canRedo() {
    return this.index < this.states.length -1;
  }

  private updateSubscribers() {
    this.subs.forEach(s=>s(this.currentState));
  }
}