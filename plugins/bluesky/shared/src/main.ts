import { AccountSecrets, AccountConfig } from "castmate-schema"

export interface BlueSkyAccountConfig extends AccountConfig {
	name: string
}

export interface BlueSkyAccountSecrets extends AccountSecrets {
	session?: {
		refreshJwt: string
		accessJwt: string
		handle: string
		did: string
		email?: string
		emailConfirmed?: boolean
		emailAuthFactor?: boolean
		active: boolean
		status?: string
	}
}
