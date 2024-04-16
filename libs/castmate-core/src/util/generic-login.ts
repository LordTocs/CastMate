import { DelayedResolver, MaybePromise, createDelayedResolver } from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "./electron"
import { Service } from "./service"
import { nanoid } from "nanoid/non-secure"

const startLogin = defineCallableIPC<(id: string, title: string) => any>("genericLogin", "startLogin")

type LoginTester = (username: string, password: string) => MaybePromise<boolean>

export const GenericLoginService = Service(
	class {
		private currentLoginResolver: DelayedResolver<boolean> | undefined = undefined
		private currentLoginId: string | undefined = undefined
		private currentLoginTester: LoginTester | undefined = undefined

		constructor() {
			defineIPCFunc("genericLogin", "tryLogin", async (id: string, username: string, password: string) => {
				if (this.currentLoginTester) {
					try {
						const result = await this.currentLoginTester(username, password)

						if (result) {
							this.currentLoginResolver?.resolve(false)
						}

						return result
					} catch (err) {
						return false
					}
				} else {
					return false
				}
			})

			defineIPCFunc("genericLogin", "loginClosed", async (id: string) => {
				this.currentLoginResolver?.resolve(false)
			})
		}

		openLogin(title: string, testLogin: LoginTester) {
			this.currentLoginResolver = createDelayedResolver()
			this.currentLoginId = nanoid()
			this.currentLoginTester = testLogin

			startLogin(this.currentLoginId, title)

			return this.currentLoginResolver.promise
		}
	}
)
