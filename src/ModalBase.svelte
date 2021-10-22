<script lang="ts">
import { createEventDispatcher } from 'svelte'

const dispatch = createEventDispatcher()

    export let confirmable: boolean = false    
    export let cancelable: boolean = true

    export let visible = true

    function confirm() {
        dispatch('confirm')
        visible = false
    }
    function cancel() {
        console.log('cancel start')
        dispatch('cancel')
        visible = false
        console.log('cancel end')
    }

</script>

{#if visible}
    <div class="blur" on:click={cancel}></div>

    <div class="content">
        <button class="xbutton" on:click={cancel}>&#10006;</button>
        <div class="slotcontainer">
            <slot></slot>
        </div>
        <div class="buttonbar">
            {#if confirmable}
                <button on:click={confirm}>Confirm</button> 
            {/if}
            {#if cancelable}
                <button on:click={cancel}>Cancel</button> 
            {/if}
        </div>
    </div>
{/if}



<style>

    .blur {
        display: block;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 999;
        background: hsla(0, 0%, 0%, 0.5);
    }

    .content {
        z-index: 1001;
        display: block;
        position: fixed;
        background: black;
        top: 50px;
        right: 0px;
        left: 0px;
        margin: 0 auto;
        bottom: 50px;
        min-width: 200px;
        width: 75vmax;
        max-width: 80vw;
        height: 75vh;
        min-height: 300px;
        max-height: 600px;
        border: 8px beige outset;
        border-radius: 5px;
        padding: 5px;
    }

    .content button {
        color: white;
        border: 3px double white;
        background: black;
        padding: 2px;
    }

    .xbutton {
        position: absolute;
        right: 5px;
        top: 5px;
        height: 2em;
        width: 2em;
    }

    .buttonbar {
        display: flex;
        justify-content: center;
        position: absolute;
        bottom: 5px;
        left: 0;
        right: 0;
    }
    .slotcontainer {
        width: auto;
        height: calc(100% - 2em + 3px);
    }
    
</style>