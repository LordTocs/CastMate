import { KasaCredentials } from "../lan-api"

export type KasaAuthProvider = () => KasaCredentials

export interface BaseKasaTransport {
	readonly defaultPort: number

	getCredentialsHash(): string | undefined
	send(request: string): Promise<any>
	close(): Promise<void>
	reset(): Promise<void>
}
