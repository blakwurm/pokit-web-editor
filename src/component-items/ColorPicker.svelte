<script lang="ts">
    import {uuid} from '../utils'
    export let r: number
    export let g: number
    export let b: number
    export let a: number

    function int_to_hex(twofiftyfivemax: number) {
        let thingy = twofiftyfivemax.toString(16)
        if (thingy.length < 2) {
            thingy='0'+thingy
        }
        return thingy
    }

    function color_array_to_hex(color:number[]) {
        let foo = color.map(int_to_hex)
        let bar = '#'+foo.join('')
        return {hex:bar, alpha:color[3]}
    }

    function hex_to_color_array(hex: string) {
        let rt = parseInt(hex.substr(1,2), 16)
        let gt = parseInt(hex.substr(3,2), 16)
        let bt = parseInt(hex.substr(5,2), 16)
        return [rt, gt, bt]
    }
    $:deconstructed = color_array_to_hex([r,g,b])
    $:colorthing = deconstructed.hex
    function foobar(ev) {
        let [rt, gt, bt] = hex_to_color_array(colorthing)
        r=rt
        g=gt
        b=bt
    }
    let id = uuid()
</script>

<label for="{id}" style="--thiscolor:rgba({r}, {g}, {b}, {a/255})">
    <span>Color</span>
    <div class='transback'>
        <div class='actualcolor'>
            k
        </div>
    </div>
</label>
<input type="color" class='colorpicker' {id} bind:value={colorthing} on:input="{foobar}">
<input type="range" min=0 max=255 bind:value={a}>

<style>
    label {
        --thiscolor: rgba(255, 0, 255, 0.4);
    }
    .colorpicker {
        display: none;
    }
    .transback {
        display: inline-block;
        background: url('../img/Transparency10.png');
        background-repeat: repeat;
        background-attachment: local;
        width: 20px;
        height: 1.2em;
    }
    .actualcolor {
        display: inline-block;
        background: var(--thiscolor);
        width: 20px;
        height: 1.2em;
        color: transparent;
    }
</style>