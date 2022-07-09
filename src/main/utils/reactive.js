//https://medium.com/vue-mastery/the-best-explanation-of-javascript-reactivity-fea6112dd80d

class Dependency {
	constructor() {
		this.subscribers = [];
	}

	addSubscriber(watcher) {
		if (this.subscribers.includes(watcher)) {
			return;
		}

		this.subscribers.push(watcher);
		watcher.dependencies.push(this);
	}

	removeSubscriber(watcher) {
		let idx = this.subscribers.findIndex((w) => w == watcher);

		if (idx != -1) {
			this.subscribers.splice(idx, 1);
		}
	}

	notify() {
		for (let subscriber of this.subscribers) {
			subscriber.update();
		}
	}

	depend() {
		if (Dependency.target) {
			this.addSubscriber(Dependency.target)
		}
	}
}

Dependency.target = null;


export class Watcher {
	constructor(func, { fireImmediately = true }) {
		this.func = func;
		this.dependencies = [];

		if (fireImmediately) {
			//Todo: Solve async eval race condition with async_hooks package.
			Dependency.target = this;
			this.func();
			Dependency.target = null;
		}
	}

	update() {
		this.func();
	}

	unsubscribe() {
		for (let dep of this.dependencies) {
			dep.removeSubscriber(this);
		}

		this.dependencies = [];
	}
}

export function createReactiveProperty(obj, key) {
	let observable = {
		dependency: new Dependency(),
		internalValue: obj[key],
	};

	if (!obj.__reactivity__) {
		Object.defineProperty(obj, "__reactivity__", {
			enumerable: false,
			writable: true,
			value: {}
		});
	}

	obj.__reactivity__[key] = observable;

	Object.defineProperty(obj, key, {
		get() {
			observable.dependency.depend();
			return observable.internalValue;
		},
		set(value) {
			if (observable.internalValue !== value) {
				observable.internalValue = value;
				observable.dependency.notify();
			}
		},
		configurable: true
	})
}

export function deleteReactiveProperty(obj, key) {
	if (!obj.__reactivity__)
		return;

	delete obj.__reactivity__[key];
	delete obj[key];
}

export function reactify(obj) {
	for (let key in obj) {
		createReactiveProperty(obj, key);
	}
}

export function reactiveCopy(target, obj, onNewKey = null) {
	let sourceReactivity = obj.__reactivity__;

	for (let key in obj) {
		if (!target.__reactivity__) {
			Object.defineProperty(target, "__reactivity__", {
				enumerable: false,
				writable: true,
				value: {}
			});
		}

		if (key in target)
			continue;

		target.__reactivity__[key] = sourceReactivity[key];

		Object.defineProperty(target, key, {
			enumerable: true,
			get: () => {
				sourceReactivity[key].dependency.depend();
				return sourceReactivity[key].internalValue;
			},
			set: (value) => {
				if (sourceReactivity[key].internalValue !== value) {
					sourceReactivity[key].internalValue = value;
					sourceReactivity[key].dependency.notify();
				}
			},
			configurable: true
		})

		if (onNewKey) {
			onNewKey(key);
		}
	}
}

