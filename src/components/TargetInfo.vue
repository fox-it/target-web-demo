<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useTargetStore } from '../stores/target'

interface InfoItem {
    label: string
    value: string
}

const targetStore = useTargetStore()

const showLoading = ref(true)
const showError = ref(false)

const info = ref<InfoItem[]>([])

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
        label: 'OS family',
        function: 'os',
    },
    {
        label: 'OS version',
        function: 'version',
    },
    {
        label: 'Architecture',
        function: 'architecture',
    },
    {
        label: 'Language',
        function: 'language',
    },
    {
        label: 'Timezone',
        function: 'timezone',
    },
    {
        label: 'Install date',
        function: 'install_date',
    },
    {
        label: 'Last activity',
        function: 'activity',
    },
]

async function load() {
    if (!targetStore.currentTarget) return

    info.value = [
        {
            label: 'Path',
            value: await targetStore.currentTarget.path,
        },
    ]

    showLoading.value = true

    for (let item of infoFields) {
        let value = null
        try {
            value = await targetStore.currentTarget.execute(item.function)
        } catch (error) {
            console.error(error)
            value = 'Error (see console for details)'
        }

        if (value !== null) {
            info.value.push({
                label: item.label,
                value: Array.isArray(value) ? value.join(', ') : value,
            })
        }
    }

    showLoading.value = false
}

onMounted(async () => {
    await load()
})
</script>

<template>
    <div id="file-info" class="rounded-10">
        <h3>
            <q-icon name="info_outline" size="sm" />
            Target info
        </h3>
        <q-banner v-if="showError" class="text-white bg-red">
            An error occurred. Please see the browser console for more details and
            <a href="https://github.com/fox-it/target-web-demo/issues/new" class="text-white">create an issue</a>
            if you think this is a bug.
        </q-banner>
        <div v-for="item in info">
            <dt>{{ item.label }}</dt>
            <dd>
                <code v-if="item.value">{{ item.value }}</code>
                <code v-else class="text-muted">N/A</code>
            </dd>
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
    margin: 10px;
    padding: 20px 24px;
    background: #f3f4f8;
    min-height: 340px;
    max-height: 50%;
    overflow: auto;
}

#file-info h3 {
    margin: 0 0 10px;
}

#file-info h3 i {
    margin-top: -4px;
    margin-right: 4px;
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
</style>
