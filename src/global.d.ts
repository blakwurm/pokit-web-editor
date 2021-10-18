/// <reference types="svelte" />
type pojo = Record<string, any>

interface LocalDataBase {
    aget : (key: string) => Promise<string>
    set: (key: string, value: string, callback?: ()=>void) => void
}

declare let ldb: LocalDataBase
