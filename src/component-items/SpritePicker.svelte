<script lang="ts">
  import type NestedStore from "../NestedStore";

  import type { Identity, Vector } from "../pokit.types";
  import SpritePickerModal from "../SpritePickerModal.svelte";


  export let sprite: NestedStore<{source:Vector}>;
  export let identity: NestedStore<Identity>;
  
  if(!$identity) $identity = {};
  let bounds = identity.drill<Vector>("bounds");

  let source = sprite.drill<Vector>("source");
  let visible = false;

  function onSelectSprite(e: any) {
    if(!$identity) $identity={};
    $source = e.detail.source;
    $bounds = e.detail.bounds;
  }
</script>

<button on:click={()=>visible=true}>pick sprite</button>

<SpritePickerModal bind:visible on:select={onSelectSprite}/>