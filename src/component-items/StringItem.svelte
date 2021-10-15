<script lang="ts">
  import type { Writable } from "svelte/store";
  export let store: Writable<number>;
  let id: string
</script>
<input type="text" id={id} bind:value={$store} />