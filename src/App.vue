<script setup lang="ts">
import { computed } from 'vue'
import Playground from './pages/Playground.vue'

import { useTargetStore } from './stores/target'

const targetStore = useTargetStore()
const wantFooter = computed(() => targetStore.openFiles.length == 0)
</script>

<template>
    <q-layout view="hHh lpr fFf">
        <q-header class="bg-primary text-white">
            <q-toolbar>
                <q-toolbar-title shrink>
                    <q-avatar size="50px">
                        <img src="./assets/logo-dark.svg" />
                    </q-avatar>
                    Dissect
                </q-toolbar-title>
                <q-separator vertical dark inset />
                <q-btn
                    stretch
                    flat
                    href="https://dissect.readthedocs.io/en/latest"
                    target="_blank"
                    label="Documentation"
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
    position: relative;
    height: 100px;
}

#footer > div {
    position: absolute;
    top: 0;
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
    left: 0;
    padding-top: 23px;
}

#dissect-info {
    padding-top: 23px;
    left: 200px;
}

#dissect-copyright {
    font-size: 12px;
    font-weight: 300;
}

#visit-fox {
    line-height: 100px;
    right: 0;
}
</style>
