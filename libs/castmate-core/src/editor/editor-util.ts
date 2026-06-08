import {
	EditorEventSpec,
	EditorFunctionSpec,
	MaybePromise,
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

const EditorService = Service(
	class {
		private editors = new Map<string, EditorCommunicator>()
		private functions = new Map<string, EditorFunctionSpec>()

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
		}

		unregisterEditorFunc(func: EditorFunctionImpl) {
			const slug = `${func.spec.plugin}_${func.spec.id}`
			this.functions.delete(slug)
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

export function useEditorEvent<TEditorEvent extends EditorEventSpec>(spec: TEditorEvent) {}
