import { Resource, ResourceRegistry, ResourceStorage, definePluginResource, onLoad } from "castmate-core"
import { GamepadConfig } from "castmate-plugin-input-shared"

export class GamepadResource extends Resource<GamepadConfig> {
	static storage = new ResourceStorage<GamepadResource>("Gamepad")
}

export function setupGamepad() {
	definePluginResource(GamepadResource)
}
