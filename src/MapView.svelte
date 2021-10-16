<script lang="ts">
import { onMount } from "svelte";
import type { MapCanvas } from "./MapCanvas";
import { appdata, ToolType } from "./stores";


    export let canv: HTMLCanvasElement
    let canvcontainer: HTMLDivElement
    export let screendims: {width:number, height:number}
    export let mapcanvas: MapCanvas
    $:{
        canv.width = screendims.width;
        canv.height = screendims.height;
        mapcanvas.dirty = true;
        console.log("screen dims are", screendims);
    }
    console.log('canvas is ', canv)
    $:console.log(canv)
    onMount(()=>{
        canvcontainer.appendChild(canv)
    }) 

    let currentool = ToolType.BRUSH
    function bestoflu(k,v) {
        return function(ev) {
            $appdata.currentTool = v as ToolType
        }
    }

    function iterate_enum(stupidenum: pojo) {
        let foo = Object.entries(stupidenum).filter(([e])=>isNaN(Number(e)))
        console.log(foo)
        return foo
    }
    
</script>

<div class="tools">
    <ul>
        {#each iterate_enum(ToolType) as [k,v]}
            <li>
                <button on:click={bestoflu(k,v)}>{k}</button>
            </li>
        {/each}
    </ul>
</div>
<div id="canvcontainer" bind:this={canvcontainer}></div>

<style>
    #canvcontainer {
        background: white;
    }
    .tools {
        position: fixed;
        bottom: 71px;
    }
    canvas {
        display: block;
        height: 100%;
        width: 100%;
        image-rendering: pixelated;
    }
</style>
