<script lang="ts">
    import Split from '@geoffcox/svelte-splitter/src/Split.svelte'
	import MapView from './MapView.svelte'
	import InspectorView from './InspectorNew.svelte'
	import PaletteView from './PaletteView.svelte'
	import FileView from './FileView.svelte'
    import type { MapCanvas } from "./MapCanvas";
    import * as util from './util'

    export let mapcanvas: MapCanvas
    export let innerWidth: number
    export let innerHeight: number
    let splitWidth = 0.75
    let splitHeight = 0.75
    $: mainWidth = innerWidth * splitWidth
    $: mainHeight = innerHeight * splitHeight
    export let canv: HTMLCanvasElement
    $: screendims = {width: mainWidth, height: mainHeight}
</script>


<div id="content" style="--canvwidth:{mainWidth}px;--canvheight:{mainHeight}px;">
    <input id="widesplit" type="range" min=0 max=1 step=0.01 bind:value={splitWidth}>
    <input id="tallsplit" type="range" min=0 max=1 step=0.01 bind:value={splitHeight}>
    <main>
        <MapView {screendims} {canv} {mapcanvas} desktop></MapView>
    </main>
    <aside>
        <InspectorView></InspectorView>
    </aside>
    <footer>
        <PaletteView desktop></PaletteView>
    </footer>
</div>
    <!-- <Split initialPrimarySize='70%'>
        <svelte:fragment slot="primary">
          <Split horizontal initialPrimarySize='60%'>
            <div slot="primary">This is the right-top pane.</div>
            <div slot="secondary">This is the right-bottom pane.</div>
          </Split>
        </svelte:fragment>
        <div slot="secondary">This is the left pane.</div>
      </Split> -->
    <!-- <Split>
        <Split >
        </Split>
    </Split> -->
    
    

<style>
    div#content {
        --canvwidth: 400px;
        --canvheight: 400px;
        position: absolute;
        top: 10px;
        bottom: 10px;
        left: 10px;
        right: 10px;
        border: 10px inset beige;
        overflow: hidden;
        display: grid;
        grid-template-columns: 20px var(--canvwidth) auto;
        grid-template-rows: 20px var(--canvheight) auto;
        grid-template-areas:
        '. wideslide wideslide'
        ' tallslide main side'
        ' tallslide foot side';
    }
    main {
        grid-area: main;
    }
    aside {
        grid-area: side;
        overflow-y: scroll;
    }
    footer {
        grid-area: foot;
        overflow-y: scroll;
    }
    #widesplit {
        grid-area: wideslide;
    }
    #tallsplit {
        grid-area: tallslide;
        -webkit-appearance: slider-vertical;
        transform: rotate(180deg);
    }
</style>