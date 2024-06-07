interface ResourceConfigData extends Record<string | number | symbol, any> {
	name?: string
}

export interface ResourceData<ConfigType extends ResourceConfigData = ResourceConfigData, StateType extends any = any> {
	readonly id: string
	readonly config: ConfigType
	state: StateType
}
