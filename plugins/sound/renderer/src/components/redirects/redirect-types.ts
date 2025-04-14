export interface AudioRedirectView {
	id: string
}

export interface AudioRedirectorView {
	scrollX: number
	scrollY: number
	redirects: AudioRedirectView[]
}
