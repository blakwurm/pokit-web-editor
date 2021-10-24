<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte'
    import ModalBase from './ModalBase.svelte'
    import type { Vector } from './pokit.types';
    import {spritemap} from './stores'
    import { vectorAdd, vectorDist, vectorDivide, vectorFloor, vectorMultiply, VectorOne, vectorSub, VectorZero } from './utils';

    export let visible;
    export let singleSelect = false;

    let spritesize = {x:32,y:32};

    let source = VectorZero();
    let bounds = Object.assign({},spritesize);

    let canvas: HTMLCanvasElement;
    let ctx : CanvasRenderingContext2D;
    let dirty = true;
    let firstclick = true;

    let start: Vector;

    $: {
        $spritemap;
        dirty = true;
    }

    const dispatch = createEventDispatcher()

    function finalSelect() {
        dispatch('select', {source: Object.assign({},source), bounds: Object.assign({},bounds)})
    }

    $:if(visible) {
        firstclick = true;
    }

    $:{
        if(canvas && visible) {
            canvas = document.getElementById("spritepicker_canvas") as HTMLCanvasElement;
            ctx = canvas.getContext('2d');
            canvas.addEventListener("pointerup", onClick);
            canvas.addEventListener("pointerdown", onClickStart);
            dirty = true;
            console.log("hello there")
            raf();
        }
    }

    function onClickStart(e: PointerEvent){
        start = e;
    }


    function onClick(e: PointerEvent) {
        if(Math.abs(vectorDist(start, e)) > 5) return;
        let org = canvas.getBoundingClientRect();
        org.x = Math.round(org.x);
        org.y = Math.round(org.y);
        let click = vectorSub(e, org);
        let sprite = click = vectorDivide(click, spritesize)
        sprite = {x:Math.floor(click.x), y:Math.floor(click.y)};

        if(firstclick) {
            Object.assign(bounds,spritesize);
            source = sprite;
            if(singleSelect) firstclick = false;
        } else {
            let spriteMin = {
                x: sprite.x < source.x ? sprite.x : source.x,
                y: sprite.y < source.y ? sprite.y : source.y
            }
            let spriteMax = {
                x: sprite.x > source.x ? sprite.x : source.x,
                y: sprite.y > source.y ? sprite.y : source.y
            }
            let src = vectorMultiply(spriteMin, spritesize);
            let dims = vectorSub(spriteMax, spriteMin);
            dims = vectorAdd(dims, VectorOne());
            dims = vectorMultiply(dims, spritesize);
            dims = vectorFloor(dims);
            src = vectorDivide(src, dims);
            source = src;
            bounds = dims;
        }

        dirty = true;
        firstclick =! firstclick;
    }

    function raf() {
        if(!canvas)return;
        if(dirty) {
            render();
            dirty = false;
        }
        requestAnimationFrame(raf);
    }

    function render() {
        let sm = $spritemap;
        canvas.height = sm.height;
        canvas.width = sm.width;
        ctx.drawImage(sm, 0, 0);
        
        ctx.strokeStyle = 'purple';
        ctx.lineWidth = 3;

        let org = vectorMultiply(source, bounds);

        ctx.strokeRect(org.x, org.y, bounds.x, bounds.y);
    }

</script>

<ModalBase bind:visible confirmable on:confirm={finalSelect}>
    <div class="canvcontainer">
        <p>Pick a sprite series</p>
        <canvas bind:this={canvas} id="spritepicker_canvas"></canvas>
    </div>
</ModalBase>

<style>
    p {
        margin: 5px;
    }
    .canvcontainer {
        height: 100%;
        overflow: scroll;
    }
</style>