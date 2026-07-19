import { AccountConfig, AccountSecrets } from "castmate-schema"

export interface KasaAccountConfig extends AccountConfig {
	email: string
}

export interface KasaAccountSecrets extends AccountSecrets {
	password: string
}
