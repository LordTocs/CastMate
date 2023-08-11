import { defineStore } from "pinia"
import { shallowRef, ComputedRef, computed, ref, App } from "vue"
import { NamedData, useDockingStore, useResource, useResourceStore } from "../main"

export interface ProjectItem {
	id: string
	title: string
	icon?: string
	open?(): any
	rename?(name: string): any
	delete?(): any
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
		console.log("REGISTERING GROUP", item)
		projectItems.value.push(item)
	}

	async function initialize() {}

	return {
		registerProjectGroupItem,
		projectItems: computed(() => projectItems.value.map((pi) => pi.value)),
		initialize,
	}
})

export function registerResourceAsProjectGroup(app: App<Element>, resourceType: string, documentType: string, groupIcon: string) {
	const projectStore = useProjectStore()
	const resources = useResource(resourceType)
	const resourceStore = useResourceStore()
	const dockingStore = useDockingStore()
	

	const group = computed<ProjectGroup>(() => {
		let items : ProjectItem[] = []
		if (resources.value) {
			const resourceItems = [...resources.value.resources.values()]

			items = resourceItems.map((r) => ({
				id: r.id,
				title: (r.config as NamedData).name ?? r.id,
				open() {
					//TODO how do we get the view data?
					dockingStore.openDocument(r.id, r.config, {}, documentType)
				},
				rename(name: string) {
					resourceStore.applyResourceConfig(resourceType, r.id, { name })
				},
				delete() {
					resourceStore.deleteResource(resourceType, r.id)

					//TODO: dockingStore.closeDocument(r.id)
					//TODO: unsaved data?
				}
			} as ProjectItem))
		}
		

		return {
			id: resourceType,
			title: resourceType,
			icon: groupIcon,
			items,
			create() {
				const dialog = app.config.globalProperties.$dialog
				if (!resources.value) return
				dialog.open(resources.value?.creationDialog, {
					props: {
						header: `New ${resourceType}`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					onClose(options) {
						if (!options) {
							return
						}

						console.log("Creating", resourceType, options.data)
						resourceStore.createResource(resourceType, options.data)
					},
				})
			},
		}
	})

	projectStore.registerProjectGroupItem(group)
}