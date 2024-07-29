import {
	IPCSchema,
	Schema,
	constructDefault,
	filterPromiseAll,
	getTypeByConstructor,
	getTypeByName,
} from "castmate-schema"
import { Service } from "../util/service"
import sqlite from "sqlite3"
import { ensureDirectory, ensureYAML, loadYAML, resolveProjectPath } from "../io/file-system"
import { deserializeSchema, exposeSchema, serializeSchema } from "../util/ipc-schema"
import { usePluginLogger } from "../logging/logging"
import { ViewerVariable } from "castmate-schema"

interface SerializedViewerVariable {
	name: string
	type: string
	defaultValue?: any
}

const logger = usePluginLogger("viewer-data")

const sqlTypes: Record<string, string> = {
	String: "TEXT",
	Number: "REAL",
	Boolean: "INTEGER",
}

function escapeSql(sql: string) {
	return sql.replace(/\'/g, "''")
}

export interface ViewerProvider {
	readonly id: string
	onDataChanged(id: string, column: string, value: any): any
	onColumnAdded(column: string, defaultValue: any): any
	onColumnRemoved(column: string): any
}

export const ViewerData = Service(
	class {
		private db: sqlite.Database

		private _variables: ViewerVariable[] = []

		get variables() {
			return this._variables
		}

		private providers = new Map<string, ViewerProvider>()

		constructor() {}

		private createDb(): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				const path = resolveProjectPath("/viewer-data/db.sqlite3")
				this.db = new sqlite.Database(path, (err) => {
					if (err) {
						return reject(err)
					}
					resolve()
				})
			})
		}

		private run(sql: string, params?: any) {
			return new Promise<void>((resolve, reject) => {
				this.db.run(sql, params, (err) => {
					if (err) return reject(err)
					resolve()
				})
			})
		}

		private get<T>(sql: string, params?: any) {
			return new Promise<T>((resolve, reject) => {
				this.db.get(sql, params, (err, row) => {
					if (err) return reject(err)
					resolve(row as T)
				})
			})
		}

		private all<T>(sql: string, params?: any) {
			return new Promise<T[]>((resolve, reject) => {
				this.db.all(sql, params, (err, row) => {
					if (err) return reject(err)
					resolve(row as T[])
				})
			})
		}

		private ensureColumn(variable: ViewerVariable) {
			try {
				const schemaType = getTypeByConstructor(variable.schema.type)
				if (!schemaType) return

				const sqlType = sqlTypes[schemaType.name] ?? "BLOB"

				this.run("ALTER TABLE ViewerData ADD COLUMN ? ?", [variable.name, sqlType])
			} catch {}
		}

		private async loadVariables() {
			await ensureYAML([], "/viewer-data/variables.yaml")

			const data: SerializedViewerVariable[] = await loadYAML("/viewer-data/variables.yaml")

			for (const varData of data) {
				const type = getTypeByName(varData.type)

				if (!type) {
					logger.error("Missing Viewer Var Type", varData.type)
					continue
				}

				const schema: Schema = {
					type: type.constructor,
				}

				if (varData.defaultValue != null) {
					const defaultValue = await deserializeSchema(schema, varData.defaultValue)

					schema.default = defaultValue
				}

				this._variables.push({
					name: varData.name,
					schema,
				})
			}

			for (const vari of this.variables) {
				await this.ensureColumn(vari)
			}
		}

		getVariable(name: string) {
			return this.variables.find((v) => v.name == name)
		}

		async initialize() {
			await ensureDirectory(resolveProjectPath("/viewer-data"))

			await this.createDb()

			await this.run("CREATE TABLE IF NOT EXISTS ViewerData (twitch TEXT UNIQUE)")

			await this.loadVariables()
		}

		async registerProvider(provider: ViewerProvider) {
			//TODO: Ensure a column with the provider id exists and has a unique index

			this.providers.set(provider.id, provider)
		}

		shutdown() {
			return new Promise<void>((resolve, reject) => {
				this.db.close((err) => {
					if (err) return reject(err)
					resolve()
				})
			})
		}

		async addViewerVariable(name: string, schema: Schema) {
			const vari: ViewerVariable = {
				name,
				schema,
			}
			const defaultValue = await constructDefault(schema)

			await this.ensureColumn(vari)
			this.variables.push(vari)

			const exposedDefault = await exposeSchema(schema, defaultValue)

			for (const provider of this.providers.values()) {
				provider.onColumnAdded(name, exposedDefault)
			}
		}

		async removeViewerVariable(name: string) {
			const idx = this.variables.findIndex((v) => v.name == name)
			if (idx < 0) return

			await this.run("ALTER TABLE ViewerData DROP COLUMN ?", name)

			this.variables.splice(idx, 1)

			for (const provider of this.providers.values()) {
				provider.onColumnRemoved(name)
			}
		}

		async setViewerValue(provider: string, id: string, name: string, value: any) {
			const vari = this.getVariable(name)
			if (!vari) return

			const serialized = await serializeSchema(vari.schema, value)

			await this.run(`UPDATE ViewerData SET ? = ? WHERE ? = ?`, [name, serialized, provider, id])

			this.providers.get(provider)?.onDataChanged(id, name, value)
		}

		async getViewerData(provider: string, id: string) {
			try {
				const data = await this.get<Record<string, any>>("SELECT * FROM ViewerData WHERE ? = ?", [provider, id])

				const result: Record<string, any> = {}

				for (const vari of this.variables) {
					result[vari.name] = await deserializeSchema(vari.schema, data[vari.name])
				}

				return result
			} catch {
				return undefined
			}
		}

		async getMultipleViewerData(provider: string, ids: string[]) {
			try {
				const data = await this.all<Record<string, any>>("SELECT * FROM ViewerData WHERE ? = ?", [
					provider,
					ids,
				])

				const result: (Record<string, any> | undefined)[] = []

				await Promise.allSettled(
					data.map(async (row) => {
						const idx = ids.findIndex((id) => id == row[provider])
						if (idx < 0) return

						const viewerData: Record<string, any> = {}
						for (const vari of this.variables) {
							viewerData[vari.name] = await deserializeSchema(vari.schema, row[vari.name])
						}

						result[idx] = viewerData
					})
				)

				return result
			} catch {
				return []
			}
		}
	}
)
