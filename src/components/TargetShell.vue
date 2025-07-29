<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'
import type { RemoteShell, RemoteTarget } from '../types/Remote'
import { useTargetStore } from '../stores/target'

import jQuery from 'jquery'
import terminal from 'jquery.terminal'
import 'jquery.terminal/css/jquery.terminal.min.css'
import unix_formatting from 'jquery.terminal/js/unix_formatting.js'

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
</script>

<template>
    <div id="shell" @click="shell?.focus()">
        <h2>Shell</h2>
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
}

#shell h2 {
    font-size: 16px;
    line-height: 50px;
    margin: 0 20px;
    border-bottom: solid 1px #f3f4f8;
    flex: 0 0 auto;
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
