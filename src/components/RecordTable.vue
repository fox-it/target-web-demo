<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import { useTargetStore } from '../stores/target'
import type { RemotePyIterator } from '../types/remote'

interface Cell {
    name: string
    label: string
    field: string
    align: 'left'
}

type RecordValue = string | number | object | undefined
interface Record {
    _type: string
    _data: [string, RecordValue][]
}

const targetStore = useTargetStore()

const props = defineProps<{
    function: string
}>()

let generator: RemotePyIterator<Record> | null = null

const showLoading = ref(true)
const showError = ref(false)
let reachedEnd = false

let allRows = [] as Record[]
const pageIndex = ref(1)
const pageSize = 50

const rows = computed(() => allRows.slice(0, pageSize * pageIndex.value))
const columns = ref<Cell[]>([])

async function loadNextRecords(count: number) {
    if (!generator || showLoading.value || reachedEnd) return

    showLoading.value = true

    let newRecords = []
    let columnKeys = new Set(columns.value.map((col) => col.field))

    for await (let record of generator || []) {
        if (record['_type'] == 'recorddescriptor') {
            record['_data'][1]
                .filter((item: any) => !columnKeys.has(item[1]))
                .forEach((item: any) => {
                    let field = item[1]

                    columnKeys.add(field)
                    columns.value.push({
                        name: field,
                        label: field,
                        field: field,
                        align: 'left',
                    })
                })
        } else {
            newRecords.push(record)
            if (--count == 0) break
        }
    }

    allRows.push(...newRecords)

    showLoading.value = false
    if (count != 0) reachedEnd = true
}

async function onScroll({ to, ref }: any) {
    const lastIndex = rows.value.length - 1

    if (generator && !showLoading.value && !reachedEnd && to === lastIndex) {
        pageIndex.value += 1

        await loadNextRecords(50)
        nextTick(() => {
            ref.refresh()
        })
    }
}

watch(
    () => props.function,
    async (newFunction, oldFunction) => {
        if (!newFunction || (oldFunction === undefined && generator)) {
            // Nothing actually changed
            return
        }

        if (generator) {
            await generator.destroy()
        }
        generator = await targetStore.currentTarget?.execute(props.function, 'object')

        reachedEnd = false
        showLoading.value = false
        showError.value = false
        allRows = []
        columns.value = []
        pageIndex.value = 0

        try {
            await loadNextRecords(50)
            pageIndex.value = 1
        } catch (error) {
            console.error(error)
            showError.value = true
        }
    },
    { immediate: true }
)
</script>

<template>
    <q-banner v-if="showError" class="text-white bg-red">
        An error occurred. Please see the browser console for more details and
        <a href="https://github.com/fox-it/target-web-demo/issues/new" class="text-white">create an issue</a>
        if you think this is a bug.
    </q-banner>
    <q-table
        class="sticky-dynamic"
        flat
        :rows="rows"
        :columns="columns"
        :loading="showLoading"
        virtual-scroll
        :virtual-scroll-item-size="48"
        :virtual-scroll-sticky-size-start="48"
        :pagination="{ rowsPerPage: 0 }"
        :rows-per-page-options="[0]"
        @virtual-scroll="onScroll"
    />
</template>

<style>
.sticky-dynamic {
    height: 100%;
}

.sticky-dynamic .q-table__top,
.sticky-dynamic .q-table__bottom,
.sticky-dynamic thead tr:first-child th {
    background-color: #fff;
}

.sticky-dynamic thead tr th {
    position: sticky;
    z-index: 1;
}

.sticky-dynamic thead tr:last-child th {
    top: 48px;
}

.sticky-dynamic thead tr:first-child th {
    top: 0;
}
</style>
