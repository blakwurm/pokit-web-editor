<script lang="ts">
  import ArrayItem from "./ArrayItem.svelte";
  import BooleanItem from "./BooleanItem.svelte";
  import NumberItem from "./NumberItem.svelte";
  import StringItem from "./StringItem.svelte";
  import type NestedStore from "../NestedStore";
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
</script>

{#each enumerate($store, store) as [k, v, s, t]}
  {#if t==='object' && !Array.isArray(v)}
    <svelte:self store={s} />
  {:else}
    <svelte:component this={map[t]} store={s} label={k} />
  {/if}
{/each}
