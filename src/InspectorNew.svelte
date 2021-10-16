<script lang="ts">
  import NestedStore from "./NestedStore"
  import ObjectEditor from "./component-items/ObjectEditor.svelte"
  import {appdata, currentBrush} from "./stores"
  import { deepClone, defaultParent } from "./utils";
  import { applyInheritance, resolveLineage } from "./MapCanvas"
import type { EntityStub } from "./pokit.types";
import ArrayItem from "./component-items/ArrayItem.svelte";

  let nest_root = new NestedStore(appdata, "entities", $appdata.currentBrush);
  let nest = nest_root.drill("components")
  let mut = deepClone($appdata.entities);
  mut["__DEFAULT_PARENT__"] = {
    inherits: [],
    components: {
      identity: defaultParent
    }
  };
  $:lin = resolveLineage($appdata.currentBrush, mut);
  $:lin.push("__DEFAULT_PARENT__")
  $:prototype = applyInheritance(lin, mut) as EntityStub;
  let key: string = "newcomp"
  let inherits = nest_root.drill("inherits") as NestedStore<string[]>
  // $:inspecting = new NestedStore(appdata, 'scenes', $appdata.inspecting[0], 'entities', $appdata.inspecting[1], $appdata.inspecting[2])
</script>

<!-- {#if $inspecting} 
  <h3>Selected In Scene</h3>
  <ObjectEditor store={inspecting}></ObjectEditor>
{/if} -->
<h3>Active Brush</h3>
<ArrayItem store={inherits} />
{#each Object.entries(prototype.components) as [c,v]}
  {#if $nest[c]}
    <!-- <h4>{c.toLocaleUpperCase()}</h4> -->
    <div class="componentcontainer">
      <ObjectEditor store={nest.drill(c)} proto={prototype.components[c]} />
    </div>
  {:else}
    <button on:click={()=>$nest[c]={}}>Override parent:{c}</button>
  {/if}
{/each}
<button on:click={()=>$nest[key] = {}}>Add Component:</button>
<input type="text" bind:value={key} />
<!-- <ul class="componentlist">
  {#each Object.entries($currentBrush.components) as [name,component]}
    <hr />
  {/each} -->
  <!-- <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button> --> 
<!-- </ul> -->

<style>
  .componentcontainer {
    border: 3px solid blue;
    margin: 3px;
  }
</style>