<script lang="ts">
import { onMount } from "svelte";
import { MapCanvas } from "./MapCanvas";


    export let canv: HTMLCanvasElement
    let canvcontainer: HTMLDivElement
    export let screendims: {x:number, y:number}
    export let mapcanvas: MapCanvas
    console.log('canvas is ', canv)
    $:console.log(canv)
    onMount(()=>{
        canvcontainer.appendChild(canv)
    }) 
    
</script>

<div id="canvcontainer" bind:this={canvcontainer}></div>

<style>
    #canvcontainer {
        background: red;
    }
    canvas {
        display: block;
        height: 100%;
        width: 100%;
        image-rendering: pixelated;
    }
</style>
