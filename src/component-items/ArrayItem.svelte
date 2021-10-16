<script lang="ts">
  import BooleanItem from "./BooleanItem.svelte";
  import NumberItem from "./NumberItem.svelte";
  import StringItem from "./StringItem.svelte";
  import type NestedStore from "../NestedStore";
  import ObjectEditor from "./ObjectEditor.svelte";
  import ColorPicker from './ColorPicker.svelte'
import { iterate_enum, ValueType } from "../stores";
  export let store: NestedStore<any[]>


  let map = {
    object: ObjectEditor,
    number: NumberItem,
    string: StringItem,
    boolean: BooleanItem
  }

  function enumerate(arr: any[], store: NestedStore<any[]>) {
    console.log(arr, arr.map);
    return arr.map((v, i)=>{
      return {k:i,v,s:store.drill(i++), t:typeof v}
    })
  }
  let currentarray = $store
  function swapinstore(a:number, b:number) {
    let newarray = [...currentarray]
    let av = newarray[a];
    let bv = newarray[b];
    newarray[b]=av
    newarray[a]=bv
    store.set(newarray)
  }

  let type: ValueType = ValueType.STRING;
  let valueMap=["",0,false,[],{}]
  function updateArr() {
    store.update(a=>{
      a.push(valueMap[type]);
      return a;
    })
  }
</script>
{#if store.key.toString().toLocaleLowerCase().endsWith('color')}
  <ColorPicker bind:r={$store[0]} bind:g={$store[1]} bind:b={$store[2]} bind:a={$store[3]}></ColorPicker>
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
    <button on:click={()=>swapinstore(thingy.v, thingy.v+1)}>up</button>
    <button on:click={()=>swapinstore(thingy.v, thingy.v-1)}>down</button>
  </li>
  {/each}

  </ol>
  <div class="additioner">
    <button on:click={updateArr}>Add Item:</button>
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