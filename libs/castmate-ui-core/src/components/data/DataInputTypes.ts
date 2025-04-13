export interface SharedDataInputProps {
	localPath?: string
	noFloat?: boolean
	context?: any
	secret?: boolean
	disabled?: boolean
}

export interface SharedDataViewProps {
	context?: any
	noLabel?: boolean
}

export function defaultStringIsTemplate(value: any | string) {
	if (typeof value != "string") return false
	return value.includes("{{")
}
