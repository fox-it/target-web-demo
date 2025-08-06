<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { QBtn } from 'quasar'

import TargetInfo from '../components/TargetInfo.vue'
import Records from '../components/Records.vue'
import TargetShell from '../components/TargetShell.vue'
import Upload from '../components/Upload.vue'

import api from '../worker/api'
import { useTargetStore, type TargetItem } from '../stores/target'

const MIN_SHELL_TOP = 225
const MIN_SHELL_HEIGHT = 50

const targetStore = useTargetStore()

const showLoading = ref(true)
const loadingMessage = ref('Loading, please wait...')

api.load().then(() => {
    showLoading.value = false
    ;(window as any).api = api // For debugging purposes
})

const broadcast = new BroadcastChannel('worker')
broadcast.onmessage = (event) => {
    loadingMessage.value = event.data
}

const filesAdd = useTemplateRef('filesAdd')
const browser = useTemplateRef('browser')
const shellHeight = ref('40%')
const shellCollapsed = ref(false)
let shellResizeAnimationFrameId: number | null = null

function onShellResize(position: { top?: number | undefined; left?: number | undefined } | undefined) {
    const height = window.innerHeight - position?.top!

    if (position?.top! <= MIN_SHELL_TOP || height <= MIN_SHELL_HEIGHT) {
        return
    }

    if (shellResizeAnimationFrameId) {
        cancelAnimationFrame(shellResizeAnimationFrameId)
    }

    shellResizeAnimationFrameId = requestAnimationFrame(() => {
        if (shellCollapsed.value) {
            shellCollapsed.value = false
        }

        shellHeight.value = `${height}px`
    })
}

function addFiles() {
    console.log('Adding files...')
    if (filesAdd.value?.files) {
        console.log('Files to add:', filesAdd.value.files)
        targetStore.files = targetStore.files.concat(Array.from(filesAdd.value.files))
        filesAdd.value.value = ''
    }
}

async function onTargetClick(item: TargetItem) {
    if (item.target) {
        if (targetStore.currentTarget === item.target) {
            targetStore.clearCurrentTarget()
        } else {
            targetStore.setCurrentTarget(item)
        }
    } else {
        await targetStore.openTarget(item)
        targetStore.setCurrentTarget(item.target)
    }
}

defineExpose({ browser })
</script>

<template>
    <q-page>
        <q-inner-loading :showing="showLoading">
            <q-spinner-gears size="50px" color="primary" />
            <p class="q-py-md">{{ loadingMessage }}</p>
        </q-inner-loading>
        <div v-if="!showLoading">
            <div class="content text-center" v-if="targetStore.files.length == 0">
                <h1>Dissect Playground</h1>
                <p class="text-subtitle1">To start playing around you need to select your files.</p>
                <upload />
                <p id="info" class="bg-dark text-white rounded-10 q-pa-sm text-left">
                    <q-icon name="info" size="sm" />
                    This demo runs completely in your browser, your data isn't uploaded anywhere.
                </p>
                <div id="filetypes" class="text-left">
                    <p>
                        <strong>Accepted file formats:</strong>
                        Anything that Dissect supports as a target, for example:
                    </p>
                    <ul>
                        <li>.E01 (select all parts)</li>
                        <li>.VMX + .VMDK (select all parts and/or parents)</li>
                        <li>Raw .DD</li>
                        <li>Acquire .tar</li>
                    </ul>
                    <p>
                        For more details please see
                        <a href="https://dissect.readthedocs.io/en/latest/overview/index.html#targets">
                            the documentation on targets.
                        </a>
                    </p>
                </div>
            </div>
            <div id="browser" ref="browser" v-else>
                <div id="sidebar">
                    <h2>
                        <q-icon class="title-icon" name="source" size="sm" />
                        Files
                        <q-btn flat round icon="add" @click.stop="filesAdd?.click()">
                            <input class="add-files" type="file" ref="filesAdd" multiple @change="addFiles" />
                        </q-btn>
                    </h2>
                    <q-list separator id="files">
                        <q-item
                            clickable
                            v-ripple
                            v-for="item in targetStore.targets"
                            @click.stop="onTargetClick(item)"
                            :active="item.target && item.target === targetStore.currentTarget"
                        >
                            <q-item-section>
                                <code>{{ item.file.name }}</code>
                            </q-item-section>
                            <q-item-section side v-if="item.loading">
                                <q-spinner color="primary" size="sm" />
                            </q-item-section>
                            <q-item-section side>
                                <q-badge color="blue" v-if="item.target !== null">opened</q-badge>
                            </q-item-section>
                            <q-item-section side>
                                <q-btn flat round dense icon="close" @click.stop="targetStore.removeFile(item)" />
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <target-info v-if="targetStore.currentTarget" />
                </div>
                <div id="main">
                    <records v-if="targetStore.currentTarget" />
                    <target-shell
                        v-if="targetStore.currentTarget"
                        ref="target-shell"
                        @resize="onShellResize"
                        :class="{ collapsed: shellCollapsed }"
                        :style="{ height: shellHeight }"
                        :collapsed="shellCollapsed"
                        @toggle-collapsed="shellCollapsed = !shellCollapsed"
                    />
                </div>
            </div>
        </div>
    </q-page>
</template>

<style>
#info {
    margin: 10px auto 0;
    width: 380px;
    font-size: 13px;
}
#info .title-icon {
    float: left;
    margin: 8px;
}

#filetypes {
    font-size: 12px;
    width: 380px;
    margin: 10px auto 0;
}

.add-files {
    position: absolute;
    left: 100%;
    top: 100%;
    opacity: 0;
    width: 0;
    height: 0;
}

#browser {
    width: 100%;
    height: 100%;
    position: absolute;
}

#browser h2 i {
    margin-top: -4px;
    margin-right: 4px;
}

#sidebar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 350px;
    border-right: solid 1px #f3f4f8;
}

#sidebar h2 {
    margin-left: 20px;
    margin-right: 20px;
    border-bottom: solid 1px #f3f4f8;
    font-size: 18px;
    line-height: 50px;
}

#files {
    margin: 0 8px;
    font-size: 13px;
}
#files .file-checkbox {
    min-width: 0;
    padding-right: 10px;
}

#main {
    position: absolute;
    left: 351px;
    right: 0;
    top: 0;
    bottom: 0;
}

#shell.collapsed {
    height: 51px !important;
}
</style>
