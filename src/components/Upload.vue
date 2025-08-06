<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

import { useTargetStore } from '../stores/target'

const targetStore = useTargetStore()

const dragging = ref(false)
const filesInput = useTemplateRef('filesInput')

function dragover() {
    dragging.value = true
}

function dragleave() {
    dragging.value = false
}

function drop(e: DragEvent) {
    e.stopPropagation()
    e.preventDefault()
    dragging.value = false
    const files = (e.dataTransfer as DataTransfer).files
    if (files.length > 0) {
        targetStore.files = Array.from(files)
    }
}

function updateFiles() {
    if (filesInput.value?.files) {
        targetStore.files = Array.from(filesInput.value.files)
    }
}

function preventDefault(e: Event) {
    e.stopPropagation()
    e.preventDefault()
}

onMounted(() => {
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)
})

onUnmounted(() => {
    window.removeEventListener('dragover', preventDefault)
    window.removeEventListener('drop', preventDefault)
})
</script>

<template>
    <button
        id="upload"
        class="rounded-10 text-primary"
        :class="{
            dragging: dragging,
            'text-white': dragging,
            'bg-primary': dragging,
        }"
        @click="filesInput?.click()"
        @dragover="dragover"
        @dragleave="dragleave"
        @drop.stop.prevent="drop"
    >
        <input type="file" ref="filesInput" multiple @change="updateFiles" />
        <p v-if="!dragging">
            <q-icon name="cloud_upload" />
            Drop file(s) or click here to continue
        </p>
        <p v-else>Drop here to start analyzing</p>
    </button>
</template>

<style>
#upload {
    width: 380px;
    margin: 0 auto;
    border: dotted 2px var(--q-primary);
    position: relative;
    overflow: hidden;
    background: rgba(1, 89, 211, 0.1);
    transition: all 0.3s;
    cursor: pointer;
}

#upload.dragging {
    border: solid 2px var(--q-dark);
}

#upload input {
    position: absolute;
    left: 100%;
    top: 100%;
    opacity: 0;
    width: 0;
    height: 0;
}

#upload a {
    text-decoration: underline;
}

#upload p {
    line-height: 100px;
    margin: 0;
}
</style>
