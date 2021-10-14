<script lang="ts">
  import { text } from "svelte/internal";
  import {currentBrush} from "./stores"
  import ObjectEditor from "./ObjectEditor.svelte";
  import * as love from "immer-loves-svelte";

  function makeComponentStore(name: string) {
    return love.subStore(currentBrush, (x)=>
      x.components[name] 
    )
  }
</script>

<ul class="componentlist">
  {#each Object.entries($currentBrush.components) as [name,]}
    <li class="componentview">
      <h4>{name}</h4>
      <ObjectEditor id={name} store={makeComponentStore(name)}/>
    </li>
    <hr />
  {/each}
  <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button>
</ul>