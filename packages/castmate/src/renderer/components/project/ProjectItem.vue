<template>
	<div
		class="project-item"
		:class="{ openable: props.item?.open != null }"
		:style="{ '--indent': indent }"
		@click="onClick"
		@contextmenu="showContext"
	>
		<i class="chevron-spacer"></i>
		<slot name="icon">
			<i :class="item.icon" class="px-1" v-if="item.icon"></i>
			<i class="chevron-spacer" v-else></i>
		</slot>
		<div class="project-item-title">{{ item.title }}</div>
		<slot name="end">
			<component v-if="item.endComponent" :is="item.endComponent" :item="item" />
		</slot>
		<c-context-menu ref="contextMenu" :items="menuItems" />
	</div>
</template>

<script setup lang="ts">
import { ProjectItem, NameDialog, CContextMenu } from "castmate-ui-core"
import { MenuItem } from "primevue/menuitem"
import { computed, ref } from "vue"
import { useDialog } from "primevue/usedialog"
import { useConfirm } from "primevue/useconfirm"

const props = withDefaults(
	defineProps<{
		item: ProjectItem
		indent?: number
	}>(),
	{ indent: 0 }
)
const dialog = useDialog()
const confirm = useConfirm()
const contextMenu = ref<InstanceType<typeof CContextMenu>>()
const menuItems = computed<MenuItem[]>(() => {
	const items: MenuItem[] = []

	if (props.item.rename) {
		items.push({
			label: "Rename",
			icon: "mdi mdi-rename",
			command: (event) => {
				dialog.open(NameDialog, {
					props: {
						header: `Rename ${props.item.title}?`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					data: {
						existingName: props.item.title,
					},
					onClose(options) {
						if (!options?.data) {
							return
						}

						props.item.rename?.(options.data as string)
					},
				})
			},
		})
	}

	if (props.item.delete) {
		items.push({
			label: "Delete",
			icon: "mdi mdi-delete",
			command: (event) => {
				console.log("Delete?")
				confirm.require({
					header: `Delete ${props.item.title}?`,
					message: `Are you sure you want to delete ${props.item.title}?`,
					icon: "mdi mdi-trash",
					accept() {
						props.item.delete?.()
					},
					reject() {},
				})
			},
		})
	}

	return items
})

function onClick(ev: MouseEvent) {
	if (ev.button == 0) {
		props.item?.open?.()
		ev.preventDefault()
		ev.stopPropagation()
	}
}

function showContext(ev: MouseEvent) {
	if (menuItems.value.length == 0) return

	contextMenu.value?.show(ev)
}
</script>

<style scoped>
.project-item {
	height: 2rem;
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	padding-left: calc(var(--indent) * 1em);
	padding-right: 0.5rem;
}

.openable {
	cursor: pointer;
}

.chevron-spacer {
	display: inline-block;
	width: 1em;
	height: 1em;
}

.project-item-title {
	flex: 1;
	user-select: none;
}

.project-item:hover {
	background-color: var(--highlight-bg);
}
</style>
