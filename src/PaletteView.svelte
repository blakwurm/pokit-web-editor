<script lang="ts">
import app from "./main";

    import { appdata } from "./stores";
import { deepClone } from "./utils";

    let key: string = "newstub";

    function cloneStub(name:string) {
        let newStub = deepClone($appdata.entities[name]);
        $appdata.entities[key] = newStub;
    }
    function inheritStub(name:string) {
        $appdata.entities[key] = {
            inherits: [name],
            components: {}
        }
    }
    function newStub() {
        $appdata.entities[key] = {
            inherits:[],
            components:{}
        }
        console.log($appdata);
    }
</script>

<ul class="palettelist">
    {#each Object.entries($appdata.entities) as [k,v]}
        <li class="paletteoption">
            <div class="thingname">{k}</div>
            <div class="fauximage"></div>
            <ul>
                <button on:click={()=>$appdata.currentBrush=k}>Make Active Brush</button>
                <button on:click={()=>cloneStub(k)}>Clone</button>
                <button on:click={()=>inheritStub(k)}>Inherit</button>
            </ul>
        </li>
    {/each}
    <!-- current brush: {$appdata.currentBrush}
    testing: {$appdata.scenes['default'].entities['guy'][0].id} -->
    <button on:click={newStub}>New stub: </button>
    <input type="text" bind:value={key}/>
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
