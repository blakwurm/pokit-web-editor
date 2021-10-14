<script lang="ts">
  import { text } from "svelte/internal";
import {currentBrush} from "./stores"
</script>

<ul class="componentlist">
  {#each Object.entries($currentBrush.components) as [name,comp]}
    <li class="componentview">
      <h4>{name}</h4>
      <ul class="componentsublist">
        {#each Object.entries(comp) as [k,v]}
          <li class="componentitem">
            <label for="componentkey">{k}:</label>
            {#if typeof v !== 'object'}
              <input type="text" id="componentkey" value={$currentBrush.components[name][k]} />
              {console.log(v)}
            {:else}
              <span id="componentkey">coming soon...</span>
            {/if}
            <button>-</button>
          </li>
        {/each}
        <label for="newcomponentitem">Add item: </label>
        <input type="text" />
        <button>+</button>
      </ul>
    </li>
    <hr />
  {/each}
  <label for="newcomponent">Add component: </label>
  <input id="newcomponent" type="text" />
  <button>+</button>
</ul>