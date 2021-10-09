<script lang="ts">
    let demostuff = {
        a: 'thing',
        b: 'another',
        c: 'ipsum',
        d: 'set',
        e: 'amet'
    }

</script>

<ul class="palettelist">
    {#each Object.entries(demostuff) as [k,v], i (k)}
        <li class="paletteoption">
            <div class="thingname">{v}</div>
            <div class="fauximage"></div>
            <ul>
                <button>Make Active Brush</button>
                <button>Edit</button>
            </ul>
        </li>
    {/each}
</ul>

<style>
    .palettelist {
        display: flex;
        width: 100%;
        columns: auto;
        flex-wrap: wrap;
    }
    .palettelist .paletteoption {
        width: 100%;
        list-style: none;
    }
    @media (orientation: landscape) {
        .palettelist .paletteoption {
            width: 48.5%;
        }
    }
    .paletteoption {
        border: solid 3px grey;
    }
    .paletteoption .fauximage {
        display: solid;
        background-color: blue;
        width: 40px;
        height: 40px;
        float: right;
    }
    .paletteoption ul {
        border-top: 3px solid hsla(0, 50%, 50%, .5);
        padding: 3px;
    }
</style>
