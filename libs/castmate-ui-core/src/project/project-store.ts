import { defineStore } from "pinia"
import { shallowRef, ComputedRef, computed, ref } from "vue"

export interface ProjectItem {
	id: string
	title: string
	icon?: string
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
