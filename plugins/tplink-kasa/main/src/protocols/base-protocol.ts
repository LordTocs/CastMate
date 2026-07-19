export interface BaseKasaProtocol {
	query(request: any): Promise<any>
}
