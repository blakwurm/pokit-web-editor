<script lang="ts">
  import type { Writable } from "svelte/store";
  export let store: Writable<number>;
</script>
<input type="text" bind:value={$store} />