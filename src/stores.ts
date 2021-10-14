
import * as love from 'immer-loves-svelte'
import { writable } from 'svelte/store'

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
        defaultbrush: {inherits: [''], components: {}} as EntityStub
    },
    inspecting: ['defaultscene', '', 0],
    isDragging: false
} as AppData))

export let projectName = love.subStore(appdata, (a:AppData)=>a.manifest.name)

export let currentScene = love.subStore(appdata, (a:AppData)=>a.scenes[a.currentScene])

export let currentBrush = love.subStore(appdata, (a:AppData)=>a.entities[a.currentBrush])

export let inspecting = love.subStore(appdata, (a:AppData)=>a.scenes[a.inspecting[0]].entities[a.inspecting[1]][a.inspecting[2]])

