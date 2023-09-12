import { computed } from "vue"
import { ProjectItem } from "./../../../../../libs/castmate-ui-core/src/project/project-store"
import { useDockingStore, useProjectStore } from "castmate-ui-core"
import QueuePage from "../components/queues/QueuePage.vue"

export function initializeQueues() {
	const dockingStore = useDockingStore()
	const projectStore = useProjectStore()

	const projectItem = computed<ProjectItem>(() => {
		return {
			id: "queues",
			title: "Queues",
			icon: "mdi mdi-tray-full",
			open() {
				dockingStore.openPage("queues", "Queues", QueuePage)
			},
		}
	})

	projectStore.registerProjectGroupItem(projectItem)
}
