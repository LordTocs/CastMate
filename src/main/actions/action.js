


class ActionType 
{
	constructor(pluginObj, spec) {
		//spec.type = FireAndForget   //Instant no space on the timeline

        //spec.type = FixedTime      //Fixed amount of time on the timeline
        //spec.leftCrop / spec.rightCrop   // Croppable fixed amount of time on the timeline, (Think starting a sound from not the beginning)
        
        //spec.type = FlexTime // Configurable duration via stretching (Delay, Light Transition)
        
        
        this._executor = spec?.handler?.bind(pluginObj);
	}

    async execute(data, context, abortSignal) {
        return await this._executor?.(data,context,abortSignal)
    }
}
