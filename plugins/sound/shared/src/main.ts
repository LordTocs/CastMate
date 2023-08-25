export interface SoundOutputConfig {
	name: string
}

export interface WebAudioDeviceInfo {
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/deviceId) */
	readonly deviceId: string
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/groupId) */
	readonly groupId: string
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind) */
	readonly kind: MediaDeviceKind
	/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/label) */
	readonly label: string
}
