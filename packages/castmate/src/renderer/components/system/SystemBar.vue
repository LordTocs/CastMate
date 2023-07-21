<template>
	<!-- <div class="system-bar">
		<span class="title"> {{ title }}</span>
		<p-button icon="pi pi-times" text rounded aria-label="Close"></p-button>
	</div> -->
	<p-menubar :model="menuItems" class="system-bar windrag">
		<template #start>
			<img src="../../assets/castmate/logo-dark.svg" style="height: 1em; padding-left: 1rem" />
		</template>
		<template #end>
			<p-button
				class="non-windrag"
				icon="mdi mdi-window-minimize"
				text
				aria-label="Minimize"
				@click="minimize"
				tabindex="none"
			></p-button>
			<p-button
				class="non-windrag"
				:icon="`mdi mdi-window-${windowState == 'maximized' ? 'restore' : 'maximize'}`"
				text
				aria-label="Maximize"
				@click="toggleMax"
				tabindex="none"
			></p-button>
			<p-button class="non-windrag" icon="mdi mdi-close" text aria-label="Close" @click="close"></p-button>
		</template>
	</p-menubar>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import PMenubar from "primevue/menubar"
//import PMenuItem, { type MenuItem } from "primevue/menuitem" //WTF man
import { onMounted, ref } from "vue"
import { ipcRenderer } from "electron"
import { useEventListener } from "@vueuse/core"
import { useIpcMessage } from "castmate-ui-core"

async function close() {
	await ipcRenderer.invoke("windowFuncs_close")
}

async function minimize() {
	await ipcRenderer.invoke("windowFuncs_minimize")
}

async function maximize() {
	await ipcRenderer.invoke("windowFuncs_maximize")
}

async function restore() {
	await ipcRenderer.invoke("windowFuncs_restore")
}

async function toggleMax() {
	if (windowState.value == "unmaximized") {
		await maximize()
	} else {
		await restore()
	}
}

const windowState = ref<string>("unmaximized")
useIpcMessage("windowFuncs_stateChanged", (event, state: string) => {
	console.log("Window State", state)
	windowState.value = state
})

const props = defineProps<{
	title: string
}>()

const menuItems = ref([
	{
		label: "File",
		icon: "pi pi-fw pi-file",
		items: [
			{
				label: "Hello World",
			},
		],
	},
	{
		label: "File2",
		icon: "pi pi-fw pi-file",
		items: [
			{
				label: "Hello World",
			},
		],
	},
])
</script>

<style scoped>
.title {
	flex: 1;
}

.windrag {
	-webkit-app-region: drag;
}

.non-windrag {
	-webkit-app-region: no-drag;
}

.system-bar {
	padding: 0 !important;
	border-radius: 0 !important;
}

.system-bar >>> .p-menubar-root-list {
	-webkit-app-region: no-drag;
}
</style>
