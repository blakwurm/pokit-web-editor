<script lang="ts">
    import type {Writable} from 'svelte/store'
    export let key: string
    export let store: Writable<boolean>
    let id = Math.random().toString()
    $: parent[key] = $store
    $: console.log($store)
</script>

<label for="{id}">{key}</label>
<input type="checkbox" bind:checked={$store} />