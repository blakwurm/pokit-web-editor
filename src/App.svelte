<script lang="ts">
	import MobileView from './MobileView.svelte'
	export let name: string;
	import * as util from './util.js'
import { MapCanvas } from './MapCanvas';
import DesktopView from './DesktopView.svelte'
import { appdata } from './stores';

	let canv = document.createElement('canvas')
	canv.height = 300
	canv.width = 300
	canv.id = "editor"

	let mapcanvas = new MapCanvas(canv)
	//@ts-ignore
	window.mapcanvas = mapcanvas

	let innerWidth = window.innerWidth
	let innerHeight = window.innerHeight


	$:console.log($appdata.currentBrush);
</script>

<svelte:window bind:innerHeight bind:innerWidth />

{#if innerWidth < 501}
	<MobileView {mapcanvas} {innerWidth} {innerHeight} {canv}></MobileView>	
{:else}
	<DesktopView {mapcanvas} {innerWidth} {innerHeight} {canv}></DesktopView>	
{/if}