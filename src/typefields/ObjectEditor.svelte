<script lang="ts">
    type pojo = Record<string, any>
    export let key: string
    export let store: Writable<pojo>

    // Jordan wrote this
    import * as love from "immer-loves-svelte"
    import ArrayItem from "../component-items/ArrayItem.svelte";
    import NumberItem from "../component-items/NumberItem.svelte";
    import StringItem from "../component-items/StringItem.svelte";
    import BooleanItem from "./BoolEdit.svelte";
    import type { Writable } from "svelte/store";
    import { onMount, SvelteComponent } from "svelte";
import { barblast, sub_barblast } from "../stores";
    // okay yeah he wrote that

    export let obedit: SvelteComponent


    let comps = {
        'array': ArrayItem,
        'object': obedit,
        'number': NumberItem,
        'string': StringItem,
        'boolean': BooleanItem,
    }

    $:fooman = sub_barblast($store, store)
    $:console.log('fooman', fooman)
    type you = pojo
    function fu(k: you) {
        let foo = Object.entries(k).map(
            ([jimmy, neutron]) => [jimmy, neutron, comps[Array.isArray(neutron) ? 'array' : typeof neutron], fooman[jimmy]])
        console.log(foo)
        return foo
    }
    $:console.log($store)
    console.log(key)
</script>

foo
{#each fu($store) as [k, v, elem, store]}
    <svelte:component this={elem} store={store} key={key}></svelte:component>
{/each}