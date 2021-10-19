
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
        }
    },
    spritemap: "../img/sprites.png"
}

export let cachedb64 = {
    value: "",
    dirty: true,
}

let stateString = localStorage.getItem("project");
let preState = __pokit_state?.state;
let loadState = stateString ? JSON.parse(stateString) as AppData : templates.newProject;
let state = preState as AppData || loadState;

let img = new Image();
img.onload = ()=> {
    cachedb64.dirty = false;
    cachedb64.value = img2b64(img);
    ldb.set("spritemap", cachedb64.value);
}
img.src = __pokit_state?.spritemap ? 'data:image/png;base64,' + __pokit_state?.spritemap : templates.spritemap;
export let spritemap = writable(img);
console.log("then state is", state, __pokit_state?.state);

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
    localStorage.setItem("project", JSON.stringify(a));
})

if(acquireVsCodeApi) {
    let vscode = acquireVsCodeApi();
    appdata.subscribe(vscode.postMessage);
    window.addEventListener("message", onMessage);
}

interface VsCodeMessage {
    evt: string;
    name: string;
    data: any;
}
function onMessage(event: MessageEvent<VsCodeMessage>) {
    let msg = event.data;
    switch(msg.evt) {
        case "cart_change":
            let cart = msg.data as CartManifest;
            appdata.update(a=>{
                let local = a.manifest;
                local.name = cart.name;
                local.author = cart.author;
                local.defaultScene = cart.defaultScene;
                local.modules = cart.modules;
                return a;
            })
            break;
        case "entity_change":
            appdata.update(a=>{
                a.entities[msg.name] = msg.data;
                return a;
            })
            break;
        case "entity_delete":
            appdata.update(a=>{
                delete a.entities[msg.name];
                return a;
            })
            break;
        case "scene_change":
            appdata.update(a=>{
                a.scenes[msg.name] = msg.data;
                return a;
            })
            break;
        case "scene_delete":
            appdata.update(a=>{
                delete a.scenes[msg.name];
                return a;
            })
            break;
    }
}

spritemap.subscribe((s)=>{
    cachedb64.dirty = true;
})

export let projectName = new NestedStore<string>(appdata, "manifest", "name")

export let currentBrush = new NestedStore<string>(appdata, "currentBrush")

export let currentTool = new NestedStore<ToolType>(appdata, "currentTool");

export let entities = new NestedStore<EntityStub[]>(appdata, "entities")

export let scenes = new NestedStore<SceneStub[]>(appdata, "scenes")