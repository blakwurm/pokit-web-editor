<script lang="ts">
  import { text } from "svelte/internal";
  import {currentBrush} from "./stores"
  import ObjectEditor from "./ObjectEditor.svelte";
  import ComponentView from './typefields/ComponentView.svelte'
  import * as love from "immer-loves-svelte";

  function makeComponentStore(name: string) {
    return love.subStore(currentBrush, (x)=>
      x.components[name] 
    )
  }
$:console.log($currentBrush)
</script>


    <ComponentView entitystore={currentBrush}></ComponentView>
<!-- <ul class="componentlist">
  {#each Object.entries($currentBrush.components) as [name,component]}
    <hr />
  {/each} -->
  <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button>
<!-- </ul> -->