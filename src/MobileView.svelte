
<script lang="ts">
	import MapView from './MapView.svelte'
	import InspectorView from './InspectorView.svelte'
	import PaletteView from './PaletteView.svelte'
	import FileView from './FileView.svelte'
	import TileMapEditor from './TileMapEditor.svelte'
    import type { MapCanvas } from "./MapCanvas";
    import * as util from './util'

    export let mapcanvas: MapCanvas
    export let innerWidth: number
    export let innerHeight: number
    export let canv: HTMLCanvasElement

	let views = {
		file: FileView,
		map: MapView,
		inspector: InspectorView,
		palette: PaletteView,
		tilemap: TileMapEditor
	}

	let activeView = location.hash.substr(1) || 'file'
    $: location.hash = "#" + activeView
    $: screendims = {width: innerWidth - 57, height: innerHeight - 96}
</script>
<main> 
    <svelte:component this={views[activeView]} canv={canv} mapcanvas={mapcanvas} screendims={screendims}/>
</main>
<footer>
	{#each Object.entries(views) as [name, view]}
		<button class:selected={activeView===name} on:click={e=>activeView=name}>{util.capEveryWord(name)}</button>
	{/each}
</footer>

<style>
	main {
		position: absolute;
		padding: 10px;
		border: beige 10px inset;
		top: 0;
		bottom: 50px;
		left: 0;
		right: 0;
		overflow-y: scroll;
	}
	footer {
		position: absolute;
		top: calc(100vh - 50px);
		bottom: 0;
		left: 0;
		right: 0;
		padding: 5px;
		background: beige;
		display: flex;
	}
	footer button {
		color: black;
		font-family: Arial, Helvetica, sans-serif;
		margin: 0 auto;
		width: 20%;
		border: 5px grey outset;
		border-radius: 15px;
	}
	footer button.selected {
		border: 5px grey inset;
	}
</style>