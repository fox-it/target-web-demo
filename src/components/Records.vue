<script setup lang="ts">
import { ref, watch } from 'vue'

import RecordTable from './RecordTable.vue'
import TextView from './TextView.vue'

import { useTargetStore } from '../stores/target'
import type { RemotePyIterator } from '../types/remote'

const targetStore = useTargetStore()

const showLoading = ref(true)
const showError = ref(false)

const availableFunctions = ref<string[]>([])
const selectedFunction = ref<string | null>(null)

const generator = ref<RemotePyIterator<any> | null>(null)

const outputOptions = [
    { label: 'Table', value: 'object' },
    { label: 'Text', value: 'text' },
    { label: 'Line', value: 'line' },
]
const selectedOutput = ref(outputOptions[0].value)

async function getGenerator() {
    if (!selectedFunction.value) {
        return
    }

    const result = await targetStore.currentTarget?.execute(selectedFunction.value, selectedOutput.value)

    if (generator.value) {
        generator.value.destroy()
    }
    generator.value = result
}

watch(
    () => targetStore.currentTarget,
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
    { immediate: true },
)
</script>

<template>
    <div v-if="targetStore.currentTarget" id="records">
        <div id="records-header">
            <div class="header-left">
                <q-icon name="plagiarism" size="sm" />
                <span class="header-text">Records</span>
            </div>
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
                                selectedOutput = option.value
                                getGenerator()
                            }
                        "
                        no-caps
                        :class="{ active: selectedOutput == option.value }"
                    />
                </q-btn-group>
            </div>
        </div>
        <q-banner v-if="showError" class="text-white bg-red">
            An error occurred. Please see the browser console for more details and
            <a href="https://github.com/fox-it/target-web-demo/issues/new" class="text-white">create an issue</a>
            if you think this is a bug.
        </q-banner>
        <div v-if="showLoading" class="q-pa-md q-gutter-xs">
            <div class="row q-gutter-md justify-center">
                <q-spinner color="primary" size="3em" />
            </div>
        </div>
        <div v-else-if="selectedFunction" id="records-content">
            <div v-if="selectedOutput === 'object'">
                <record-table :function="selectedFunction" />
            </div>
            <div v-else>
                <text-view :function="selectedFunction" :output="selectedOutput" />
            </div>
        </div>
        <div v-else class="text-center" style="line-height: 100px">
            <p>Select a function from the dropdown</p>
        </div>
    </div>
</template>

<style scoped>
#records {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
}

#records-header {
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

#records-controls {
    display: flex;
    align-items: center;
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
    flex: 1;
    overflow: auto;
}
#records-content > div {
    height: 100% !important;
}
</style>
