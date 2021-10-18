
import { writable } from 'svelte/store'
import type {Writable} from 'svelte/store'
import './localStorageDB.js'

import type { CartManifest, EntityStub, Identity, SceneStub } from './pokit.types'
import NestedStore from './NestedStore'
import { deepClone, img2b64 } from './utils'
import ImmerStore from './ImmerStore.js'

export interface AppData {
    handling?: boolean;
    spritemap: HTMLImageElement
    manifest: CartManifest
    entities: Record<string, EntityStub>
    scenes: Record<string, SceneStub>
    currentScene: string
    currentBrush: string
    currentTool: ToolType
    inspecting: [string, string, number]
    isDragging: boolean
}

export function loads() {

}

export enum ToolType {
    BRUSH,
    SELECT,
    PAN
}

export enum ValueType {
    STRING,
    NUMBER,
    BOOLEAN,
    ARRAY,
    OBJECT
}

export const templates = {
    get newProject(): AppData {
        let img = new Image()
        img.src = '../img/sprites.png'
        return {
            currentScene: 'defaultscene',
            manifest: {
                name:"New Editor Project",
                author:"Some Cool Person",
                defaultScene: 'defaultScene',
                modules: ["@pokit:Engine","@pokit:Jewls","@pokit:Physics","@pokit:Debug"],
                scripts: [],
            } as CartManifest,
            spritemap: img,
            scenes: {
                defaultscene: {systems: [], entities:{
                    square:[{id:"main_guy"}],
                    camera:[{parent:"main_guy"}]
                }} as SceneStub
            },
            currentBrush: 'square',
            currentTool: ToolType.SELECT,
            entities: {
                square: {
                    inherits: [],
                    components: {
                        identity: {
                            position:{
                                x: 0,
                                y: 0
                            },
                        },
                        debug:{
                            color:[0,255,0,255]
                        }
                    }
                },
                camera: {
                    inherits: [],
                    components: {
                        camera:{
                            isMainCamera:true
                        }
                    }
                }
            },
            inspecting: ['defaultscene', 'square', 0],
            isDragging: false
        }
    }
}

let stateString = localStorage.getItem("project");
let state = stateString ? JSON.parse(stateString) : templates.newProject;

export let cachedb64 = {
    value: "",
    dirty: false,
    true:false
}
async function loadImageFromLocalstorage() {
    let imgdata = await ldb.aget('spritemap')
    let img = new Image();
    // img.onload=()=>cachedb64.value=imgdata;
    cachedb64.value=imgdata
    img.src = 'data:image/png;base64,' + imgdata;
    state.spritemap = img;
}
if(!state.spritemap) {
    loadImageFromLocalstorage()
}


export function iterate_enum(stupidenum: pojo) {
    let foo = Object.entries(stupidenum).filter(([e])=>isNaN(Number(e)))
    return foo
}

export let appdata = new ImmerStore<AppData>(state as AppData);
// export let appdata = writable(state as AppData);

appdata.subscribe((a)=>{
    let c = deepClone(a);
    delete c.spritemap
    if(cachedb64.dirty){
        cachedb64.dirty = false;
        a.spritemap.onload = () => {
            console.log('filthy bitch')
            cachedb64.value = img2b64(a.spritemap);
            console.log(cachedb64)
            // c.spritemap = cachedb64.value;
            // localStorage.setItem("project", JSON.stringify(c));
            ldb.set('spritemap', cachedb64.value)
        }
    } 
    // c.spritemap = cachedb64.value;
    localStorage.setItem("project", JSON.stringify(c));
})

export let projectName = new NestedStore<string>(appdata, "manifest", "name")

export let currentBrushName = new NestedStore<string>(appdata, "currentBrush")

export let currentTool = new NestedStore<string>(appdata, "currentTool");

export let entities = new NestedStore<EntityStub[]>(appdata, "entities")

export let scenes = new NestedStore<SceneStub[]>(appdata, "scenes")