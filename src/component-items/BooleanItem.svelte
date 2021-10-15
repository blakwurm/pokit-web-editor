<script lang="ts">
  import type { Writable } from "svelte/store";
  export let parent: Record<string, any>
  export let id: string
  export let key: string
  let checked: boolean = parent[key]
  $:parent[key] = checked
  $:console.log(parent)
</script>
<input type="checkbox" id={id} bind:checked />
