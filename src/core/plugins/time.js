module.exports = {
	name: "time",
	uiName: "Time",
	icon: "mdi-clock-outline",
	color: "#826262",
	async init() {
		this.activeTimers = [];
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles) {

		const inUseTimers = [];

		for (let profile of activeProfiles) {
			const timerTriggers = profile.triggers.time ? profile.triggers.time.timer : null;

			if (!timerTriggers)
				continue;

			for (let timer of timerTriggers) {

				if (!timer.config)
					continue;

				const timerObj = {
					profile: profile.name,
					interval: this.parseTimeStr(timer.config.interval),
					delay: this.parseTimeStr(timer.config.delay),
				}

				inUseTimers.push(timerObj);

				this.startTimer(timerObj);
			}
		}

		for (let i = 0; i < this.activeTimers.length; ++i) {
			const timerObj = this.activeTimers[i];

			const inUseTimer = inUseTimers.find(at => (at.profile == timerObj.profile
				&& at.interval == timerObj.interval
				&& at.delay == timerObj.delay
			));

			if (!inUseTimer) {
				//This key has dissapeared. Kill the timer.
				if (!timerObj)
					return;

				if (timerObj.intervalObj)
					clearTimeout(timerObj.intervalObj);
				if (timerObj.timeoutObj)
					clearInterval(timerObj.timeoutObj);

				this.activeTimers.splice(i, 1);
				--i;
			}
		}
	},
	methods: {
		parseTimeStr(str) {
			let [hours, minutes, seconds] = str.split(":");
			if (seconds == undefined) {
				seconds = minutes;
				minutes = hours;
				hours = 0;
			}
			if (seconds == undefined) {
				seconds = minutes;
				minutes = 0;
			}
			return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
		},
		startTimer(timerObj) {

			const existingTimer = this.activeTimers.find(at => (at.profile == timerObj.profile
				&& at.interval == timerObj.interval
				&& at.delay == timerObj.delay
			));

			if (existingTimer)
				return;

			const startInterval = () => {
				let msInterval = 1000 * timerObj.interval;

				if (msInterval < 100) //Don't process run anything faster than 10 times a second.
					msInterval = 100;

				timerObj.intervalObj = setInterval(() => {
					this.triggers.timer({ delay: timerObj.delay, interval: timerObj.interval }, timerObj.profile);
				}, msInterval)

				timerObj.timeoutObj = null;
			}

			if (timerObj.delay == 0) {
				startInterval();
			}
			else {
				timerObj.timeoutObj = setTimeout(startInterval, timerObj.delay * 1000);
			}

			this.activeTimers.push(timerObj);
		},

	},
	triggers: {
		timer: {
			name: "Timer",
			description: "Fires at a regular interval",
			config: {
				type: Object,
				properties: {
					delay: { type: "Duration", name: "Delay" },
					interval: { type: "Duration", name: "Interval" },
				}
			},
			context: {
				delay: { type: "Duration", name: "Delay" },
				interval: { type: "Duration", name: "Interval" }
			},
			handler(config, context, mapping, profileName) {
				return this.parseTimeStr(config.delay) == context.delay && this.parseTimeStr(config.interval) == context.interval && mapping.profile == profileName;
			}
		}
	}
}