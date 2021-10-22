<script lang="ts">
    import SpriteDisplay from './SpriteDisplay.svelte'
    let canvo: HTMLCanvasElement
</script>

<ul class="spriterow">
    <li>
        <button><SpriteDisplay width={32} height={32} indX={4} indY={2}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={5} indY={4}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={6} indY={3}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={9} indY={1}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={4} indY={2}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={5} indY={4}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={6} indY={3}></SpriteDisplay></button>
    </li>
    <li>
        <button><SpriteDisplay width={32} height={32} indX={9} indY={1}></SpriteDisplay></button>
    </li>
</ul>
<div class="canvcontainer">
    <canvas bind:this={canvo}></canvas>
</div>

<style>
    .canvcontainer {
        height: calc(100% - 50px);
        width: calc(100%);
        overflow: scroll;
        border: blue 1px solid;
    }
    ul.spriterow {
        display: flex;
        width: 100%;
        overflow: scroll;
    }
    ul.spriterow li button {
        height: 50px;
        width: 50px;
        border: 1px solid white;
    }
    ul.spriterow li button {
        height: 40px;
        width: 40px;
    }

</style>
