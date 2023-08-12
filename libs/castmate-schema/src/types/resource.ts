export interface ResourceData<ConfigType extends any = any, StateType extends any = any> {
	readonly id: string
	readonly config: ConfigType
	state: StateType
}
