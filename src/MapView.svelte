<script lang="ts">
import { onMount } from "svelte";
import type { MapCanvas } from "./MapCanvas";
import { appdata, iterate_enum, ToolType } from "./stores";


    export let desktop: boolean = false
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


    let grid_x = 32;
    let grid_y = 32;
    let snap_x;
    let snap_y;
    $:{
        mapcanvas.gridX = grid_x;
        mapcanvas.gridY = grid_y;
        mapcanvas.snapX = snap_x;
        mapcanvas.snapY = snap_y;
        mapcanvas.dirty = true;
    }
    
</script>

<div class="maincontainer">
    <div class="tools">
        <ul>
            {#each iterate_enum(ToolType) as [k,v]}
                <li>
                    <button on:click={bestoflu(k,v)}>{k}</button>
                </li>
            {/each}
        </ul>
    </div>
    <div id="canvcontainer" bind:this={canvcontainer} style="max-width:{screendims.width}px;max-height:{screendims.height}px;"></div>

    <div class="grid-settings">
        <ul>
            <li>
                <label for="grid_x">X Snap:</label>
                <input type="number" id="grid_x" bind:value={grid_x} />
                <input type="checkbox" id="snap_x" bind:checked={snap_x} />
            </li>
            <li>
                <label for="grid_y">Y Snap:</label>
                <input type="number" id="grid_y" bind:value={grid_y} />
                <input type="checkbox" id="snap_y" bind:checked={snap_y} />
            </li>
        </ul>
    </div>

</div>

<style>
    .maincontainer {
        position: relative;
    }
    #canvcontainer {
        /* background: white; */
        overflow: hidden;
        width: unset;
        height: unset;
    }
    .tools {
        position: absolute;
        bottom: 40px;
        left: 0;
    }
    .grid-settings {
        position: absolute;
        bottom: 40px;
        right: 5px;
    }
    label {
        color: black;
    }
</style>
