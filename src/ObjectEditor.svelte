<script lang="ts">
  import type { Substore } from "immer-loves-svelte/build/main/lib/subStore";
  import ArrayItem from "./component-items/ArrayItem.svelte";
  import NumberItem from "./component-items/NumberItem.svelte";
  import StringItem from "./component-items/StringItem.svelte";
  import BooleanItem from "./component-items/BooleanItem.svelte";
  export let obj: any;
  export let store: Substore<any>;

  let comps = {
    'array': ArrayItem,
    'number': NumberItem,
    'string': StringItem,
    'boolean': BooleanItem,
    'object': ????
  }
</script>