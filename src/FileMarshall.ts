import type { CartManifest, EntityStub, SceneStub } from "./pokit.types"
import { AppData, appdata, cachedb64, spritemap } from './stores'
import JSZip from "jszip"
import FileSaver from "file-saver"
import { canvas2pokit, img2b64 } from "./utils";

let state: AppData;

appdata.subscribe((a)=>state=a);

export async function parseFolder(files: FileList) {
    let entities: Record<string, EntityStub> = {}
    let scenes: Record<string, SceneStub> = {}
    let cart: CartManifest
    let sprites: string;
    console.log('beginning importing')
    for (let [k,v] of Object.entries(files)) {
        if (k === 'length') {
            continue
        }
        let path = v.webkitRelativePath.split('/')
        let filename = v.name
        let name = filename.split('.json')[0]
        let type = path[1]
        let loaded: any
        if (v.type === 'application/json') {
            loaded = JSON.parse(await v.text())
        } else {
            loaded = v.stream()
        }
        if (filename === 'cart.json') {
            cart = loaded
        }
        if (filename === 'sprites.png') {
            console.log('doing image')
            sprites = URL.createObjectURL(v);
            console.log('image done')
        }
        switch(type) {
            case 'entities': entities[name] = loaded; break;
            case 'scenes': scenes[name] = loaded; break;
        }
    }
    console.log('looping cart entities')
    for (let [k,v] of Object.entries(cart.entities || {})) {
        let ts = entities[k]?.timestamp || 0
        if (ts < (v.timestamp || 1)) {
            entities[k] = v
        }
    }
    console.log('looping scenes now')
    for (let [k,v] of Object.entries(cart.scenes || {})) {
        let ts = scenes[k]?.timestamp || 0
        if (ts < (v.timestamp || 1)) {
            scenes[k] = v
        }
    }
    console.log('updating appdata')
    appdata.update((appdata: AppData) => {
        if (appdata.manifest.name === "New Editor Project") {
            Object.assign(appdata.manifest, cart)
            // TODO: add importing of other props when not default name
            if(Object.keys(scenes).length) appdata.scenes = {};
            if(Object.keys(entities).length) {
                appdata.entities = {};
                appdata.currentBrush = Object.keys(entities)[0];
            }
        }
        for (let [k,v] of Object.entries(entities)) {
            let ts = appdata.entities[k]?.timestamp || 0
            if (ts < (v.timestamp || 1)) {
                appdata.entities[k] = v
            }
        }
        for (let [k,v] of Object.entries(scenes)) {
            let ts = appdata.scenes[k]?.timestamp || 0
            if (ts < (v.timestamp || 1)) {
                appdata.scenes[k] = v
            }
        }
        console.log("value of cart", cart);
        appdata.currentScene = cart.defaultScene || appdata.currentScene
        return appdata 
    })
    spritemap.update(s=>{
        s.src = sprites;
        return s;
    })
}

export async function getFiles() {
    let files: Record<string,string> = {};
    let entityShards: string[] = [];
    let sceneShards: string[] = [];
    for(let [k,v] of Object.entries(state.entities)) {
        files[`entities/${k}.json`] = JSON.stringify(v, null, 2);
        entityShards.push(k+'.json');
    }
    for(let [k,v] of Object.entries(state.scenes)) {
        files[`scenes/${k}.json`] = JSON.stringify(v, null, 2);
        sceneShards.push(k+'.json');
    }
    let manifest = Object.assign({},state.manifest,{entityShards,sceneShards});
    files['cart.json'] = JSON.stringify(manifest, null, 2);
    let img = atob(cachedb64.value);
    return {files,img};
}

export async function save() {
    let zip = new JSZip();
    let {files, img} = await getFiles();
    Object.entries(files).forEach(([k,v])=>zip.file(k,v));
    zip.file("sprites.png", img, {binary:true})
    let file = await zip.generateAsync({type: "blob"});
    FileSaver.saveAs(file, state.manifest.name+".zip");
}