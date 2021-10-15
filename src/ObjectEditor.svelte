<script lang="ts">
  import * as love from "immer-loves-svelte"
  import ArrayItem from "./component-items/ArrayItem.svelte";
  import NumberItem from "./component-items/NumberItem.svelte";
  import StringItem from "./component-items/StringItem.svelte";
  import BooleanItem from "./component-items/BooleanItem.svelte";
  import type { Writable } from "svelte/store";
import { onMount } from "svelte";
  export let store: Writable<Record<string, any>>
  export let id: string;

  type pojo = Record<string, any>
  export let obedit: any
  let comps = {
    'object': ArrayItem,
    'number': NumberItem,
    'string': StringItem,
    'boolean': BooleanItem,
  }

  function preploop(o: pojo) {
    let sub = Object.entries(o).map(
      ([k,v])=>[k, v, typeof v, o, `${id}_${k}`]
    )
      console.log('subby', sub) 
    return sub
  }

  function unwrapStores(o: Record<string, any>, s: Writable<Record<string, any>>) {
    let sub = Object.entries(o).map(
        ([k,v])=>[k, v, typeof v, `${id}_${k}`]
      )
    return sub
  }
  $:console.log($store)
</script>
<ul class="objectview">
  <!-- {#each unwrapStores($store, store) as [k, v, t, newid]} -->
  {#each preploop($store) as [key, value, thetype, p, newid]}
  <!--{@html `</!--${newid = 'fuckyou'}--\>`} Jordan's fault-->
    <li class='componentitem'>
      <label for={newid}>{key}</label>
      {#if thetype === 'object' && !Array.isArray(value)}
        <svelte:self id={newid} key parent={p}></svelte:self>
      {:else}
        <svelte:component this={comps[thetype]} newid key parent={p}></svelte:component>
      {/if}
      <button>-</button>
    </li>
  {/each}
</ul>
