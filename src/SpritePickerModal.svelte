<script lang="ts">
    import { createEventDispatcher } from 'svelte'
    import ModalBase from './ModalBase.svelte'
    import {spritemap} from './stores'

    let selectX = 0
    let selectY = 0
    let lengthX = 1
    let lengthY = 1

    const dispatch = createEventDispatcher()

    function finalSelect() {
        dispatch('select', {selectX, selectY, lengthX, lengthY})
    }



    

</script>

<ModalBase confirmable on:confirm={finalSelect}>
    <div class="canvcontainer">
        <p>Pick a sprite series</p>
        <canvas></canvas>
    </div>
</ModalBase>

<style>
    p {
        margin: 5px;
    }
    .canvcontainer {
        height: 100%;
    }
</style>