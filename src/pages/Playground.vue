<script setup lang="ts">
import { ref, watch } from 'vue'
import FileInfo from '../components/FileInfo.vue'
import Records from '../components/Records.vue'
import TargetShell from '../components/TargetShell.vue'
import Upload from '../components/Upload.vue'
import { type RemoteTarget } from '../types/Remote'

import api from '../worker/api'

import { useTargetStore } from '../stores/target'

const targetStore = useTargetStore()

const emit = defineEmits<{
    (e: 'updateWantFooter', newWantFooter: boolean): void
}>()

const showLoading = ref(true)
const loadingMessage = ref('Loading, please wait...')

api.load().then(() => {
    showLoading.value = false
    ;(window as any).api = api
})

const broadcast = new BroadcastChannel('worker')
broadcast.onmessage = (event) => {
    loadingMessage.value = event.data
}
</script>

<template>
    <q-page>
        <q-inner-loading :showing="showLoading">
            <q-spinner-gears size="50px" color="primary" />
            <p class="q-py-md">{{ loadingMessage }}</p>
        </q-inner-loading>
        <div v-if="!showLoading">
            <div class="content text-center" v-if="targetStore.allFiles.length == 0">
                <h1>Dissect Playground</h1>
                <p class="text-subtitle1">To start playing around you need to select your files.</p>
                <upload v-model="targetStore.allFiles" />
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
                        <a href="https://dissect.readthedocs.io/en/latest/overview/index.html#targets"
                            >the documentation on targets.</a
                        >
                    </p>
                </div>
            </div>
            <div id="browser" v-else>
                <div id="sidebar">
                    <h2>Files</h2>
                    <q-list separator id="files">
                        <q-item
                            clickable
                            dense
                            v-ripple
                            v-for="file in targetStore.allFiles"
                            :class="{ selected: targetStore.openFiles.includes(file) }"
                            @click="openFile(file)"
                        >
                            <q-item-section avatar side class="file-checkbox">
                                <q-icon
                                    size="xs"
                                    :name="
                                        targetStore.openFiles.includes(file) ? 'check_box' : 'check_box_outline_blank'
                                    "
                                />
                            </q-item-section>
                            <q-item-section>{{ file.name }}</q-item-section>
                            <q-item-section side>
                                <q-btn flat round icon="delete" @click.stop="targetStore.removeFile(file)" />
                            </q-item-section>
                        </q-item>
                    </q-list>
                    <file-info v-if="targetStore.openFiles.length > 0" />
                </div>
                <div id="main">
                    <records v-if="targetStore.target" />
                    <target-shell v-if="targetStore.target" />
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
#info .q-icon {
    float: left;
    margin: 8px;
}

#filetypes {
    font-size: 12px;
    width: 380px;
    margin: 10px auto 0;
}

#browser {
    width: 100%;
    height: 100%;
    position: absolute;
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
</style>
