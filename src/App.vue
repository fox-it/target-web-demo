<script setup lang="ts">
import { computed } from 'vue'
import Playground from './pages/Playground.vue'

import { useTargetStore } from './stores/target'

const targetStore = useTargetStore()
const wantFooter = computed(() => targetStore.targets.length == 0)
</script>

<template>
    <q-layout view="hHh lpr fFf">
        <q-header class="bg-primary text-white">
            <q-toolbar>
                <q-avatar size="50px">
                    <img src="./assets/logo-dark.svg" />
                </q-avatar>
                <q-toolbar-title shrink>Dissect</q-toolbar-title>
                <q-space />
                <q-btn
                    stretch
                    flat
                    href="https://dissect.readthedocs.io/en/latest"
                    target="_blank"
                    icon="book"
                    label="Documentation"
                />
                <q-btn
                    stretch
                    flat
                    href="https://github.com/fox-it/dissect"
                    target="_blank"
                    icon="code"
                    label="GitHub"
                />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <playground />
        </q-page-container>

        <q-footer class="bg-white text-dark" v-if="wantFooter">
            <div id="footer" class="content">
                <div id="fox-logo">
                    <img height="40" src="./assets/fox-it.svg" />
                    <q-separator vertical inset color="dark" />
                </div>
                <div id="dissect-info">
                    <div>Dissect - open source enterprise investigation framework created by Fox-IT.</div>
                    <div id="dissect-copyright">&copy; Fox-IT part of NCC Group</div>
                </div>
                <div id="visit-fox">
                    <a href="https://fox-it.com/">Visit Fox-IT.com <q-icon name="open_in_new" /></a>
                </div>
            </div>
        </q-footer>
    </q-layout>
</template>

<style>
#footer {
    width: 100%;
    margin: 0 auto;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    position: fixed;
    bottom: 0;
    left: 0;
    background: white;
    z-index: 1000;
}

#footer::after {
    content: '';
    display: block;
    height: 55px;
    width: 1px;
    background: #d9dce1;
    position: absolute;
    left: 175px;
    top: 20px;
}

#fox-logo {
    display: flex;
    align-items: center;
    gap: 10px;
}

#dissect-info {
    text-align: center;
}

#dissect-copyright {
    font-size: 12px;
    font-weight: 300;
}

#visit-fox {
    display: flex;
    align-items: center;
    gap: 5px;
}
</style>
