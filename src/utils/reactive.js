

//https://medium.com/vue-mastery/the-best-explanation-of-javascript-reactivity-fea6112dd80d

class Dependency
{
	constructor()
	{
		this.subscribers = [];
	}

	addSubscriber(watcher)
	{
		if (this.subscribers.includes(watcher))
		{
			return;
		}

		this.subscribers.push(watcher);
		watcher.dependencies.push(this);
	}

	removeSubscriber(watcher)
	{
		let idx = this.subscribers.findIndex((w) => w == watcher);

		if (idx != -1)
		{
			this.subscribers.splice(idx, 1);
		}
	}

	notify()
	{
		for (let subscriber of this.subscribers)
		{
			subscriber.update();
		}
	}

	depend()
	{
		if (Dependency.target)
		{
			this.addSubscriber(Dependency.target)
		}
	}
}

Dependency.target = null;


class Watcher
{
	constructor(func)
	{
		this.func = func;
		this.dependencies = [];

		Dependency.target = this;
		this.func();
		Dependency.target = null;
	}

	update()
	{
		this.func();
	}

	unsubscribe()
	{
		for (let dep in this.dependencies)
		{
			dep.removeSubscriber(this);
		}

		this.dependencies = [];
	}
}

function createValue(obj, key)
{
	let observable = {
		dependency: new Dependency(),
		internalValue: obj[key],
	};

	if (!obj.__reactivity__)
	{
		Object.defineProperty(obj, "__reactivity__", {
			enumerable: false,
			writable: true,
			value: {}
		});
	}

	obj.__reactivity__[key] = observable;

	Object.defineProperty(obj, key, {
		get()
		{
			observable.dependency.depend();
			return observable.internalValue;
		},
		set(value)
		{
			observable.internalValue = value;
			observable.dependency.notify();
		}
	})
}

function reactify(obj)
{
	for (let key in obj)
	{
		createValue(obj, key);
	}
}

function reactiveCopy(target, obj)
{
	let sourceReactivity = obj.__reactivity__;
	for (let key in obj)
	{
		if (!obj.__reactivity__)
		{
			Object.defineProperty(obj, "__reactivity__", {
				enumerable: false,
				writable: true,
				value: {}
			});
		}

		obj.__reactivity__[key] = sourceReactivity[key];

		Object.defineProperty(target, key, {
			get()
			{
				sourceReactivity[key].dependency.depend();
				return sourceReactivity[key].internalValue;
			},
			set(value)
			{
				sourceReactivity[key].internalValue = value;
				sourceReactivity[key].dependency.notify();
			}
		})
	}
}

module.exports = { Watcher, reactify, reactiveCopy }

