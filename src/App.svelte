<script lang="ts">
	import MapView from './MapView.svelte'
	import InspectorView from './InspectorView.svelte'
	import PaletteView from './PaletteView.svelte'
	import FileView from './FileView.svelte'
	export let name: string;
	import * as util from './util.js'
import { MapCanvas } from './MapCanvas';

	let canv = document.createElement('canvas')
	canv.height = 300
	canv.width = 300

	let mapcanvas = new MapCanvas(canv)
	//@ts-ignore
	window.mapcanvas = mapcanvas

	let views = {
		file: FileView,
		map: MapView,
		inspector: InspectorView,
		palette: PaletteView
	}
	let activeView = location.hash.substr(1) || 'file'
	console.log(location.hash)
	$: location.hash = "#" + activeView

	let innerWidth = window.innerWidth
	let innerHeight = window.innerHeight

	$: screendims = {width: innerWidth - 30, height: innerHeight - 70}

	$: console.log(innerWidth, innerHeight)
</script>

<svelte:window bind:innerHeight bind:innerWidth />

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