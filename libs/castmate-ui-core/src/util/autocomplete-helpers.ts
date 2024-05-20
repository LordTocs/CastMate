import { MaybeRefOrGetter, computed, toValue } from "vue"
import { getByPath } from "castmate-schema"

export interface ItemType {
	id: any
	[key: string]: any
}

export interface AutocompleteItemProps {
	textProp?: string
	groupProp?: string
}

export function getItemText(item: ItemType, props: AutocompleteItemProps): string {
	return getByPath(item, props.textProp ?? "id")
}

export function groupItems(items: ItemType[], props: AutocompleteItemProps): ItemType[][] {
	if (!props.groupProp) return [items]

	const groups = new Map<any, ItemType[]>()

	for (const item of items) {
		const groupKey = getByPath(item, props.groupProp)
		let group = groups.get(groupKey)
		if (!group) {
			group = []
			groups.set(groupKey, group)
		}
		group.push(item)
	}

	return [...groups.values()]
}

export function useGroupedFilteredItems(
	filter: MaybeRefOrGetter<string | undefined | null>,
	items: MaybeRefOrGetter<ItemType[]>,
	props: MaybeRefOrGetter<AutocompleteItemProps>
) {
	const result = computed<ItemType[][]>(() => {
		const itemArr = toValue(items)
		const filterValue = toValue(filter)
		const autocompleteProps = toValue(props)

		let filteredItems = itemArr

		if (filterValue) {
			const filterLower = filterValue.toLowerCase()
			filteredItems = itemArr.filter((item) => {
				return getItemText(item, autocompleteProps).toLocaleLowerCase().includes(filterLower)
			})
		}

		return groupItems(filteredItems, autocompleteProps)
	})

	return result
}

export function findItem(items: ItemType[][], id: string | undefined) {
	if (!id) return undefined

	for (let groupIndex = 0; groupIndex < items.length; ++groupIndex) {
		const itemIndex = items[groupIndex].findIndex((i) => i.id == id)
		if (itemIndex > 0) {
			return items[groupIndex][itemIndex]
		}
	}
	return undefined
}

export function getNextItem(items: ItemType[][], id: string | undefined) {
	if (!id) {
		return items[0]?.[0]?.id
	}

	for (let groupIndex = 0; groupIndex < items.length; ++groupIndex) {
		const itemIndex = items[groupIndex].findIndex((i) => i.id == id)
		if (itemIndex >= 0) {
			const nextIndex = itemIndex + 1
			const nextItem = items[groupIndex][nextIndex]
			if (nextItem) {
				return nextItem.id
			} else {
				return items[groupIndex + 1][0]?.id ?? id
			}
		}
	}
	return items[0]?.[0]?.id
}

export function getPrevItem(items: ItemType[][], id: string | undefined) {
	if (!id) {
		return items[0]?.[0]?.id
	}

	for (let groupIndex = 0; groupIndex < items.length; ++groupIndex) {
		const itemIndex = items[groupIndex].findIndex((i) => i.id == id)
		if (itemIndex >= 0) {
			const prevIndex = itemIndex - 1
			const prevItem = items[groupIndex][prevIndex]
			if (prevItem) {
				return prevItem.id
			} else {
				const prevGroup = items[groupIndex - 1]
				if (!prevGroup) return id
				return prevGroup[prevGroup.length - 1]?.id ?? id
			}
		}
	}
	return items[0]?.[0]?.id
}
