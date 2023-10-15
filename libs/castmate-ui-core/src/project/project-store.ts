import { defineStore } from "pinia"
import { shallowRef, ComputedRef, computed, ref, App, VueElementConstructor, Component } from "vue"
import { NamedData, useDockingStore, useResourceData, useResourceStore } from "../main"
import NameDialogVue from "../components/dialogs/NameDialog.vue"
import { ResourceData } from "castmate-schema"

export interface ProjectItem {
	id: string
	title: string
	icon?: string
	open?(): any
	rename?(name: string): any
	delete?(): any
	endComponent?: Component
}

export type ProjectGroupItem = ProjectItem | ProjectGroup

export interface ProjectGroup {
	id: string
	title: string
	icon?: string
	items: ProjectGroupItem[]
	create?(): any
}

export const useProjectStore = defineStore("project", () => {
	const projectItems = ref<ComputedRef<ProjectGroupItem>[]>([])

	function registerProjectGroupItem(item: ComputedRef<ProjectGroupItem>) {
		projectItems.value.push(item)
	}

	async function initialize() {}

	return {
		registerProjectGroupItem,
		projectItems: computed(() => projectItems.value.map((pi) => pi.value)),
		initialize,
	}
})

interface ResourceGroupConfig<TData extends ResourceData> {
	resourceType: string
	resourceName?: string
	documentType: string
	groupIcon?: string
	creationDialog?: VueElementConstructor
	createView?: (resource: TData) => object
}

export function getResourceAsProjectGroup<TData extends ResourceData>(
	app: App<Element>,
	config: ResourceGroupConfig<TData>
) {
	const resources = useResourceData<TData>(config.resourceType)
	const resourceStore = useResourceStore()
	const dockingStore = useDockingStore()

	const group = computed<ProjectGroup>(() => {
		let items: ProjectItem[] = []
		if (resources.value) {
			const resourceItems = [...resources.value.resources.values()]

			items = resourceItems.map(
				(r) =>
					({
						id: r.id,
						title: (r.config as NamedData).name ?? r.id,
						open() {
							//TODO how do we get the view data?
							dockingStore.openDocument(r.id, r.config, config.createView?.(r) ?? {}, config.documentType)
						},
						rename(name: string) {
							resourceStore.applyResourceConfig(config.resourceType, r.id, { name })
						},
						delete() {
							resourceStore.deleteResource(config.resourceType, r.id)

							//TODO: dockingStore.closeDocument(r.id)
							//TODO: unsaved data?
						},
					} as ProjectItem)
			)
		}

		const title = config.resourceName ?? config.resourceType

		return {
			id: config.resourceType,
			title: config.resourceType,
			icon: config.groupIcon,
			items,
			create() {
				const dialog = app.config.globalProperties.$dialog
				if (!resources.value) return
				dialog.open(config.creationDialog ?? NameDialogVue, {
					props: {
						header: `New ${title}`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					onClose(options) {
						if (!options) {
							return
						}

						console.log("Creating", config.resourceType, options.data)
						resourceStore.createResource(config.resourceType, options.data)
					},
				})
			},
		}
	})
	return group
}

export function registerResourceAsProjectGroup<TData extends ResourceData>(
	app: App<Element>,
	config: ResourceGroupConfig<TData>
) {
	const projectStore = useProjectStore()
	const group = getResourceAsProjectGroup(app, config)
	projectStore.registerProjectGroupItem(group)
}
