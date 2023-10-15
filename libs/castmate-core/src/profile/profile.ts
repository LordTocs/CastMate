import { ProfileState, ProfileConfig, Sequence, TriggerData } from "castmate-schema"
import { Resource, ResourceStorage } from "../resources/resource"
import { FileResource } from "../resources/file-resource"
import { nanoid } from "nanoid/non-secure"
import { evalueBooleanExpression } from "../util/boolean-helpers"
import { ReactiveEffect, autoRerun } from "../reactivity/reactivity"
import { ProfileManager } from "./profile-system"

export interface SequenceProvider {
	getSequence(id: string): Sequence | undefined
}

export class Profile extends FileResource<ProfileConfig, ProfileState> implements SequenceProvider {
	static resourceDirectory: string = "./profiles"
	static storage = new ResourceStorage<Profile>("Profile")

	private stateEffect: ReactiveEffect | undefined

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			activationMode: "toggle",
			triggers: [],
			activationCondition: {
				operator: "or",
				operands: [],
			},
		}

		this.state = {
			active: false,
		}
	}

	async load(savedConfig: object): Promise<boolean> {
		const result = await super.load(savedConfig)
		await this.setupReactivity()
		return result
	}

	async setConfig(config: ProfileConfig): Promise<boolean> {
		const result = await super.setConfig(config)
		await this.setupReactivity()
		return result
	}

	async applyConfig(config: Partial<ProfileConfig>): Promise<boolean> {
		const result = await super.applyConfig(config)
		await this.setupReactivity()
		return result
	}

	static async onCreate(profile: Profile) {
		await super.onCreate(profile)
		await profile.setupReactivity()
		ProfileManager.getInstance().recomputeActiveProfiles()
	}

	static async onDelete(profile: Profile) {
		await super.onDelete(profile)
		profile.stopAutoActivate()
		ProfileManager.getInstance().recomputeActiveProfiles()
	}

	private stopAutoActivate() {
		if (this.stateEffect) {
			this.stateEffect.dispose()
			this.stateEffect = undefined
		}
	}

	private async setupReactivity() {
		this.stopAutoActivate()

		this.stateEffect = await autoRerun(() => {
			const currentActive = this.state.active
			if (this.config.activationMode == "toggle") {
				this.state.active = evalueBooleanExpression(this.config.activationCondition)
			} else {
				this.state.active = this.config.activationMode
			}
			ProfileManager.getInstance()?.recomputeActiveProfiles()
		})
	}

	getSequence(id: string): Sequence | undefined {
		const trigger = this.config.triggers.find((t) => t.id == id)
		if (trigger) {
			return trigger.sequence
		}

		return undefined
	}
}
