
import * as love from 'immer-loves-svelte'
import { writable } from 'svelte/store'

import type { CartManifest, EntityStub, SceneStub } from './pokit.types'

interface AppData {
    entities: Record<string, EntityStub>
    scenes: Record<string, SceneStub>
    currentScene: string
    currentBrush: string
    inspecting: [string, string, number]
    isDragging: boolean
}

export function loads() {

}

export let appdata = love.undoStore(writable({} as AppData))

export let currentScene = love.subStore(appdata, (a:AppData)=>a.scenes[a.currentScene])

export let currentBrush = love.subStore(appdata, (a:AppData)=>a.entities[a.currentBrush])

export let inspecting = love.subStore(appdata, (a:AppData)=>a.scenes[a.inspecting[0]].entities[a.inspecting[1]][a.inspecting[2]])

