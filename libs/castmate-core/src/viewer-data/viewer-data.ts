import { IPCSchema, Schema, getTypeByConstructor, getTypeByName } from "castmate-schema"
import { Service } from "../util/service"
import sqlite from "sqlite3"
import { ensureDirectory, ensureYAML, loadYAML, resolveProjectPath } from "../io/file-system"
import { deserializeSchema, serializeSchema } from "../util/ipc-schema"
import { usePluginLogger } from "../logging/logging"

interface ViewerVariable {
	name: string
	schema: Schema
}

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

export const ViewerData = Service(
	class {
		private db: sqlite.Database

		private variables: ViewerVariable[] = []

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

		private ensureColumn(variable: ViewerVariable) {
			try {
				const schemaType = getTypeByConstructor(variable.schema.type)
				if (!schemaType) return

				const sqlType = sqlTypes[schemaType.name] ?? "BLOB"

				this.run(`ALTER TABLE ViewerData ADD COLUMN ${variable.name} ${sqlType}`)
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

				this.variables.push({
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

			await this.run("create table if not exists ViewerData (id text PRIMARY KEY)")

			await this.loadVariables()
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
			await this.ensureColumn(vari)
			this.variables.push(vari)
		}

		async removeViewerVariable(name: string) {
			const idx = this.variables.findIndex((v) => v.name == name)
			if (idx < 0) return

			await this.run("ALTER TABLE ViewerData DROP COLUMN ?", name)

			this.variables.splice(idx, 1)
		}

		async setViewerValue(provider: string, id: string, name: string, value: any) {
			const dbId = `${provider}.${id}`

			const vari = this.getVariable(name)
			if (!vari) return

			const serialized = await serializeSchema(vari.schema, value)

			await this.run(`UPDATE ViewerData SET ? = ? WHERE id = ?`, [name, serialized, dbId])
		}

		async getViewerData(provider: string, id: string) {
			const dbId = `${provider}.${id}`

			try {
				const data = await this.get<Record<string, any>>("SELECT * FROM ViewerData WHERE id = ?", [dbId])

				const result: Record<string, any> = {}

				for (const vari of this.variables) {
					result[vari.name] = await deserializeSchema(vari.schema, data[vari.name])
				}

				return result
			} catch {
				return undefined
			}
		}
	}
)
