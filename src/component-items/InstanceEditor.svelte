<script lang="ts">
  import { applyInheritance, resolveLineage } from "../MapCanvas";

  import NestedStore from "../NestedStore";
  import type { EntityStub, Identity } from "../pokit.types";
  import { appdata, entities, inspecting } from "../stores";
  import { deepMerge } from "../utils";
  import ObjectEditor from "./ObjectEditor.svelte";

  let inspectedInstance: NestedStore<Identity>;

  $: makeStores($inspecting);

  function makeStores([scene, stub, index]: [string,string,number]) {
    inspectedInstance = new NestedStore(appdata, "scenes", scene, "entities", stub, index);
  }

  function makePrototype(entities: Record<string, EntityStub>) {
    let lin = resolveLineage($inspecting[1], entities);
    lin.push("__DEFAULT_PARENT__");
    let proto = applyInheritance(lin, entities).components.identity;
    return deepMerge($inspectedInstance, proto);
  }
</script>

{#if $inspectedInstance}
  <h3>Selected Instance: {$inspecting.join(' : ')}</h3>
  <div class="instanceeditor">
    <ObjectEditor proto={makePrototype($entities)} store={inspectedInstance} />
  </div>
{/if}

<style>
  .instanceeditor {
    border: 3px solid orangered;
    margin: 3px;
  }
</style>