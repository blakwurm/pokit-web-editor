<script lang="ts">
  import type { Writable } from "svelte/store";
  import { uuid } from "../utils";
  export let store: Writable<number>;
  export let label: string;

  let id = uuid();
</script>
<label for={id}>{label}</label>
<input type="number" id={id} bind:value={$store} />