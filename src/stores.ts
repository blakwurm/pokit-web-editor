
import * as love from 'immer-loves-svelte'
import { writable } from 'svelte/store'
import type {Writable} from 'svelte/store'

import type { CartManifest, EntityStub, SceneStub } from './pokit.types'

export interface AppData {
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
    POINTER
}

export let appdata = love.undoStore(writable({
    currentScene: 'defaultscene',
    manifest: {
        name:"New Editor Project",
        author:"Some Cool Person",
        defaultScene: 'defaultScene',
        modules: ["@pokit:Engine","@pokit:Jewls","@pokit:Physics","@pokit:Debug"],
        scripts: [],
    } as CartManifest,
    spritemap: new Image(),
    scenes: {
        defaultscene: {systems: {}, entities:{}} as SceneStub
    },
    currentBrush: 'defaultbrush',
    currentTool: ToolType.BRUSH,
    entities: {
        defaultbrush: {inherits: [''], components: {fak:{blob:false}}} as EntityStub
    },
    inspecting: ['defaultscene', '', 0],
    isDragging: false
} as AppData))

export let projectName = love.subStore(appdata, (a:AppData)=>a.manifest.name)

export let currentScene = love.subStore(appdata, (a:AppData)=>a.scenes[a.currentScene])

export let currentBrush = love.subStore(appdata, (a:AppData)=>{
    console.log(a)
   return  a.entities[a.currentBrush]
})

export let currentBrushName = love.subStore(appdata, (a:AppData)=>a.currentBrush)

export let inspecting = love.subStore(appdata, (a:AppData)=>a.scenes[a.inspecting[0]].entities[a.inspecting[1]][a.inspecting[2]])

export function barblast(garglethis: pojo, store: Writable<EntityStub>) {
    // if (!garglethis) return []
    let sus = Object.keys(garglethis).map(k=>{
        return {k, store:love.subStore(store, fuck=> {
            return fuck.components[k]
        })}
    })
    return sus
}

type storecord = Record<string, Writable<any>>
function sub_barblast_reducer(prev: storecord, stuff:{k:string, store:Writable<any>}): storecord {
    console.log(stuff)
    prev[stuff.k] = stuff.store
    return prev
}
export function sub_barblast(garglethat: pojo, store: Writable<any>): storecord {
    let sus = Object.keys(garglethat).map(k=>{
        return {k, store:love.subStore(store, fuck=> { return fuck[k] })}
    })
    let bus: storecord = sus.reduce(sub_barblast_reducer, {} as storecord)
    console.log(bus)
    return bus
}

type obind = (string | number)
type indexor = {ind: obind, type: string, value: any}
export function flattenout(record: pojo | Array<any>, path: obind[] = []): indexor[] {
    let collector = []
    let recs = Array.isArray(record) ? record.map((v,i)=>[i, v]) : Object.entries(record)
    for (let [k,v] of recs) {
        let nupath = [...path, k]
        let t = Array.isArray(v) ? 'array' : typeof v
        if (t === 'function') {
            throw(new Error('Cannot deconstruct object with functions'))
        }
        collector.push({ind:nupath, type:t, value:v})
        if (typeof v === 'object') {
            let stuff = flattenout(v, nupath)
            collector = [...collector, ...stuff]
        } 
    }
    return collector
}

console.log('yoyoyo', JSON.stringify(flattenout({
    'yolo': false,
    'superstuff': 42,
    'hola': {
        siii: {
            foooo: {
                'a': 234565432,
                mannnn: {
                    chooo: {
                        asdf:3, 
                        sdgwe: 'a'
                    }
                }
            }
        },
        'dicksnstuff': [
            6, 34, 4, 'a', 'b', {'stuff': 'yoooooo'}
        ]
    },
    'sickooo': [4, 23, 6]
})))