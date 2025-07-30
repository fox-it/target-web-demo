<script setup lang="ts">
import type { PyIterator } from 'pyodide/ffi'
import { ref, watch } from 'vue'

import RecordTable from './RecordTable.vue'
import TextView from './TextView.vue'

import type { RemoteTarget } from '../types/Remote'
import { useTargetStore } from '../stores/target'

const targetStore = useTargetStore()

const showLoading = ref(true)
const showError = ref(false)

const availableFunctions = ref<string[]>([])
const selectedFunction = ref<string | null>(null)

const generator = ref<PyIterator | null>(null)

const outputOptions = [
    { label: 'Table', value: 'object' },
    { label: 'Text', value: 'text' },
    { label: 'Line', value: 'line' },
]
const outputSelect = ref(outputOptions[0].value)

async function getGenerator() {
    if (!selectedFunction.value) {
        return
    }

    const result = await targetStore.target?.execute(selectedFunction.value, outputSelect.value)

    if (generator.value) {
        generator.value.destroy()
    }
    generator.value = result
}

watch(
    () => targetStore.target,
    async (newTarget) => {
        if (!newTarget) {
            return
        }

        showLoading.value = true
        showError.value = false

        availableFunctions.value = []
        selectedFunction.value = null

        generator.value = null

        try {
            availableFunctions.value = await newTarget.allRecordFunctions()
        } catch (error) {
            console.error(error)
            showError.value = true
        }

        showLoading.value = false
    },
    { immediate: true }
)
</script>

<template>
    <div v-if="targetStore.target" id="records">
        <q-banner v-if="showError" class="text-white bg-red">
            An error occurred. Please see the browser console for more details and
            <a href="https://github.com/fox-it/target-web-demo/issues/new" class="text-white">create an issue</a>
            if you think this is a bug.
        </q-banner>
        <div id="records-header">
            <div id="records-controls">
                <q-btn-dropdown
                    no-caps
                    :label="selectedFunction ? `Function: ${selectedFunction}` : 'Function'"
                    rounded
                    flat
                >
                    <q-list>
                        <q-item
                            v-for="option in availableFunctions"
                            clickable
                            v-close-popup="true"
                            @click="
                                () => {
                                    selectedFunction = option
                                    getGenerator()
                                }
                            "
                        >
                            <q-item-section>
                                <q-item-label>{{ option }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>

                <q-btn-group outline rounded>
                    <q-btn
                        v-for="option in outputOptions"
                        :label="option.label"
                        @click="
                            () => {
                                outputSelect = option.value
                                getGenerator()
                            }
                        "
                        no-caps
                        :class="{ active: outputSelect == option.value }"
                    />
                </q-btn-group>
            </div>
            <h2>{{ targetStore.filename }}</h2>
        </div>
        <div v-if="showLoading" class="q-pa-md q-gutter-xs">
            <div class="row q-gutter-md justify-center">
                <q-spinner color="primary" size="3em" />
            </div>
        </div>
        <div v-else-if="selectedFunction" id="records-content">
            <div v-if="outputSelect === 'object'">
                <record-table :generator="generator" />
            </div>
            <div v-else>
                <text-view :generator="generator" />
            </div>
        </div>
        <div v-else class="text-center" style="line-height: 100px">
            <p>Select a function from the dropdown</p>
        </div>
    </div>
</template>

<style>
#records {
    display: block;
    height: 60%;
    width: 100%;
    position: absolute;
    left: 0;
    top: 0;
}

#records h2 {
    margin: 8px 0;
    font-size: 16px;
    line-height: 50px;
    overflow: hidden;
    text-overflow: ellipsis;
}

#records-header {
    margin: 0 20px;
    border-bottom: solid 1px #f3f4f8;
}

#records-controls {
    float: right;
    white-space: nowrap;
}

#records-controls .q-btn-group {
    margin-left: 20px;
    border: solid 1px #f3f4f8;
    background: #f3f4f8;
}

#records-controls .active {
    background: #fff;
}

#records-controls .q-btn-dropdown {
    border: solid 1px #f3f4f8;
}

#records-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: 60px;
}
#records-content > div {
    height: 100% !important;
}
</style>
