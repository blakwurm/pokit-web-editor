<script lang="ts">
  import type NestedStore from "../NestedStore";

  import type { Identity, Vector } from "../pokit.types";
  import SpritePickerModal from "../SpritePickerModal.svelte";

  export let store: Record<string,any>;
  
  let visible = false;

  function onSelectSprite(e: any) {
    store.update(c=>{
      if(!c.identity)c.identity = {};
      console.log(e);
      c.identity.bounds = e.detail.bounds;
      c.sprite.source = e.detail.source;
      return c;
    })
  }
</script>

<button on:click={()=>visible=true}>pick sprite</button>

<SpritePickerModal bind:visible on:select={onSelectSprite}/>