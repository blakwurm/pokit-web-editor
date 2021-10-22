<script lang="ts">
  import NestedStore from "./NestedStore"
  import ObjectEditor from "./component-items/ObjectEditor.svelte"
  import {appdata, currentBrush, entities} from "./stores"
  import { deepClone, deepMerge, defaultParentNoGlobals } from "./utils";
  import { applyInheritance, resolveLineage } from "./MapCanvas"
  import type { EntityStub, Identity } from "./pokit.types";
  import ArrayItem from "./component-items/ArrayItem.svelte";
  import InstanceEditor from "./component-items/InstanceEditor.svelte";
import SpritePicker from "./component-items/SpritePicker.svelte";

  console.log(appdata);
  let nest_root = new NestedStore(appdata, "entities", $appdata.currentBrush);
  $: nest_root = new NestedStore(appdata, "entities", $appdata.currentBrush);
  let nest = nest_root.drill("components")
  $: nest = nest_root.drill("components")
  entities.update(e=>{
    e["__DEFAULT_PARENT__"] = {
      inherits: [],
      components: {
        identity: defaultParentNoGlobals
      }
    };
    return e;
  });
  $:lin = resolveLineage($appdata.currentBrush, $appdata.entities);
  $:lin.push("__DEFAULT_PARENT__")
  $:prototype = applyInheritance(lin, $appdata.entities) as EntityStub;
  let key: string = "newcomp"

  // $:inspecting = new NestedStore(appdata, 'scenes', $appdata.inspecting[0], 'entities', $appdata.inspecting[1], $appdata.inspecting[2])
  // function buildMutable(v: any) {
  //   mut = deepClone($appdata.entities);
  //   mut["__DEFAULT_PARENT__"] = {
  //     inherits: [],
  //     components: {
  //       identity: defaultParentNoGlobals
  //     }
  //   };
  // }
  function addComponent() {
    nest.update(n=>{
      n[key] = {};
      return n;
    })
  }
  function overrideParent(key: string) {
    nest.update(n=>{
      n[key] = {};
      return n;
    })
  }
</script>

<InstanceEditor />

<h3>Active Brush: {$currentBrush}</h3>
<div class="inheritcontainer">
  <ArrayItem store={nest_root.drill("inherits")} />
</div>
{#each Object.entries(prototype.components) as [c,v]}
  {#if $nest[c]}
    <!-- <h4>{c.toLocaleUpperCase()}</h4> -->
    <div class="componentcontainer">
      {#if c==="sprite"}
        <SpritePicker store={nest}/>
      {:else}
        <ObjectEditor store={nest.drill(c)} proto={v} />
      {/if}
    </div>
  {:else}
    <div class="overridecontainer">
      <button on:click={()=>overrideParent(c)}>Override parent:{c}</button>
    </div>
  {/if}
{/each}
<button on:click={addComponent}>Add Component:</button>
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
  .overridecontainer {
    border: 3px solid purple;
    margin: 3px;
  }
  .inheritcontainer {
    border: 3px solid green;
    margin: 3px;
  }
</style>