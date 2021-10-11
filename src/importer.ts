import type { CartManifest, EntityStub, SceneStub } from "./pokit.types"
import { AppData, appdata } from './stores'

export async function parseFolder(files: FileList) {
    let entities: Record<string, EntityStub> = {}
    let scenes: Record<string, SceneStub> = {}
    let cart: CartManifest
    let sprites: HTMLImageElement
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
        if (filename = 'cart.json') {
            cart = loaded
        }
        if (filename = 'sprites.png') {
            console.log('doing image')
            sprites = await loadimage(v)
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
            appdata.spritemap = sprites
            Object.assign(appdata.manifest, cart)
            // TODO: add importing of other props when not default name
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
        appdata.currentScene = cart.defaultScene || appdata.currentScene
        return appdata 
    })
}

async function loadimage(blob: Blob): Promise<HTMLImageElement> {
    let i = new Image();
    i.src = URL.createObjectURL(blob);
    return i
}