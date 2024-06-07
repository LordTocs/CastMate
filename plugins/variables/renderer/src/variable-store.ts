import { MaybeRefOrGetter, computed, ref, toValue } from "vue"
import { IPCVariableDefinition } from "castmate-plugin-variables-shared"
import { handleIpcMessage, ipcParseSchema, useIpcCaller, useState } from "castmate-ui-core"
import { defineStore } from "pinia"
import { Schema, getTypeByConstructor, getTypeByName } from "castmate-schema"

export interface RendererVariableDefinition<T = any> {
	id: string
	schema: Schema
	serialized: boolean
	defaultValue: T
}

function parseDefinition(def: IPCVariableDefinition): RendererVariableDefinition {
	const type = getTypeByName(def.type)
	if (!type) throw new Error("Missing Type!")

	//@ts-ignore TODO: How to get the compiler to agree with this?
	const schema: Schema = {
		type: type.constructor,
		required: true,
	}

	const defaultValue = def.defaultValue //PARSE???
	return {
		id: def.id,
		schema,
		serialized: def.serialized,
		defaultValue,
	}
}

function defToIPC(def: RendererVariableDefinition): IPCVariableDefinition {
	const type = getTypeByConstructor(def.schema.type)
	if (!type) throw new Error("Missing Type!")

	return {
		id: def.id,
		type: type.name,
		defaultValue: def.defaultValue,
		serialized: def.serialized,
	}
}

export const useVariableStore = defineStore("variables", () => {
	const variables = ref(new Map<string, RendererVariableDefinition>())

	const getVariables = useIpcCaller<() => IPCVariableDefinition[]>("variables", "getVariables")

	async function initialize() {
		const ipcVariables = await getVariables()
		//TODO: Handle error here?
		const initVars = ipcVariables.map((v) => parseDefinition(v))
		for (const v of initVars) {
			variables.value.set(v.id, v)
		}

		handleIpcMessage("variables", "setVariable", (event, ipcDef: IPCVariableDefinition) => {
			const def = parseDefinition(ipcDef)
			console.log("Setting", def.id, def)
			variables.value.set(def.id, def)
		})

		handleIpcMessage("variables", "deleteVariable", (event, id) => {
			console.log("Deleting", id)
			variables.value.delete(id)
		})
	}

	const deleteVariable = useIpcCaller<(id: string) => any>("variables", "deleteVariable")

	const setVariableValueIPC = useIpcCaller<(id: string, value: any) => any>("variables", "setVariableValue")
	async function setVariableValue(id: string, value: any) {
		const def = variables.value.get(id)
		if (!def) return

		//TODO: Serialize?

		await setVariableValueIPC(id, value)
	}

	const setVarDefIPC = useIpcCaller<(originalId: string, ipcDef: IPCVariableDefinition) => any>(
		"variables",
		"setVariableDefinition"
	)
	async function setVariableDefinition(originalId: string, def: RendererVariableDefinition) {
		await setVarDefIPC(originalId, defToIPC(def))
	}

	const addVariableDefIPC = useIpcCaller<(ipcDef: IPCVariableDefinition) => any>("variables", "addVariableDefinition")
	async function addVariableDefinition(def: RendererVariableDefinition) {
		await addVariableDefIPC(defToIPC(def))
	}

	const renameVariable = useIpcCaller<(id: string, newId: string) => any>("variables", "renameVariable")

	return {
		variables: computed(() => variables.value),
		initialize,
		deleteVariable,
		setVariableValue,
		setVariableDefinition,
		addVariableDefinition,
		renameVariable,
	}
})

export function useVariableList() {
	const variableStore = useVariableStore()

	return computed(() => [...variableStore.variables.values()])
}

export function useVariableDef(id: MaybeRefOrGetter<string>) {
	const variableStore = useVariableStore()

	return computed(() => variableStore.variables.get(toValue(id)))
}

export function useVariableValue<T = any>(id: MaybeRefOrGetter<string>) {
	const state = useState(() => ({
		plugin: "variables",
		state: toValue(id),
	}))

	return computed<T | undefined>(() => state.value?.value as T | undefined)
}
