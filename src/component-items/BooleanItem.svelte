<script lang="ts">
  import type { Writable } from "svelte/store";
  import { uuid } from "../utils";
  export let store: Writable<boolean>;
  export let label: string;


  let id = uuid();
</script>
<label for={id}>{label}</label>
<input type="checkbox" id={id} bind:checked={$store} />
