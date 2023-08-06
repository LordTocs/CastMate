import { defineStore } from "pinia";
import { shallowRef, ComputedRef, computed } from "vue";

export interface ProjectItem {
    id: string
    title: string,
    icon?: string,
}

export type ProjectGroupItem = ProjectItem | ProjectGroup

export interface ProjectGroup {
    id: string
    title: string,
    icon?: string,
    items: ProjectGroupItem[]
}

export const useProjectStore = defineStore("project", () => {

    const projectItems = shallowRef<ComputedRef<ProjectGroupItem>[]>([])

    function registerProjectGroupItem(item: ComputedRef<ProjectGroupItem>) {
        projectItems.value.push(item)
    }

    return { registerProjectGroupItem, projectItems: computed(() => projectItems.value.map(pi => pi.value)) }
})