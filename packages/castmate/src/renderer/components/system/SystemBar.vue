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
import { MenuItem } from "primevue/menuitem"
//import PMenuItem, { type MenuItem } from "primevue/menuitem" //WTF man
import { computed, onMounted, ref } from "vue"
import { ipcRenderer } from "electron"
import { useEventListener } from "@vueuse/core"
import {
	useDockingStore,
	useIpcMessage,
	isProduction,
	NameDialog,
	useResourceStore,
	useOpenProfileDocument,
	useOpenAutomationDocument,
	useSaveActiveTab,
	useSaveAllTabs,
} from "castmate-ui-core"
import { useOpenSettings } from "../settings/SettingsTypes"
import InputTestPage from "../test/InputTestPage.vue"
import { useDialog } from "primevue/usedialog"

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

const dockingStore = useDockingStore()

const openSettings = useOpenSettings()

const dialog = useDialog()

const resourceStore = useResourceStore()

const openProfile = useOpenProfileDocument()
const openAutomation = useOpenAutomationDocument()

const saveActiveTab = useSaveActiveTab()
const saveAllTabs = useSaveAllTabs()

function tryCreateProfile() {
	dialog.open(NameDialog, {
		props: {
			header: `New Profile`,
			style: {
				width: "25vw",
			},
			modal: true,
		},
		async onClose(options) {
			if (!options?.data) {
				return
			}
			const id = await resourceStore.createResource("Profile", options.data)
			openProfile(id)
		},
	})
}

function tryCreateAutomation() {
	dialog.open(NameDialog, {
		props: {
			header: `New Automation`,
			style: {
				width: "25vw",
			},
			modal: true,
		},
		async onClose(options) {
			if (!options?.data) {
				return
			}
			const id = await resourceStore.createResource("Automation", options.data)
			openAutomation(id)
		},
	})
}

const menuItems = computed<MenuItem[]>(() => {
	const result: MenuItem[] = []

	const fileMenu: MenuItem = {
		label: "File",
		items: [],
	}

	result.push(fileMenu)

	fileMenu.items?.push(
		{
			label: "New Profile",
			icon: "mdi mdi-card-text-outline",
			command() {
				tryCreateProfile()
			},
		},
		{
			label: "New Automation",
			icon: "mdi mdi-cogs",
			command() {
				tryCreateAutomation()
			},
		},
		{
			separator: true,
		},
		{
			label: "Save",
			icon: "mdi mdi-content-save",
			command() {
				saveActiveTab()
			},
		},
		{
			label: "Save All",
			icon: "mdi mdi-content-save-all",
			command() {
				saveAllTabs()
			},
		},
		{
			separator: true,
		},
		{
			label: "Settings",
			icon: "mdi mdi-cog",
			command() {
				openSettings()
			},
		}
	)

	if (!isProduction()) {
		fileMenu.items?.push(
			{
				separator: true,
			},
			{
				label: "Input Test",
				icon: "mdi mdi-pencil",
				command() {
					dockingStore.openPage("input-test", "Input Test", InputTestPage)
				},
			}
		)
	}

	const helpMenu: MenuItem = {
		label: "Help",
		items: [],
	}
	result.push(helpMenu)

	helpMenu.items?.push({
		label: "Discord",
		icon: "mdi mdi-discord",
		command() {
			window.open("https://discord.gg/txt4DUzYJM")
		},
	})

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

.system-bar :deep(.p-menuitem .p-submenu-icon) {
	display: none;
}

.system-bar :deep(.p-submenu-list .p-menuitem-separator) {
	border-top-color: var(--surface-400);
}
</style>
