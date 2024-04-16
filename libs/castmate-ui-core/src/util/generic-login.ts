import { useDialog } from "primevue/usedialog"
import { handleIpcMessage, handleIpcRpc, useIpcCaller } from "./electron"
import GenericLoginDialog from "../components/dialogs/GenericLoginDialog.vue"

export function setupGenericLoginService() {
	const dialog = useDialog()

	const tryLogin = useIpcCaller<(id: string, username: string, password: string) => boolean>(
		"genericLogin",
		"tryLogin"
	)

	const loginClosed = useIpcCaller<(id: string) => any>("genericLogin", "loginClosed")

	handleIpcMessage("genericLogin", "startLogin", (event, id: string, title: string) => {
		dialog.open(GenericLoginDialog, {
			props: {
				header: title,
				style: {
					width: "25vw",
				},
				modal: true,
			},
			async onClose(options) {
				if (!options?.data) {
					loginClosed(id)
					return true
				}
				if (!options.data.username) return false
				if (!options.data.password) return false

				return await tryLogin(id, options.data.username, options.data.password)
			},
		})
	})
}
