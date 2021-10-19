<script lang="ts">
  import BooleanItem from "./BooleanItem.svelte";
  import NumberItem from "./NumberItem.svelte";
  import StringItem from "./StringItem.svelte";
  import type NestedStore from "../NestedStore";
  import ObjectEditor from "./ObjectEditor.svelte";
  import ColorPicker from './ColorPicker.svelte'
import { iterate_enum, ValueType } from "../stores";
  export let store: NestedStore<any[]>
  let storeR = store.drill<number>(0);
  let storeG = store.drill<number>(1);
  let storeB = store.drill<number>(2);
  let storeA = store.drill<number>(3);


  let map = {
    object: ObjectEditor,
    number: NumberItem,
    string: StringItem,
    boolean: BooleanItem
  }

  function enumerate(arr: any[], store: NestedStore<any[]>) {
    return arr.map((v, i)=>{
      return {k:i,v,s:store.drill(i++), t:typeof v}
    })
  }
  
  function movedown(i: number) {
    let value = $store[i]
    store.update(v=>{
      v.splice(i,1);
      v.splice(i+1,0,value);
      return v;
    })
  }

  function moveup(i: number) {
    let value = $store[i];
    store.update(v=>{
      v.splice(i,1);
      v.splice(i-1, 0, value);
      return v;
    })
  }

  let type: ValueType = ValueType.STRING;
  let valueMap=["",0,false,[],{}]
  function addArrItem() {
    store.update(a=>{
      a.push(valueMap[type]);
      return a;
    })
  }

  function delArrItem(i: number) {
    store.update(a=>{
      a.splice(i,1);
      return a;
    })
  }
</script>
{#if store.key.toString().toLocaleLowerCase().endsWith('color')}
  <ColorPicker bind:r={$storeR} bind:g={$storeG} bind:b={$storeB} bind:a={$storeA}></ColorPicker>
{:else}
<div class="arraycontainer">
  <div class="nameo">{store.key}</div>
  <ol>
  {#each enumerate($store, store) as thingy}
  <li>
    {#if Array.isArray(thingy.v)}
      <svelte:self store={thingy.s} />
    {:else}
      <svelte:component this={map[thingy.t]} store={thingy.s} label={thingy.k} />
    {/if}
    {#if thingy.k}<button on:click={()=>moveup(thingy.k)}>▲</button>{/if}
    {#if thingy.k < $store.length-1}<button on:click={()=>movedown(thingy.k)}>▼</button>{/if}
    <button on:click={()=>delArrItem(thingy.k)}>X</button>
  </li>
  {/each}

  </ol>
  <div class="additioner">
    <button on:click={addArrItem}>Add Item:</button>
    <select name="opttypes" id="opttypes" bind:value={type}>
      {#each iterate_enum(ValueType) as [k,v]}
        <option value={v}>{k}</option>
      {/each}
    </select>
  </div>
</div>
{/if}

<style>
  ol li {
    display: block;
    list-style: none;
    border: green 2px outset;
  }
  .arraycontainer {
    border: red 1px inset;
    margin: 6px;
  }
  .nameo {
    color: black;
    background-color: red;
  }
</style>