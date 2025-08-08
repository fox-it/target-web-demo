import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import api from '../worker/api'
import type { RemoteTarget } from '../types/remote'

export interface TargetItem {
    file: File
    target: RemoteTarget | null
    path: string
    loading: boolean
}

export const useTargetStore = defineStore('target', () => {
    // All files that have been selected/"uploaded"
    const files = ref<File[]>([])

    // Wrapped files with additional state
    const targets = ref<TargetItem[]>([])

    // Currently active target
    const currentItem = ref<TargetItem | null>(null)
    const currentTarget = computed(() => currentItem.value?.target || null)

    function setCurrentTarget(item: TargetItem | null) {
        currentItem.value = item
    }

    function clearCurrentTarget() {
        setCurrentTarget(null)
    }

    async function openTarget(item: TargetItem) {
        item.loading = true
        item.target = await api.openTarget(`/t/${item.file.name}`)
        item.path = await item.target.path
        item.loading = false

        if (targets.value.length === 1) {
            setCurrentTarget(item)
        }
    }

    async function reloadTarget(item: TargetItem) {
        await item.target?.destroy()
        await openTarget(item)
    }

    function isOpened(item: TargetItem) {
        return item.target !== null
    }

    function isCurrentTarget(item: TargetItem) {
        return item === currentItem.value
    }

    async function removeFile(item: TargetItem) {
        item.loading = true
        await item.target?.destroy()
        await api.unmapFile(item.file)

        files.value = files.value.filter((f) => f !== item.file)
    }

    watch(files, async (newFiles, oldFiles) => {
        // Update the targets list based on the files
        targets.value = newFiles.map((file) => {
            const existingTarget = targets.value.find((t) => t.file === file)
            return {
                file,
                target: existingTarget ? existingTarget.target : null,
                path: existingTarget ? existingTarget.path : '',
                loading: existingTarget ? existingTarget.loading : false,
            }
        })

        // Map new files to the worker
        for (let file of newFiles) {
            if (oldFiles.indexOf(file) === -1) api.mapFile(file)
        }
    })

    watch(targets, async (newTargets, oldTargets) => {
        // If we only uploaded one file, open it
        if (oldTargets.length == 0 && newTargets.length == 1) {
            openTarget(newTargets[0])
        }
    })

    return {
        files,
        targets,
        currentItem,
        currentTarget,

        setCurrentTarget,
        clearCurrentTarget,

        openTarget,
        reloadTarget,
        isOpened,
        isCurrentTarget,

        removeFile,
    }
})
