import { TwitchCategory, TwitchCategoryUnresolved, TwitchViewer } from "castmate-plugin-twitch-shared"
import { Service, defineRendererCallable, onLoad, registerSchemaExpose, registerSchemaUnexpose } from "castmate-core"
import { TwitchAccount } from "./twitch-auth"
import fuzzysort from "fuzzysort"

export function setupCategoryCache() {
	onLoad(() => {
		CategoryCache.initialize()
	})

	defineRendererCallable("searchCategories", async (query: string) => {
		return await CategoryCache.getInstance().searchCategories(query)
	})

	defineRendererCallable("getCategoryById", async (id: string) => {
		return await CategoryCache.getInstance().getCategoryById(id)
	})
}

registerSchemaExpose(TwitchCategory, async (value: TwitchCategoryUnresolved) => {
	return CategoryCache.getInstance().getCategoryById(value)
})

registerSchemaUnexpose(TwitchCategory, async (value: TwitchCategory) => {
	return value.id
})

export const CategoryCache = Service(
	class {
		private categoryCache = new Map<string, TwitchCategory>()

		private cacheCategory(category: TwitchCategory) {
			if (this.categoryCache.has(category.id)) return
			this.categoryCache.set(category.id, category)
		}

		async searchCategories(query: string, max: number = 10) {
			try {
				const result = await TwitchAccount.channel.apiClient.search.searchCategories(query)

				const categories = result.data.map(
					(g): TwitchCategory => ({
						id: g.id,
						name: g.name,
						image: g.boxArtUrl,
						[Symbol.toPrimitive]() {
							this.name
						},
					})
				)

				for (const c of categories) {
					this.cacheCategory(c)
				}

				const fuzzySearch = fuzzysort.go(query, categories, { key: "name" })
				const finalResult = fuzzySearch.map((r) => r.obj)

				return finalResult
			} catch (err) {
				return []
			}
		}

		async getCategoryById(id: string) {
			const cached = this.categoryCache.get(id)

			if (cached) return cached

			const game = await TwitchAccount.channel.apiClient.games.getGameById(id)

			if (game) {
				const data: TwitchCategory = {
					id: game.id,
					name: game.name,
					image: game.boxArtUrl,
					[Symbol.toPrimitive]() {
						this.name
					},
				}
				this.cacheCategory(data)
				return data
			}

			return undefined
		}
	}
)
