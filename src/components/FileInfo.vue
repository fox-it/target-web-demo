<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import type { RemoteTarget } from '../types/Remote'

import api from '../worker/api'
import { useTargetStore } from '../stores/target'

interface InfoItem {
    label: string
    value: string
}

const targetStore = useTargetStore()

const showLoading = ref(true)
const showError = ref(false)

const target = ref<RemoteTarget | null>(null)
const index = ref(0)
const info = ref<InfoItem[]>([])

const hasNextFile = computed(() => targetStore.openFiles.length > 1 && index.value + 1 < targetStore.openFiles.length)
const hasPrevFile = computed(() => targetStore.openFiles.length > 1 && index.value > 0)
const file = computed(() => targetStore.openFiles[index.value])
const path = computed(() => `/t/${file.value.name}`)

const infoFields = [
    {
        label: 'Hostname',
        function: 'hostname',
    },
    {
        label: 'Domain',
        function: 'domain',
    },
    {
        label: "IP's",
        function: 'ips',
    },
    {
        label: 'OS version',
        function: 'version',
    },
]

async function load() {
    info.value = [
        {
            label: 'Path',
            value: path.value,
        },
    ]

    try {
        target.value = await api.openTarget(path.value)
        ;(window as any).target = target.value // For debugging purposes

        await loadInfo()
        showLoading.value = false

        // Notify parent of current, after loading in data has completed
        await nextTick(() => targetStore.setTarget(target.value, file.value.name))
    } catch (error) {
        console.error(error)
        showError.value = true
        showLoading.value = false
    }
}

async function unload() {
    await target.value?.destroy()
    targetStore.clearTarget()
}

async function changeIndex(offset: number) {
    index.value += offset
    await unload()
    await load()
}

async function loadInfo() {
    if (!target.value) return

    for (let item of infoFields) {
        let value
        try {
            value = await target.value.execute(item.function)
        } catch (error) {
            console.error(error)
            value = 'Error (see console for details)'
        }

        if (typeof value !== 'undefined') {
            info.value.push({
                label: item.label,
                value: Array.isArray(value) ? value.join(', ') : value,
            })
        }
    }
}

onMounted(async () => {
    await load()
})

onUnmounted(async () => {
    await unload()
})
</script>

<template>
    <div id="file-info" class="rounded-10">
        <div v-if="targetStore.openFiles.length > 1" id="file-info-controls">
            <q-icon
                name="arrow_back_ios"
                :class="{ inactive: !hasPrevFile }"
                @click="hasPrevFile ? changeIndex(-1) : null"
            />
            <q-icon
                name="arrow_forward_ios"
                :class="{ inactive: !hasNextFile }"
                @click="hasNextFile ? changeIndex(1) : null"
            />
        </div>
        <h3>
            File info
            <span v-if="targetStore.openFiles.length > 1">({{ index + 1 }}/{{ openFiles.length }})</span>
        </h3>
        <q-banner v-if="showError" class="text-white bg-red">
            An error occurred. Please see the browser console for more details and
            <a href="https://github.com/fox-it/target-web-demo/issues/new" class="text-white">create an issue</a>
            if you think this is a bug.
        </q-banner>
        <div v-for="item in info">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
        </div>
        <div v-if="showLoading" class="q-pa-md q-gutter-xs">
            <div class="row q-gutter-md justify-center">
                <q-spinner color="primary" size="3em" />
            </div>
        </div>
    </div>
</template>

<style>
#file-info {
    position: absolute;
    bottom: 10px;
    padding: 20px 24px;
    background: #f3f4f8;
    left: 10px;
    right: 10px;
    min-height: 340px;
}

#file-info h3 {
    margin: 0 0 10px;
}

#file-info dt {
    text-transform: uppercase;
    color: #6b7386;
    font-size: 10px;
}

#file-info dd {
    font-size: 12px;
    color: #2b343c;
    margin: 4px 0 16px;
}

#file-info-controls {
    float: right;
}
#file-info-controls .q-icon {
    cursor: pointer;
}
#file-info-controls .q-icon.inactive {
    cursor: default;
    color: #6b7386;
}
</style>
