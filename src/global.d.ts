/// <reference types="svelte" />
type pojo = Record<string, any>

interface LocalDataBase {
    aget : (key: string) => Promise<string>
    set: (key: string, value: string, callback?: ()=>void) => void
}

declare let ldb: LocalDataBase

declare function acquireVsCodeApi(): {
    postMessage: (msg: any)=>void
}

declare var __pokit_state: {
    state: any;
    spritemap: string;
}