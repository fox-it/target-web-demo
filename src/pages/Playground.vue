<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { QBtn } from 'quasar'

import TargetInfo from '../components/TargetInfo.vue'
import Records from '../components/Records.vue'
import TargetShell from '../components/TargetShell.vue'
import Upload from '../components/Upload.vue'
import KeychainDialog from '../components/KeychainDialog.vue'

import api from '../worker/api'
import { useTargetStore, type TargetItem } from '../stores/target'

const MIN_SHELL_TOP = 225
const MIN_SHELL_HEIGHT = 50

const targetStore = useTargetStore()

const showLoading = ref(true)
const showError = ref(false)
const loadingMessage = ref('Loading, please wait...')

api.load().then(() => {
    showLoading.value = false
    ;(window as any).api = api // For debugging purposes
})

const broadcast = new BroadcastChannel('worker')
broadcast.onmessage = (event) => {
    if (event.data.type === 'status') {
        loadingMessage.value = event.data.data
    } else if (event.data.type === 'error') {
        showError.value = true
        showLoading.value = false
        loadingMessage.value = event.data.data
    } else {
        console.warn('Unknown message type:', event.data)
    }
}

const filesAdd = useTemplateRef('filesAdd')
const browser = useTemplateRef('browser')
const shellHeight = ref('40%')
const shellCollapsed = ref(false)
const showKeychainDialog = ref(false)
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
    if (filesAdd.value?.files) {
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
        <q-inner-loading :showing="showLoading || showError">
            <q-spinner-gears size="50px" color="primary" v-if="showLoading" />
            <q-icon name="error" size="50px" color="negative" v-if="showError" />
            <p class="q-py-md">{{ loadingMessage }}</p>
        </q-inner-loading>
        <div v-if="!showLoading && !showError">
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
                    <div id="sidebar-header">
                        <div class="header-left">
                            <q-icon name="source" size="sm" />
                            <span class="header-text">Files</span>
                        </div>
                        <div class="header-icons">
                            <q-btn flat round icon="add" @click.stop="filesAdd?.click()">
                                <input class="add-files" type="file" ref="filesAdd" multiple @change="addFiles" />
                                <q-tooltip> Add files </q-tooltip>
                            </q-btn>
                            <q-btn flat round icon="key" @click="showKeychainDialog = true">
                                <q-tooltip> Manage encryption keys </q-tooltip>
                            </q-btn>
                        </div>
                    </div>
                    <q-list separator id="files">
                        <q-item
                            clickable
                            v-ripple
                            v-for="item in targetStore.targets"
                            @click.stop="onTargetClick(item)"
                            :active="targetStore.isCurrentTarget(item)"
                            class="target-item"
                        >
                            <q-item-section>
                                <code>{{ item.file.name }}</code>
                            </q-item-section>
                            <q-item-section side>
                                <div class="q-gutter">
                                    <q-spinner color="primary" size="sm" v-if="item.loading" />
                                    <q-btn
                                        flat
                                        round
                                        dense
                                        icon="refresh"
                                        v-if="!item.loading && item.target !== null"
                                        @click.stop="targetStore.reloadTarget(item)"
                                    />
                                    <q-btn flat round dense icon="delete" @click.stop="targetStore.removeFile(item)" />
                                </div>
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

        <keychain-dialog v-model="showKeychainDialog" />
    </q-page>
</template>

<style scoped>
.q-page {
    height: 100%;
}

.content {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
}

#info {
    margin: 10px auto 0;
    width: 380px;
    font-size: 13px;
}
#info i {
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
    height: calc(100vh - 50px);
    display: flex;
    box-sizing: border-box;
}

#sidebar-header {
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

#browser h2 .header-icons {
    display: flex;
    align-items: center;
    gap: 8px;
}

#sidebar {
    width: 350px;
    border-right: solid 1px #f3f4f8;
    display: flex;
    flex-direction: column;
}

#files {
    margin: 0 8px;
    font-size: 13px;
    flex: 1;
    overflow: auto;
}
#files .file-checkbox {
    min-width: 0;
    padding-right: 10px;
}

#main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

#shell.collapsed {
    height: 51px !important;
}
</style>
