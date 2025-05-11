import { RetryTimer, definePluginResource, defineResourceSetting, usePluginLogger } from "castmate-core"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	FileResource,
	ResourceStorage,
} from "castmate-core"

import jzz, { MIDI } from "jzz"

export default definePlugin(
	{
		id: "midi",
		name: "MIDI",
		description: "Send and receive MIDI",
		icon: "mdi mdi-midi",
		color: "#66A87B",
	},
	() => {
		const logger = usePluginLogger()

		onLoad(async () => {
			await jzz.requestMIDIAccess()

			const j = await jzz().or("Cannot start MIDI Engine")

			j.onChange(async (info: any) => {
				logger.log("CHANGE", info)
			})

			await j.refresh()

			logger.log(j.info())

			const midiOut = await j
				.openMidiOut()
				.or("Cannot open MIDI Out port!")
				.wait(500)
				.send([0x90, 60, 127])
				.wait(500)
				.send([0x90, 64, 127])
				.wait(500)
				.send([0x90, 67, 127])
				.wait(500)
				.send([0x90, 72, 127])
				.wait(1000)
				.send([0x90, 60, 0])
				.send([0x90, 64, 0])
				.send([0x90, 67, 0])
				.send([0x90, 72, 0])
				.and("thank you!")

			logger.log("Out", midiOut.info())

			const midiIn = await j.openMidiIn().or("Can't open input!")

			logger.log("In", midiIn.info())

			midiIn.connect((midi: typeof MIDI) => {
				logger.log("MIDI", midi.toString())
			})
		})
	}
)
