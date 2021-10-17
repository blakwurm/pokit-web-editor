<script lang="ts">
import app from "./main";
import { applyInheritance, resolveLineage } from "./MapCanvas";

    import { appdata } from "./stores";
    import { deepClone } from "./utils";

    let key: string = "newstub";

    export let desktop: boolean = false;

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
    function enumerate(obj: pojo) {
        let clone = deepClone(obj);
        delete clone["__DEFAULT_PARENT__"]
        return Object.keys(clone).map((k)=>{
            let lineage = resolveLineage(k, clone);
            let e = applyInheritance(lineage, clone);
            let color = e.components.debug?.color || [0,0,255,255];
            let style = `--debug-color:rgba(
                ${color[0]},
                ${color[1]},
                ${color[2]},
                ${color[3]/255},
            );`
            console.log(style);
            return [k,style]
        });
    }
</script>
{#if desktop}
<style>
    button {
        color: black;
    }
</style>
{/if}
<ul class="palettelist">
    {#each enumerate($appdata.entities) as [k,s]}
        <li class="paletteoption">
            <div class="thingname">{k}</div>
            <div class="fauximage" style={s}></div>
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
        --debug-color: rgba(0,0,255,1);
        display: solid;
        background-color: var(--debug-color);
        width: 40px;
        height: 40px;
        float: right;
    }
    .paletteoption ul {
        border-top: 3px solid hsla(0, 50%, 50%, .5);
        padding: 3px;
    }
</style>
