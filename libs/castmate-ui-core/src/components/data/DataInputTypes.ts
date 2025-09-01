import { Schema } from "castmate-schema"
import util from "util"

export interface SharedDataInputProps {
	localPath?: string
	noFloat?: boolean
	context?: any
	secret?: boolean
	disabled?: boolean
}

export function hasDataLabel(props: { schema: Schema} & SharedDataInputProps) {
	return props.schema.name || props.localPath
}

export function getDataLabel(props: { schema: Schema} & SharedDataInputProps) {
	return props.schema.name ?? props.localPath
}

export interface SharedDataViewProps {
	context?: any
	noLabel?: boolean
}

export function defaultStringIsTemplate(value: any | string) {
	if (typeof value != "string") return false
	return value.includes("{{")
}
