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
import type { MenuItem } from "primevue/menuitem"
import { computed, onMounted, ref } from "vue"
import { ipcRenderer } from "electron"
import { useIpcMessage, isDev } from "castmate-ui-core"
import { useDialog } from "primevue/usedialog"
import { usePageStore } from "../../util/page-store"

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
useIpcMessage("windowFuncs", "stateChanged", (event, state: string) => {
	console.log("Window State", state)
	windowState.value = state
})

const props = defineProps<{
	title: string
}>()

const dialog = useDialog()

const pageStore = usePageStore()

const menuItems = computed<MenuItem[]>(() => {
	const result: MenuItem[] = []

	const fileMenu: MenuItem = {
		label: "File",
		items: [],
	}

	result.push(fileMenu)

	fileMenu.items?.push()

	if (isDev()) {
		// fileMenu.items?.push(
		// 	{
		// 		separator: true,
		// 	},
		// 	{
		// 		label: "Input Test",
		// 		icon: "mdi mdi-pencil",
		// 		command() {
		// 			dockingStore.openPage("input-test", "Input Test", InputTestPage)
		// 		},
		// 	}
		// )
	}

	fileMenu.items?.push({
		label: "Settings",
		icon: "mdi mdi-cog",
		command() {
			pageStore.page = "settings"
		},
	})

	fileMenu.items?.push({
		label: "Exit",
		command() {
			close()
		},
	})

	const helpMenu: MenuItem = {
		label: "Help",
		items: [],
	}
	result.push(helpMenu)

	helpMenu.items?.push(
		// {
		// 	label: "About",
		// 	icon: "mdi mdi-info",
		// 	command() {
		// 		dockingStore.openPage("about", "About", AboutPage)
		// 	},
		// },
		{
			label: "Discord",
			icon: "mdi mdi-discord",
			command() {
				window.open("https://discord.gg/txt4DUzYJM")
			},
		}
	)

	return result
})
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

.system-bar :deep(.p-menubar-root-list) {
	-webkit-app-region: no-drag;
}

.system-bar :deep(.p-menubar-button) {
	-webkit-app-region: no-drag;
}

.system-bar :deep(.p-menuitem .p-submenu-icon) {
	display: none;
}

.system-bar :deep(.p-submenu-list .p-menuitem-separator) {
	border-top-color: var(--surface-400);
}
</style>
