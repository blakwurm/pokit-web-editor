<script lang="ts">
  import NestedStore from "./NestedStore"
  import ObjectEditor from "./component-items/ObjectEditor.svelte"
  import {appdata, currentBrush} from "./stores"
  import ComponentView from './typefields/ComponentView.svelte'

  let nest = new NestedStore(appdata, "entities", $appdata.currentBrush, "components");
</script>


{#each Object.entries($currentBrush.components) as [c,v]}
  <h4>{c.toLocaleUpperCase()}</h4>
  <ObjectEditor store={nest.drill(c)} />
{/each}
<!-- <ul class="componentlist">
  {#each Object.entries($currentBrush.components) as [name,component]}
    <hr />
  {/each} -->
  <!-- <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button> --> 
<!-- </ul> -->