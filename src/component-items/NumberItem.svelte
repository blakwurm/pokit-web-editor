<script lang="ts">
  import type { Writable } from "svelte/store";
  export let store: Writable<number>;
    export let id: string
</script>
<input type="number" id={id} bind:value={$store} />