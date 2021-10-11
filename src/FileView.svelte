<script lang="ts">
import { onMount } from "svelte";
import { parseFolder } from "./importer";
import { projectName, appdata } from './stores'


    export let filetext = "Get File"
    let inputter: HTMLInputElement
    onMount(() => {
        inputter.webkitdirectory = true
    })
    function foo(ev) {
        console.log(ev)
    }
    function add_folder(ev: any) {
        let t = ev.target as HTMLInputElement
        parseFolder(t.files)
        console.log('parsed')
    }

    $: console.log($projectName)

    function open_project(ev) {

    }

</script>

<label for="projectname">Project Name: </label>
<input id="projectname" type="text" bind:value={$projectName}>

<div>
    
    <!--TODO: Remember to add modal asking 'are you sure'-->
    <button>Clear Project</button>
    <button on:click={()=>inputter.click()}>Open Project</button>
    <button>Save Project</button>
</div>
<div>
    <div>
        <label for="addfolder" class="filehider">Add a folder To Project</label>
        <input id="addfolder" bind:this={inputter} type="file" on:input="{add_folder}">
    </div>

    <div>
        <label for="addfile" class="filehider">add a file to project</label>
        <input id="addfile" type="file" on:input="{foo}">
    </div>

</div>
<div>{JSON.stringify($appdata)}</div>

<style>
    input {
        color: black;
    }
    input[type="file"] {
        display: none;
    }
    label.filehider {
        display: inline-block;
        border: 5px double white;
        margin: 3px 0;
    }
</style>

<!--

    steps:
    1. get folder
    2. read manifest
    3. resolve manifest stubs
    4. check to see if the loaded scene is the default
    4. copy manifest values into appstate
    5. ?
-->