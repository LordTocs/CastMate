import {
	EditorEventSpec,
	EditorFunctionSpec,
	MaybePromise,
	RawEditorEventSpec,
	RawEditorFunctionSpec,
	Schema,
	SchemaArgTypes,
	SchemaFunction,
	SchemaType,
} from "castmate-schema"
import { BrowserWindow, ipcMain } from "electron/main"
import { Service } from "../util/service"

interface EditorCommunicator {
	type: string
	id: string
	sendEvent(plugin: string, id: string, ...args: any[]): Promise<void>
}

interface IPCEditorCommunicator extends EditorCommunicator {
	type: "ElectronIPC"
}

function getIpcEditorCommunicator(window: BrowserWindow): IPCEditorCommunicator {
	return {
		id: `electron_${window.id}`,
		type: "ElectronIPC",
		async sendEvent(plugin, id, ...args) {
			try {
				window.webContents.send(`editorEvent`, plugin, id, ...args)
			} catch (err) {}
		},
	}
}

export const EditorService = Service(
	class {
		private editors = new Map<string, EditorCommunicator>()
		private functions = new Map<string, EditorFunctionImpl>()
		private rawFunctions = new Map<string, RawEditorFunctionImpl>()

		get allEditors() {
			//TODO: Enable the new range map()?
			return [...this.editors.values()]
		}

		registerEditor(editor: EditorCommunicator) {
			if (this.editors.has(editor.id)) {
				throw new Error(`${editor.id} Editor already exists`)
			}

			this.editors.set(editor.id, editor)
		}

		unregisterEditor(id: string) {
			this.editors.delete(id)
		}

		registerEditorFunc(func: EditorFunctionImpl) {
			const slug = `${func.spec.plugin}_${func.spec.id}`
			if (this.functions.has(slug)) {
				throw new Error(`${func.spec.plugin}'s ${func.spec.id} editor function already exists.`)
			}
			this.functions.set(slug, func)
		}

		unregisterEditorFunc(func: EditorFunctionImpl) {
			const slug = `${func.spec.plugin}_${func.spec.id}`
			this.functions.delete(slug)
		}

		registerRawEditorFunc(func: RawEditorFunctionImpl) {
			const slug = `${func.spec.plugin}_${func.spec.id}`
			if (this.functions.has(slug)) {
				throw new Error(`${func.spec.plugin}'s ${func.spec.id} editor function already exists.`)
			}
			this.rawFunctions.set(slug, func)
		}

		unregisterRawEditorFunc(func: RawEditorFunctionImpl) {
			const slug = `${func.spec.plugin}_${func.spec.id}`
			this.rawFunctions.delete(slug)
		}
	}
)

export type EditorFunction<TEditorFunc extends EditorFunctionSpec> = (
	editor: EditorCommunicator,
	...args: SchemaArgTypes<TEditorFunc["schema"]["args"]>
) => Promise<SchemaType<TEditorFunc["schema"]["returns"]>>

interface EditorFunctionImpl<TEditorFunc extends EditorFunctionSpec = EditorFunctionSpec> {
	spec: TEditorFunc
	handler: EditorFunction<TEditorFunc>
}

export function implementEditorFunction<TEditorFunc extends EditorFunctionSpec>(
	spec: TEditorFunc,
	handler: EditorFunction<TEditorFunc>
) {
	const func = {
		spec,
		handler,
	} as EditorFunctionImpl<TEditorFunc>

	//TODO: init handlers

	EditorService.getInstance().registerEditorFunc(func)
}

type EditorEventCallerFunc<TEditorEvent extends EditorEventSpec<Schema[]>> = (
	...args: SchemaArgTypes<TEditorEvent["schema"]>
) => Promise<void>

type EditorEventCaller<TEditorEvent extends EditorEventSpec<Schema[]>> = EditorEventCallerFunc<TEditorEvent> & {
	send(comm: EditorCommunicator, ...args: SchemaArgTypes<TEditorEvent["schema"]>): Promise<void>
}

interface RawEditorFunctionImpl<TFunc extends (...args: any[]) => any = (...args: any[]) => any> {
	spec: RawEditorEventSpec<TFunc>
	handler: (...args: Parameters<TFunc>) => MaybePromise<ReturnType<TFunc>>
}

export function implementRawEditorFunc<TFunc extends (...args: any[]) => any>(
	spec: RawEditorEventSpec<TFunc>,
	handler: (...args: Parameters<TFunc>) => MaybePromise<ReturnType<TFunc>>
) {
	const func = {
		spec,
		handler,
	} as RawEditorFunctionImpl

	//TODO: onLoad() and onUnload()????

	EditorService.getInstance().registerRawEditorFunc(func)
}

export function useEditorEvent<TEditorEvent extends EditorEventSpec<Schema[]>>(
	spec: TEditorEvent
): EditorEventCaller<TEditorEvent> {
	const result = async (...args: SchemaArgTypes<TEditorEvent["schema"]>) => {
		const promises = EditorService.getInstance().allEditors.map((comm) => {
			//TODO: Serialize args
			return comm.sendEvent(spec.plugin, spec.id, ...args)
		})

		await Promise.allSettled(promises)
	}

	result.send = async (comm: EditorCommunicator, ...args: SchemaArgTypes<TEditorEvent["schema"]>) => {
		await comm.sendEvent(spec.plugin, spec.id, ...args)
	}

	return result
}

export function useEditorRawEvent<TFunc extends (...args: any[]) => void>(spec: RawEditorEventSpec<TFunc>) {
	const result = async (...args: Parameters<TFunc>) => {
		const promises = EditorService.getInstance().allEditors.map((comm) => {
			//TODO: Serialize args
			return comm.sendEvent(spec.plugin, spec.id, ...args)
		})

		await Promise.allSettled(promises)
	}

	result.send = async (comm: EditorCommunicator, ...args: Parameters<TFunc>) => {
		await comm.sendEvent(spec.plugin, spec.id, ...args)
	}

	return result
}
