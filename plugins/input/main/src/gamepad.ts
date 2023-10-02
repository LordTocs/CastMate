import { Resource, ResourceRegistry, ResourceStorage, onLoad } from "castmate-core"
import { GamepadConfig } from "castmate-plugin-input-shared"

export class GamepadResource extends Resource<GamepadConfig> {
	static storage = new ResourceStorage<GamepadResource>("Gamepad")
}

export function setupGamepad() {
	onLoad(() => {
		ResourceRegistry.getInstance().register(GamepadResource)
	})
}
