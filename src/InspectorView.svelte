<script lang="ts">
  import { text } from "svelte/internal";
  import {appdata, currentBrush, nested} from "./stores"
  import ObjectEditor from "./component-items/ObjectEditor.svelte";
  import * as love from "immer-loves-svelte";
import app from "./main";

  function makeComponentStore(name: string) {
    return love.subStore(currentBrush, (x)=>
      x.components[name] 
    )
  }

  let fuck = true
  let fuckvalue: string | undefined = null
  $:console.log($appdata.entities.defaultbrush.components.fak.blob)
</script>

<ul class="componentlist">
    <input type="checkbox" bind:checked={$nested}>
  {#each Object.entries($currentBrush.components) as [name,]}
    <li class="componentview">
      <h4>{name}</h4>
      <!-- <ObjectEditor id={name} store={makeComponentStore(name)}/> -->
    </li>
    <hr />
  {/each}
  <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button>
</ul>