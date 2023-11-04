import { AccountConfig, AccountSecrets } from "castmate-schema"

export interface WyzeAccountSecrets extends AccountSecrets {
	accessToken?: string
	refreshToken?: string
}

export interface WyzeAccountConfig extends AccountConfig {
	email: string
}
