<script lang="ts">
  import ArrayItem from "./ArrayItem.svelte";
  import BooleanItem from "./BooleanItem.svelte";
  import NumberItem from "./NumberItem.svelte";
  import StringItem from "./StringItem.svelte";
  import type NestedStore from "../NestedStore";
  import { iterate_enum, ValueType } from "../stores";
  export let store: NestedStore<pojo>
  
  
  let map = {
    object: ArrayItem,
    number: NumberItem,
    string: StringItem,
    boolean: BooleanItem
  }
  function enumerate(obj: pojo, store: NestedStore<pojo>): [string, any, NestedStore<any>, string][] {
    console.log(store, obj);
    return Object.entries(obj).map(([k,v])=>{
      return [k, v, store.drill(k), typeof v]
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
</script>

<!-- <div>{JSON.stringify(store.path)}</div> -->
<div class="obmodule">
  <div class="nameo">{store.key}</div>
  {#each enumerate($store, store) as [k, v, s, t]}
    {#if t==='object' && !Array.isArray(v)}
      <svelte:self store={s} />
    {:else}
      <svelte:component this={map[t]} store={s} label={k} />
    {/if}
    <button on:click={()=>delete $store[k]}>X</button>
  {/each}
  <div class="additioner">
    <button on:click={()=>$store[key]=valueMap[type]}>Add Item:</button>
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
</style>