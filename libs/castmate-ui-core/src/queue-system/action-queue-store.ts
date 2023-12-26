import { defineStore } from "pinia"
import { useIpcCaller, handleIpcMessage } from "../main"
import { Sequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { MaybeRefOrGetter, computed, ref, toValue, inject, ComputedRef, nextTick } from "vue"

export interface TestSequenceData {
	running: boolean
	activeIds: Record<string, number> //Maps active ids to their start time
}

export const useActionQueueStore = defineStore("actionQueues", () => {
	const runTestSequence = useIpcCaller<
		(id: string, sequence: Sequence, trigger?: { plugin?: string; trigger?: string }) => void
	>("actionQueue", "runTestSequence")
	const stopTestSequence = useIpcCaller<(id: string) => void>("actionQueue", "stopTestSequence")

	const activeTestSequences = ref<Record<string, TestSequenceData>>({})

	async function initialize() {
		handleIpcMessage("actionQueue", "markTestSequenceStart", (event, sequenceId: string) => {
			console.log("Sequence", sequenceId, "Started")
			activeTestSequences.value[sequenceId] = { running: true, activeIds: {} }
		})

		handleIpcMessage("actionQueue", "markTestSequenceEnd", (event, sequenceId: string) => {
			console.log("Sequence", sequenceId, "Ended")
			delete activeTestSequences.value[sequenceId]
		})

		handleIpcMessage("actionQueue", "markTestActionStart", (event, sequenceId: string, id: string) => {
			console.log("Action", id, "Started")
			const testRun = activeTestSequences.value[sequenceId]
			if (!testRun) return //TODO: Handle out of order??
			testRun.activeIds[id] = Date.now()
		})

		handleIpcMessage("actionQueue", "markTestActionEnd", (event, sequenceId: string, id: string) => {
			console.log("Action", id, "Ended")
			const testRun = activeTestSequences.value[sequenceId]
			if (!testRun) return
			const time = Date.now()
			const startTime = testRun.activeIds[id]
			if (startTime == null) return

			const diff = time - startTime
			const delay = 300 - diff

			//Hold for at least 300ms so the border can show up

			if (delay > 0) {
				setTimeout(() => {
					delete testRun.activeIds[id]
				}, delay)
			} else {
				delete testRun.activeIds[id]
			}
		})
	}

	async function testSequence(sequence: Sequence, trigger?: { plugin?: string; trigger?: string }) {
		const id = nanoid()

		//TODO: Transform sequence for ipc??
		await runTestSequence(id, sequence, trigger)

		return id
	}

	async function stopTest(id: string) {
		stopTestSequence(id)
	}

	return { initialize, testSequence, stopTest, activeTestSequences: computed(() => activeTestSequences.value) }
})

export function useActiveTestSequence(sequenceId: MaybeRefOrGetter<string>) {
	const actionQueueStore = useActionQueueStore()

	return computed<TestSequenceData | undefined>(() => {
		return actionQueueStore.activeTestSequences[toValue(sequenceId)]
	})
}

export function useParentTestSequence() {
	return inject<ComputedRef<TestSequenceData | undefined>>(
		"activeTestSequence",
		computed(() => undefined)
	)
}

export function useActionTestTime(actionId: MaybeRefOrGetter<string>) {
	const testSeq = useParentTestSequence()

	return computed(() => testSeq.value?.activeIds?.[toValue(actionId)])
}
