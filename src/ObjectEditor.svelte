<script lang="ts">
  import * as love from "immer-loves-svelte"
  import ArrayItem from "./component-items/ArrayItem.svelte";
  import NumberItem from "./component-items/NumberItem.svelte";
  import StringItem from "./component-items/StringItem.svelte";
  import BooleanItem from "./component-items/BooleanItem.svelte";
  import type { Writable } from "svelte/store";
  export let store: Writable<Record<string, any>>
  export let id: string;

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

  let newid;
</script>
<ul class="objectview">
  {#each unwrapStores($store, store) as [k, v, t, s]}
    <script lang="ts">
      newid = id+"_"+k;
    </script>
    <li class='componentitem'>
      <label for={newid}>{k}</label>
      {#if t === 'object' && !Array.isArray(v)}
        <svelte:self id={newid} store={s}></svelte:self>
      {:else}
        <svelte:component this={comps[t]} id={newid} store = {s}></svelte:component>
      {/if}
      <button>-</button>
    </li>
  {/each}
</ul>
