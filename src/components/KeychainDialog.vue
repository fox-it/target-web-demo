<script setup lang="ts">
import { ref } from 'vue'

import api from '../worker/api'

const model = defineModel<boolean>()

const keys = ref<string[]>([])
const newKey = ref('')

async function addKey() {
    if (newKey.value.trim()) {
        // Check if key already exists
        if (keys.value.includes(newKey.value.trim())) {
            return
        }
        keys.value.push(newKey.value.trim())
        newKey.value = ''

        await saveKeys()
    }
}

async function removeKey(index: number) {
    keys.value.splice(index, 1)
    await saveKeys()
}

async function saveKeys() {
    await api.setKeychain([...keys.value])
}

async function clearKeys() {
    keys.value = []
    await saveKeys()
}

async function onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        await addKey()
    }
}
</script>

<template>
    <q-dialog v-model="model" persistent>
        <q-card style="min-width: 500px; max-width: 600px">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">
                    <q-icon name="key" class="q-mr-sm" />
                    Keychain Management
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-md">
                <p class="text-body2 text-grey-7 q-mb-md">
                    Add encryption keys, passwords, or recovery keys that may be needed for BitLocker, LUKS, or other
                    encrypted targets.
                </p>

                <!-- Add New Key -->
                <div class="row q-gutter-sm q-mb-md">
                    <div class="col">
                        <q-input
                            v-model="newKey"
                            type="text"
                            placeholder="Enter encryption key..."
                            dense
                            outlined
                            @keypress="onKeyPress"
                            class="code-input"
                        >
                            <template v-slot:append>
                                <q-icon v-if="newKey !== ''" name="close" @click="newKey = ''" class="cursor-pointer" />
                            </template>
                            <template v-slot:after>
                                <q-btn round dense flat icon="add" @click="addKey" :disable="!newKey.trim()" />
                            </template>
                        </q-input>
                    </div>
                </div>

                <!-- Existing Keys -->
                <div v-if="keys.length > 0" class="q-mb-md">
                    <div class="text-subtitle2 q-mb-sm">
                        <q-icon name="list" size="sm" class="q-mr-xs" />
                        Stored Keys ({{ keys.length }})
                    </div>
                    <q-list bordered separator>
                        <q-item v-for="(key, index) in keys" :key="index">
                            <q-item-section>
                                <q-item-label>
                                    <code class="text-muted">
                                        {{ key.length > 20 ? key.substring(0, 32) + '...' : key }}
                                    </code>
                                </q-item-label>
                            </q-item-section>
                            <q-item-section side>
                                <q-btn flat round dense icon="delete" color="negative" @click="removeKey(index)" />
                            </q-item-section>
                        </q-item>
                    </q-list>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center q-pa-md">
                    <q-icon name="key_off" size="48px" color="grey-4" />
                    <p class="text-grey-6 q-mt-sm">No keys stored yet</p>
                    <p class="text-caption text-grey-5">Add encryption keys to help unlock encrypted targets</p>
                </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
                <q-space />
                <q-btn flat label="Clear All" color="negative" @click="clearKeys" :disable="keys.length === 0" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<style scoped>
.q-card {
    border-radius: 12px;
}

.code-input {
    font-family: monospace;
}
</style>
