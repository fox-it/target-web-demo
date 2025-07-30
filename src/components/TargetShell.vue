<script setup lang="ts">
import { useTemplateRef, watch, ref } from 'vue'
import type { RemoteShell, RemoteTarget } from '../types/Remote'
import { useTargetStore } from '../stores/target'

import jQuery from 'jquery'
import terminal from 'jquery.terminal'
import 'jquery.terminal/css/jquery.terminal.min.css'
import unix_formatting from 'jquery.terminal/js/unix_formatting.js'

interface Props {
    collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    collapsed: false,
})

const emit = defineEmits<{
    (e: 'resize', position: { top: number; left: number }): void
    (e: 'toggleCollapsed'): void
}>()

const $ = terminal(window, jQuery) as any
unix_formatting(window, $)

const targetStore = useTargetStore()

let targetShell: RemoteShell | null = null

const shell = useTemplateRef('target-shell')
let term: any | null = null

watch(
    () => targetStore.target,
    async (newTarget) => {
        if (newTarget) {
            targetShell = await newTarget.cli()

            if (term) {
                term.destroy()
            }

            term = $(shell.value).terminal(
                async (command: string) => {
                    term.pause()
                    let [prompt, result] = await targetShell!.cmd(command)
                    term.echo(new TextDecoder('utf-8').decode(result), {
                        newline: false,
                    })
                    term.set_prompt(prompt)
                    term.resume()
                },
                {
                    prompt: '',
                    greetings: false,
                }
            )
            term.set_prompt(await targetShell!.prompt)
        }
    },
    { immediate: true }
)

const panning = ref(false)
const panInfo = ref(null)

function onPan({ evt, ...newInfo }) {
    panInfo.value = newInfo

    if (newInfo.isFirst) {
        panning.value = true
    } else if (newInfo.isFinal) {
        panning.value = false
    }

    emit('resize', panInfo.value.position)
}
</script>

<template>
    <div id="shell" @click="shell?.focus()">
        <div id="shell-resizer" v-touch-pan.vertical.prevent.mouse="onPan"></div>
        <div id="shell-header">
            <h2>
                <q-icon name="terminal" size="sm" style="margin-top: -3px" />
                Target Shell
            </h2>
            <q-btn
                size="md"
                flat
                round
                :icon="collapsed ? 'expand_less' : 'expand_more'"
                @click="emit('toggleCollapsed')"
            />
        </div>
        <div class="container" ref="target-shell"></div>
        <!-- <terminal name="target-shell" ref="target-shell" :show-header="false" :enable-default-command="false" :context="ps1" context-suffix="" @exec-cmd="exec" /> -->
    </div>
</template>

<style scoped>
#shell {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 40%;
    display: flex;
    flex-direction: column;
    border-top: solid 1px #f3f4f8;
}

#shell-resizer {
    cursor: ns-resize;
    position: absolute;
    margin-top: -5px;
    width: 100%;
    height: 5px;
    padding-top: 4px;
    padding-bottom: 4px;
}

#shell-header {
    padding: 0 20px;
    display: flex;
    flex-direction: row;

    align-content: center;
    align-items: center;
    justify-content: space-between;
}

#shell-header h2 {
    font-size: 16px;
    line-height: 50px;
    margin: 0;
}

#shell .container {
    flex: 1 1 0;
    height: 100%;
    min-height: 0;
}

.terminal {
    height: 100%;
    overflow: hidden;
}
</style>
