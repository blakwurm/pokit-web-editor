<script lang="ts">
import { onMount } from "svelte";
import {spritemap} from './stores'
import { vectorMultiply } from "./utils";


    export let width: number
    export let height: number
    export let indX: number
    export let indY: number

    let canvo: HTMLCanvasElement
    $:render(canvo, $spritemap);
    function render(c: HTMLCanvasElement, atlas: HTMLImageElement) {
        if(!c) return;
        let ctx = c.getContext('2d');
        let pos = {x:indX,y:indY};
        let dims = {x:width,y:height};
        pos = vectorMultiply(pos,dims);
        ctx.drawImage(atlas, pos.x, pos.y, width,height, 0, 0, width, height);
    }
</script>

    <canvas {width} {height} bind:this={canvo}></canvas>


<style>
    canvas {
        height: 100%;
        width: 100%;
    }
</style>