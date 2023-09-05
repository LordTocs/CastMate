export interface AccountConfig {
	name: string
	icon?: string
	scopes: string[]
}

export interface AccountState {
	authenticated: boolean
}

export interface AccountSecrets {}
