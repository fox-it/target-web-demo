<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import type { TouchPanValue } from 'quasar'

import type { RemoteShell } from '../types/remote'
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
    (e: 'resize', position: { top?: number | undefined; left?: number | undefined } | undefined): void
    (e: 'toggleCollapsed'): void
}>()

const $ = terminal(window, jQuery) as any
unix_formatting(window, $)

const targetStore = useTargetStore()

let targetShell: RemoteShell | null = null

const shell = useTemplateRef('target-shell')
let term: any | null = null

watch(
    () => targetStore.currentTarget,
    async (newTarget) => {
        if (!newTarget) {
            return
        }

        targetShell = await newTarget.cli()
        if (term) {
            term.destroy()
        }

        const port = await targetShell.run()
        port.onmessage = (event) => {
            if (event.data.type === 'stdout') {
                term.echo(event.data.data, { newline: false })
            } else if (event.data.type === 'stderr') {
                term.error(event.data.data)
            } else if (event.data.type === 'prompt') {
                term.set_prompt(event.data.data)
                term.resume()
            }
        }

        term = $(shell.value).terminal(
            async (command: string) => {
                term.pause()
                term.set_prompt('')
                port.postMessage({
                    type: 'stdin',
                    data: command,
                })
            },
            {
                prompt: '',
                greetings: false,
            }
        )
        term.pause()
        port.start()
    },
    { immediate: true }
)

const onPan: TouchPanValue = ({ position }) => {
    emit('resize', position)
}
</script>

<template>
    <div id="shell" @click="shell?.focus()">
        <div id="shell-resizer" v-touch-pan.vertical.prevent.mouse="onPan"></div>
        <div id="shell-header">
            <div class="header-left">
                <q-icon name="terminal" size="sm" />
                <span class="header-text">Shell</span>
            </div>
            <q-btn
                size="md"
                flat
                round
                :icon="props.collapsed ? 'expand_less' : 'expand_more'"
                @click="emit('toggleCollapsed')"
            />
        </div>
        <div class="container" ref="target-shell"></div>
    </div>
</template>

<style scoped>
#shell {
    width: 100%;
    display: flex;
    flex-direction: column;
    border-top: solid 1px #f3f4f8;
}

#shell-resizer {
    cursor: ns-resize;
    width: 100%;
    height: 10px;
    margin-top: -5px;
    z-index: 1;
}

#shell-header {
    margin: 0 20px;
    border-bottom: solid 1px #f3f4f8;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 50px;
}

.header-left {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
}

.header-left .q-icon {
    margin-right: 8px;
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
