export type HUELightArchetype =
	| "unknown_archetype"
	| "classic_bulb"
	| "sultan_bulb"
	| "flood_bulb"
	| "spot_bulb"
	| "candle_bulb"
	| "luster_bulb"
	| "pendant_round"
	| "pendant_long"
	| "ceiling_round"
	| "ceiling_square"
	| "floor_shade"
	| "floor_lantern"
	| "table_shade"
	| "recessed_ceiling"
	| "recessed_floor"
	| "single_spot"
	| "double_spot"
	| "table_wash"
	| "wall_lantern"
	| "wall_shade"
	| "flexible_lamp"
	| "ground_spot"
	| "wall_spot"
	| "plug"
	| "hue_go"
	| "hue_lightstrip"
	| "hue_iris"
	| "hue_bloom"
	| "bollard"
	| "wall_washer"
	| "hue_play"
	| "vintage_bulb"
	| "vintage_candle_bulb"
	| "ellipse_bulb"
	| "triangle_bulb"
	| "small_globe_bulb"
	| "large_globe_bulb"
	| "edison_bulb"
	| "christmas_tree"
	| "string_light"
	| "hue_centris"
	| "hue_lightstrip_tv"
	| "hue_lightstrip_pc"
	| "hue_tube"
	| "hue_signe"
	| "pendant_spot"
	| "ceiling_horizontal"
	| "ceiling_tube"

export interface HUEApiGradientPoint {
	xy?: {
		x: number
		y: number
	}
}

export type HUEApiGradientMode = "interpolated_palette" | "interpolated_palette_mirrored" | "random_pixelated"

export interface HUEApiLightUpdate {
	on?: { on: boolean }
	dimming?: {
		//0 to 100
		brightness: number
	}
	color?: {
		xy: {
			x: number
			y: number
		}
	}
	color_temperature?: {
		mirek: number
	}
	dynamics?: {
		//Milliseconds
		duration: number
	}
	gradient?: {
		points: HUEApiGradientPoint[]
		mode: HUEApiGradientMode
	}
}

export interface HUEApiLightState {
	on: {
		on: boolean
	}
	dimming?: {
		brightness: number
		min_dim_level?: number
	}
	color_temperature?: {
		mirek: number | null
		mirek_valid: boolean
		mirek_schema: {
			mirek_minimum: number
			mirek_maximum: number
		}
	}
	color?: {
		xy: {
			x: number
			y: number
		}
		gamut: {
			red: { x: number; y: number }
			green: { x: number; y: number }
			blue: { x: number; y: number }
		}
		gamut_type: "A" | "B" | "C" | "other"
	}
	dynamics?: {
		status: "none" | "dynamic_palette"
		status_values: any[]
		speed: number
		speed_valid: boolean
	}
	gradient?: {
		points: HUEApiGradientPoint[]
		mode: HUEApiGradientMode
		points_capable: number
		mode_values: HUEApiGradientMode[]
		pixel_count?: number
	}
}

export interface HUEApiLight extends HUEApiLightState {
	type: string
	id: string
	owner: {
		rid: string
		rtype: string
	}
	metadata: {
		name: string
		archetype: HUELightArchetype
		fixed_mired: number
	}

	alert?: {
		action_values: any[]
	}
	mode: "normal" | "streaming"
}
