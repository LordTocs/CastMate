export interface OBSFFmpegSourceSettings {
	is_local_file: boolean
	local_file: string
	restart_on_activate: boolean
	looping: boolean
	buffering_mb: number

	input: string
	input_format: string

	reconnect_delay_sec: number
	hw_decode: boolean
	clear_on_media_end: boolean
	close_when_inactive: boolean
	speed_percent: number
	color_range: number
	linear_alpha: boolean
	seekable: boolean
}
