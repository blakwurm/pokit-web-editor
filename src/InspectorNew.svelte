<script lang="ts">
  import NestedStore from "./NestedStore"
  import ObjectEditor from "./component-items/ObjectEditor.svelte"
  import {appdata, currentBrush} from "./stores"

  let nest = new NestedStore(appdata, "entities", $appdata.currentBrush, "components");
</script>

<h3>Selected In Scene</h3>
<h3>Active Brush</h3>
{#each Object.entries($currentBrush.components) as [c,v]}
  <!-- <h4>{c.toLocaleUpperCase()}</h4> -->
  <div class="componentcontainer">
    <ObjectEditor store={nest.drill(c)} />
  </div>
{/each}
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