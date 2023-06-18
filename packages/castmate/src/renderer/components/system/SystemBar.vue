<template>
	<!-- <div class="system-bar">
		<span class="title"> {{ title }}</span>
		<p-button icon="pi pi-times" text rounded aria-label="Close"></p-button>
	</div> -->
	<p-menubar :model="menuItems" class="system-bar windrag">
		<template #start>
			{{ title }}
		</template>
	</p-menubar>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import PMenubar from "primevue/menubar"
import { type MenuItem } from "primevue/menuitem"
import { ref } from "vue"

const props = defineProps<{
	title: string
}>()

const menuItems = ref<MenuItem[]>([
	{
		label: "File",
		icon: "pi pi-fw pi-file",
		items: [
			{
				label: "Hello World",
			},
		],
	},
])
</script>

<style setup>
.title {
	flex: 1;
}

.windrag {
	-webkit-app-region: drag;
}

.system-bar {
	padding: 0 !important;
	border-radius: 0 !important;
}
</style>
