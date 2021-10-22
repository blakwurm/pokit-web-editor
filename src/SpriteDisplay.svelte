<script lang="ts">
import { onMount } from "svelte";
import {spritemap} from './stores'


    export let width: number
    export let height: number
    export let indX: number
    export let indY: number

    let canvo: HTMLCanvasElement
    onMount(() => {
        
    })
</script>

    <canvas bind:this={canvo}></canvas>


<style>
    canvas {
        height: 100%;
        width: 100%;
    }
</style>