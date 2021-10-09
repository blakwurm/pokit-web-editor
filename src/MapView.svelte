<script lang="ts">
import { onMount } from "svelte";


    export let canv: HTMLCanvasElement
    let canvcontainer: HTMLDivElement
    console.log('canvas is ', canv)
    $:console.log(canv)
    onMount(()=>{
        canvcontainer.appendChild(canv)
    }) 
    
</script>

<div id="canvcontainer" bind:this={canvcontainer}></div>
Y'hello