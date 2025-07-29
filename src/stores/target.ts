import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { RemoteTarget } from '../types/Remote'
import api from '../worker/api'

export const useTargetStore = defineStore('target', () => {
    const allFiles = ref<File[]>([])
    const openFiles = ref<File[]>([])

    const target = ref<RemoteTarget | null>(null)
    const filename = ref('')

    function setTarget(newTarget: RemoteTarget | null, newFilename: string) {
        target.value = newTarget
        filename.value = newFilename
    }

    function clearTarget() {
        setTarget(null, '')
    }

    function openFile(file: File) {
        let idx = openFiles.value.indexOf(file)
        if (idx == -1) {
            openFiles.value.push(file)
        } else {
            openFiles.value.splice(idx, 1)
        }
    }

    function removeFile(file: File) {
        const fileIdx = allFiles.value.indexOf(file)
        if (fileIdx != -1) {
            allFiles.value.splice(fileIdx, 1)
        }
        const targetIdx = openFiles.value.indexOf(file)
        if (targetIdx != -1) {
            openFiles.value.splice(targetIdx, 1)
        }
    }

    watch(allFiles, (newFiles, oldFiles) => {
        for (let file of newFiles) {
            let oldIdx = oldFiles.indexOf(file)
            if (oldIdx === -1) api.mapFile(file)
        }

        for (let file of oldFiles) {
            let newIdx = newFiles.indexOf(file)
            if (newIdx === -1) api.unmapFile(file)
        }

        // Open the only file that was uploaded
        if (oldFiles.length == 0 && newFiles.length == 1) {
            openFile(newFiles[0])
        }
    })

    return {
        target,
        filename,
        allFiles,
        openFiles,

        setTarget,
        clearTarget,
        openFile,
        removeFile,
    }
})
