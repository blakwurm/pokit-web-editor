<script lang="ts">
import app from "./main";
import { applyInheritance, resolveLineage } from "./MapCanvas";

    import { appdata, currentBrush, entities } from "./stores";
    import { deepClone } from "./utils";

    let key: string = "newstub";

    export let desktop: boolean = false;

    function cloneStub(name:string) {
        let newStub = deepClone($entities[name]);
        entities.update(e=>{
            e[key] = newStub;
            return e;
        })
        console.log("equality",$entities[key]===$entities[name])
    }
    function inheritStub(name:string) {
        entities.update(e=>{
            e[key] = {
                inherits: [name],
                components: {}
            }
            return e;
        });
    }
    function newStub() {
        entities.update(e=>{
            e[key] = {
                inherits: [],
                components: {}
            }
            return e;
        })
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
                ${color[3]/255}
            );`
            return [k,style]
        });
    }
</script>
{#if desktop}
<style>
    /** TODO: FIx this fucking bullshit
    */
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
                <button on:click={()=>$currentBrush=k}>Make Active Brush</button>
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
        --debug-color: rgba(0,0,255,1);
    }
    .paletteoption .fauximage {
        display: block;
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
