import { Ref, WritableComputedRef, computed } from "vue"

//This bonkers function stacks a proxy on top of the normal vue reactive proxy
//The stacked proxy intercepts pushes, splices, and individual array value sets
//This way we can hook these when trying to manage arrays that are computed in the main process

export function settableArray<T>(config: {
	get(): T[]
	set(v: T[]): any
	setItem(index: number, v: T): any
	splice(index: number, deleteCount: number, ...items: T[]): any
	push(v: T): any
}): WritableComputedRef<T[]> {
	const innerComputed = computed<T[]>({
		get() {
			return config.get()
		},
		set(v) {
			return config.set(v)
		},
	})

	let stackedProxyTarget: T[]

	const createStackedProxy = () => {
		stackedProxyTarget = innerComputed.value
		return new Proxy<T[]>(innerComputed.value, {
			get(target, prop, receiver) {
				if (prop == "splice") {
					return config.splice
				}
				if (prop == "push") {
					return config.push
				}

				//Passthrough
				//console.log("Getting", prop, target)
				const passthrough = Reflect.get(target, prop, receiver)
				return passthrough
			},
			set(target, prop, newValue, receiver) {
				if (typeof prop == "number") {
					config.setItem(prop, newValue)
					return true
				}

				return Reflect.set(target, prop, newValue, receiver)
			},
		})
	}

	let stackedProxy = createStackedProxy()

	const getStackedProxy = (value: T[]) => {
		if (stackedProxyTarget === value) return stackedProxy
		stackedProxy = createStackedProxy()
		return stackedProxy
	}

	const symbols = Object.getOwnPropertySymbols(innerComputed)
	console.log(innerComputed, symbols)

	const result = {
		get value() {
			return getStackedProxy(innerComputed.value)
		},
		set value(v: T[]) {
			innerComputed.value = v
		},
		get effect() {
			return innerComputed.effect
		},
		get __v_isRef() {
			return true
		},
	}

	//@ts-ignore We're faking RefSymbol here, so tell the type system to ignore it
	return result
}
