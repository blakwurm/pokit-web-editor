<script lang="ts">
  import ArrayItem from "./ArrayItem.svelte";
  import BooleanItem from "./BooleanItem.svelte";
  import NumberItem from "./NumberItem.svelte";
  import StringItem from "./StringItem.svelte";
  import type NestedStore from "../NestedStore";
  import { iterate_enum, ValueType } from "../stores";
import { deepClone } from "../utils";
  export let store: NestedStore<pojo>
  export let proto: pojo
  
  
  let map = {
    object: ArrayItem,
    number: NumberItem,
    string: StringItem,
    boolean: BooleanItem
  }
  function enumerate(proto: pojo, obj: pojo, store: NestedStore<pojo>): [string, any, NestedStore<any> | null, string][] {
    return Object.entries(proto).map(([k,v])=>{
      if(obj[k] !== undefined) return [k, v, store.drill(k), typeof v]
      return [k, v, null, typeof v]
    })
  }
  let key: string = "new_member";
  let type: ValueType = ValueType.STRING;

  let valueMap=["",0,false,[],{}]
  function deletekey(key: string) {
    store.update(x=>{
      delete x[key];
      return x;
    })
  }
  function additem() {
    if(key.toLocaleLowerCase().endsWith('color')) {
      store.update(s=>{
        s[key] = [255,0,255,255];
        return s;
      })
      return;
    }
    store.update(s=>{
      s[key]=valueMap[type];
      return s;
    })
  }
  function addParentOverride(key,value) {
    let v = typeof value==="object" ? deepClone(value) : value;
    return ()=>{
      store.update(s=>{
        s[key] = v;
        return s;
      })
    }
  }
  function getParentOverrideString(key,value?) {
    let suffix = value !== undefined ? `(${value})` : "";
    return `Override parent:${key}${suffix}`
  }
</script>

<!-- <div>{JSON.stringify(store.path)}</div> -->
<div class="obmodule">
  <div class="nameo">{store.key}</div>
  {#each enumerate(proto, $store, store) as [k, v, s, t]}
    {#if s}
      {#if t==='object' && !Array.isArray(v)}
        <svelte:self store={s} proto={proto[k]}/>
      {:else}
        <svelte:component this={map[t]} store={s} label={k} />
      {/if}
      <button on:click={()=>deletekey(k)}>X</button>
    {:else if t==='object' && !Array.isArray(v)}
      <div class="overridecontainer">
        <button on:click={addParentOverride(k,{})}>{getParentOverrideString(k)}</button>
      </div>
    {:else}
      <div class="overridecontainer">
        <button on:click={addParentOverride(k,v)}>{getParentOverrideString(k,v)}</button>
      </div>
    {/if}
  {/each}
  <div class="additioner">
    <button on:click={additem}>Add Item:</button>
    <select name="opttypes" id="opttypes" bind:value={type}>
      {#each iterate_enum(ValueType) as [k,v]}
        <option value={v}>{k}</option>
      {/each}
    </select>
    <input type="text" bind:value={key}>
  </div>
</div>

<style>
  .obmodule {
    border: 1px white solid;
    margin: 5px;
  }
  .nameo {
    text-transform: capitalize;
    text-decoration: underline;
    color: black;
    background-color: white;
  }
  .overridecontainer {
    border: 3px solid purple;
    margin: 3px;
  }
</style>