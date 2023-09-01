import { defineStore } from "pinia"
import { useIpcCaller, useIpcMessage } from "../main"
import { Sequence } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { MaybeRefOrGetter, computed, ref, toValue, inject, ComputedRef } from "vue"

export interface TestSequenceData {
	running: boolean
	activeIds: Record<string, number> //Maps active ids to their start time
}

export const useActionQueueStore = defineStore("actionQueues", () => {
	const runTestSequence = useIpcCaller<(id: string, sequence: Sequence, context: any) => void>(
		"actionQueue",
		"runTestSequence"
	)

	const activeTestSequences = ref<Record<string, TestSequenceData>>({})

	async function initialize() {
		useIpcMessage("actionQueue", "markTestSequenceStart", (event, sequenceId: string) => {
			activeTestSequences.value[sequenceId] = { running: true, activeIds: {} }
		})

		useIpcMessage("actionQueue", "markTestSequenceEnd", (event, sequenceId: string) => {
			delete activeTestSequences.value[sequenceId]
		})

		useIpcMessage("actionQueue", "markTestActionStart", (event, sequenceId: string, id: string) => {
			const testRun = activeTestSequences.value[sequenceId]
			if (!testRun) return //TODO: Handle out of order??
			testRun.activeIds[id] = Date.now()
		})

		useIpcMessage("actionQueue", "markTestActionEnd", (event, sequenceId: string, id: string) => {
			const testRun = activeTestSequences.value[sequenceId]
			if (!testRun) return
			delete testRun.activeIds[id]
		})
	}

	async function testSequence(sequence: Sequence, context: any) {
		const id = nanoid()

		//TODO: Transform sequence for ipc??
		await runTestSequence(id, sequence, context)

		return id
	}

	return { initialize, testSequence, activeTestSequences: computed(() => activeTestSequences.value) }
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
