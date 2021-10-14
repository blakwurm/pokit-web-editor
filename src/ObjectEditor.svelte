<script lang="ts">
  import type { Substore } from "immer-loves-svelte/build/main/lib/subStore";
  import * as love from "immer-loves-svelte"
  import ArrayItem from "./component-items/ArrayItem.svelte";
  import NumberItem from "./component-items/NumberItem.svelte";
  import StringItem from "./component-items/StringItem.svelte";
  import BooleanItem from "./component-items/BooleanItem.svelte";
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";
  export let store: Writable<Record<string, any>>
     

    let obeditor: any

  let comps = {
    'object': ArrayItem,
    'number': NumberItem,
    'string': StringItem,
    'boolean': BooleanItem,
  }

  function unwrapStores(o: Record<string, any>, s: Writable<Record<string, any>>) {
    let sub = Object.entries(o).map(
        ([k,v])=>[k, v, typeof v, love.subStore(s, o2=>o2[k])]
      )
    return sub
  }

  let objComp = (o: Record<string, any>) => Object.entries(o).map(([k,v])=>[k, typeof v, v])
  
</script>

{#each unwrapStores($store, store) as [k, t, v, s]}
    {#if t === 'object' && !Array.isArray(v)}
      <svelte:self store={s}></svelte:self>
    {:else}
      <svelte:component this={comps[t]} store = {s}></svelte:component>
    {/if}
{/each}
