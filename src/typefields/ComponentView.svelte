<script lang="ts">
    import { SvelteComponent } from 'svelte'
    import { Writable } from 'svelte/store';
    import * as love from 'immer-loves-svelte'

    import type { EntityStub } from '../pokit.types';
    import ObjectEditor from './ObjectEditor.svelte'
import { add_flush_callback } from 'svelte/internal';
import { barblast, flattenout } from '../stores';
    type component = Record<string, any>
    let obedit: any = ObjectEditor

    export let entitystore: Writable<EntityStub>
    $:listOKeysToStores = barblast($entitystore?.components, entitystore)
    let foo: any = ObjectEditor
    console.log('el supremo', flattenout($entitystore.components))
</script>

<ul>
    {#each listOKeysToStores as {k, store}}
        <ObjectEditor obedit={obedit} key={k} store={store}></ObjectEditor>
    {/each}
</ul>

<!-- <li>
    <h4>{name.toLocaleUpperCase()}</h4>
    <ObjectEditor key={name} parent={components} value={component} obedit={foo}></ObjectEditor>
</li> -->