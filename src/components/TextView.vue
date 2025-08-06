<script setup lang="ts">
import type { PyIterable } from 'pyodide/ffi'
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import { QInfiniteScroll } from 'quasar'

const props = defineProps<{
    generator: PyIterable | null
}>()

const isMounted = ref(false)
const showError = ref(false)
const lines = ref<string[]>([])

const infiniteScroll = useTemplateRef('infiniteScroll')

async function loadNextLines(count: number) {
    if (!props.generator || !isMounted.value) return

    let newLines: string[] = []

    try {
        for await (let line of props.generator) {
            newLines.push(line)
            if (--count === 0) break
        }

        lines.value.push(...newLines)
        if (count !== 0) infiniteScroll.value?.stop()
    } catch (error) {
        console.error(error)
        showError.value = true
        infiniteScroll.value?.stop()
    }
}

async function onLoad(_: number, done: CallableFunction) {
    if (props.generator && isMounted.value) {
        await loadNextLines(50)
    }
    done()
}

onMounted(() => {
    isMounted.value = true
})

watch(
    () => props.generator,
    async (newGenerator) => {
        if (newGenerator) {
            showError.value = false
            lines.value = []
            infiniteScroll.value?.reset()
            infiniteScroll.value?.resume()
            await loadNextLines(50)
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
    <div id="scroll-target" class="code-block">
        <q-infinite-scroll ref="infiniteScroll" @load="onLoad" :offset="100" scroll-target="#scroll-target">
            <code style="white-space: nowrap">
                <pre v-for="line in lines">{{ line }}</pre>
            </code>
            <template v-slot:loading>
                <div class="row justify-center q-my-md">
                    <q-spinner-dots color="primary" size="40px" />
                </div>
            </template>
        </q-infinite-scroll>
    </div>
</template>

<style scoped>
.code-block {
    height: 100%;
    overflow: auto;
    background-color: #f5f5f5;
    border-width: 1px;
    border-style: solid;
    border-color: #0000001f;
    border-radius: 4px;
    padding: 5px;
}

code > pre {
    margin: 0;
}
</style>
