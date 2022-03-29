module.exports = {
	name: "time",
	uiName: "Time",
	icon: "mdi-clock-outline",
	color: "#826262",
	async init() {
		this.activeTimers = {};
	},
	async onProfileLoad(profile, config) {
		const timerTriggers = config ? (config.triggers ? (config.triggers.time ? (config.triggers.time.timers) : null) : null) : null;
		profile.timers = timerTriggers ? Object.keys(timerTriggers).map(k => this.parseTimeString(profile.name, k)) : [];
	},
	async onProfilesChanged(activeProfiles, inactiveProfiles) {

		const timerKeys = new Set();

		for (let profile of activeProfiles) {
			for (let timer of profile.timers) {
				const timerKey = timer.profile + "." + timer.key;
				timerKeys.add(timerKey)
				this.startTimer(timer);
			}
		}

		const activeTimerKeys = Object.keys(this.activeTimers)
		for (let timerKey of activeTimerKeys)
		{
			if (!timerKeys.has(timerKey))
			{
				//This key has dissapeared. Kill the timer.
				const timerStore = this.activeTimers[timerKey];
				if (!timerStore)
					return;
	
				if (timerStore.offset)
					clearTimeout(timerStore.offset);
				if (timerStore.interval)
					clearInterval(timerStore.interval);
	
				delete this.activeTimers[timerKey];
			}
		}
	},
	methods: {
		parseTimeString(name, str) {
			const [intervalStr, offsetStr] = str.split('+')
			return { profile: name, interval: Number(intervalStr), offset: Number(offsetStr), key: str };
		},
		startTimer(timer) {
			const timerKey = timer.profile + "." + timer.key;

			if (timerKey in this.activeTimers)
			{
				return;
			}

			const timerStore = {};

			const startInterval = () => {
				timerStore.interval = setInterval(() => this.triggers.timers({ timer: timer.key }), 1000 * timer.interval)
				timerStore.offset = null;
			}

			if (timer.offset == 0)
			{
				startInterval();
			}
			else
			{
				timerStore.offset = setTimeout(startInterval, timer.offset * 1000);
			}

			this.activeTimers[timerKey] = timerStore
		},
	},
	triggers: {
		timers: {
			name: "Timer",
			description: "Fires at a regular interval",
			type: "TimerTrigger",
			key: "timer",
			triggerUnit: "Interval"
		}
	}
}