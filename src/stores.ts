
import { writable } from 'svelte/store'
import type {Writable} from 'svelte/store'
import './localStorageDB.js'

import type { CartManifest, EntityStub, Identity, SceneStub } from './pokit.types'
import NestedStore from './NestedStore'
import { deepClone, img2b64 } from './utils'
import ImmerStore from './ImmerStore.js'

export interface AppData {
    handling?: boolean
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
        return {
            currentScene: 'defaultscene',
            manifest: {
                name:"New Editor Project",
                author:"Some Cool Person",
                defaultScene: 'defaultScene',
                modules: ["@pokit:Engine","@pokit:Jewls","@pokit:Physics","@pokit:Debug"],
                scripts: [],
            } as CartManifest,
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
    },
    spritemap: "../img/sprites.png"
}

export let cachedb64 = {
    value: "",
    dirty: true,
}

let stateString = localStorage.getItem("project");
let state = stateString ? JSON.parse(stateString) : templates.newProject;

let img = new Image();
img.onload = ()=> {
    cachedb64.dirty = false;
    cachedb64.value = img2b64(img);
    ldb.set("spritemap", cachedb64.value);
}
img.src = templates.spritemap;
export let spritemap = writable(img);

async function loadImageFromLocalstorage() {
    let imgdata = await ldb.aget('spritemap')
    if(!imgdata) return;
    // img.onload=()=>cachedb64.value=imgdata;
    spritemap.update(s=>{
        s.src = 'data:image/png;base64,' + imgdata;
        return s;
    }) 
    cachedb64.value=imgdata
}
loadImageFromLocalstorage();


export function iterate_enum(stupidenum: pojo) {
    let foo = Object.entries(stupidenum).filter(([e])=>isNaN(Number(e)))
    return foo
}

export let appdata = new ImmerStore<AppData>(state as AppData);
// export let appdata = writable(state as AppData);

appdata.subscribe((a)=>{
    let c = deepClone(a);
    delete c.spritemap
    localStorage.setItem("project", JSON.stringify(c));
})

spritemap.subscribe((s)=>{
    cachedb64.dirty = true;
})

export let projectName = new NestedStore<string>(appdata, "manifest", "name")

export let currentBrush = new NestedStore<string>(appdata, "currentBrush")

export let currentTool = new NestedStore<ToolType>(appdata, "currentTool");

export let entities = new NestedStore<EntityStub[]>(appdata, "entities")

export let scenes = new NestedStore<SceneStub[]>(appdata, "scenes")