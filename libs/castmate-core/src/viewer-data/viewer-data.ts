import {
	IPCSchema,
	Schema,
	constructDefault,
	filterPromiseAll,
	getTypeByConstructor,
	getTypeByName,
} from "castmate-schema"
import { Service } from "../util/service"
import sqlite from "better-sqlite3"
import { ensureDirectory, ensureYAML, loadYAML, resolveProjectPath } from "../io/file-system"
import { deserializeSchema, exposeSchema, serializeSchema } from "../util/ipc-schema"
import { usePluginLogger } from "../logging/logging"
import { ViewerVariable } from "castmate-schema"

interface SerializedViewerVariableDesc {
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

function createAddColumnStatement(db: sqlite.Database) {
	return db.prepare<{
		columnName: string
		columnType: string
		columnDefault: any
	}>("ALTER TABLE ViewerData ADD COLUMN :columnName :columnType default :columnDefault")
}
type AddColumnStatement = ReturnType<typeof createAddColumnStatement>

function createCreateTableStatement(db: sqlite.Database) {
	return db.prepare<[]>("CREATE TABLE IF NOT EXISTS ViewerData (twitch TEXT UNIQUE, twitch_name TEXT)")
}
type CreateTableStatement = ReturnType<typeof createCreateTableStatement>

function createRemoveColumnStatement(db: sqlite.Database) {
	return db.prepare<{ columnName: string }>("ALTER TABLE ViewerData DROP COLUMN ?")
}
type RemoveTableStatement = ReturnType<typeof createRemoveColumnStatement>

function createSetColumnValueStatement(db: sqlite.Database) {
	return db.prepare<{
		provider: string
		providerName: string
		columnName: string
		id: string
		displayName: string
		columnValue: any
	}>(
		`INSERT INTO ViewerData(:provider, :providerName, :columnName) VALUES(:id, :displayName, :columnValue) ON CONFLICT(:provider) DO UPDATE SET :columnName=:columnValue, :providerName=:displayName`
	)
}
type SetColumnValueStatement = ReturnType<typeof createSetColumnValueStatement>

function createGetColumnValueStatement(db: sqlite.Database) {
	return db.prepare<
		{
			provider: string
			ids: string | string[]
		},
		Record<string, any>
	>("SELECT * FROM ViewerData WHERE :provider = :ids")
}

type GetColumnValueStatement = ReturnType<typeof createGetColumnValueStatement>

export const ViewerData = Service(
	class {
		private db: sqlite.Database

		private addColumnStatement: AddColumnStatement
		private createTableStatement: CreateTableStatement
		private removeTableStatement: RemoveTableStatement
		private setColumnValueStatement: SetColumnValueStatement
		private getColumnValueStatement: GetColumnValueStatement

		private _variables: ViewerVariable[] = []

		get variables() {
			return this._variables
		}

		private providers = new Map<string, ViewerProvider>()

		constructor() {}

		private createDb(): Promise<void> {
			return new Promise<void>((resolve, reject) => {
				const path = resolveProjectPath("/viewer-data/db.sqlite3")
				this.db = sqlite(path)
				resolve()
			})
		}

		private async ensureColumn(variable: ViewerVariable) {
			try {
				const schemaType = getTypeByConstructor(variable.schema.type)
				if (!schemaType) return

				const sqlType = sqlTypes[schemaType.name] ?? "BLOB"

				const defaultValue = await constructDefault(variable.schema)
				const serializedDefault = await serializeSchema(variable.schema, defaultValue)

				this.addColumnStatement.run({
					columnName: variable.name,
					columnType: sqlType,
					columnDefault: serializedDefault,
				})
			} catch {}
		}

		private async loadVariables() {
			await ensureYAML([], "/viewer-data/variables.yaml")

			const data: SerializedViewerVariableDesc[] = await loadYAML("/viewer-data/variables.yaml")

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

			this.addColumnStatement = createAddColumnStatement(this.db)
			this.removeTableStatement = createRemoveColumnStatement(this.db)
			this.createTableStatement = createCreateTableStatement(this.db)

			await this.createTableStatement.run()

			await this.loadVariables()
		}

		async registerProvider(provider: ViewerProvider) {
			//TODO: Ensure a column with the provider id exists and has a unique index

			this.providers.set(provider.id, provider)
		}

		async shutdown() {
			this.db.close()
		}

		async addViewerVariable(name: string, schema: Schema) {
			const vari: ViewerVariable = {
				name,
				schema,
			}

			const existing = this.getVariable(name)
			if (existing) throw new Error(`Viewer Variable with name ${name} already exists`)

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

			await this.removeTableStatement.run({ columnName: name })

			this.variables.splice(idx, 1)

			for (const provider of this.providers.values()) {
				provider.onColumnRemoved(name)
			}
		}

		async setViewerValue(provider: string, id: string, displayName: string, varname: string, value: any) {
			const vari = this.getVariable(varname)
			if (!vari) return

			const serialized = await serializeSchema(vari.schema, value)

			this.db.transaction(() => {})
			await this.setColumnValueStatement.run({
				provider,
				providerName: `${provider}_name`,
				columnName: varname,
				columnValue: serialized,
				id,
				displayName,
			})

			this.providers.get(provider)?.onDataChanged(id, varname, value)
		}

		private async getDefaultViewerData() {
			let result: Record<string, any> = {}

			for (const vari of this.variables) {
				const value = await constructDefault(vari.schema)
				const exposed = await exposeSchema(vari.schema, value)
				result[vari.name] = exposed
			}

			return result
		}

		async getViewerData(provider: string, id: string) {
			try {
				const data = await this.getColumnValueStatement.get({ provider, ids: id })

				if (!data) return undefined

				const result: Record<string, any> = {}

				for (const vari of this.variables) {
					const deserialized = await deserializeSchema(vari.schema, data[vari.name])
					const exposed = await exposeSchema(vari.schema, deserialized)
					result[vari.name] = exposed
				}

				return result
			} catch {
				return undefined
			}
		}

		async getMultipleViewerData(provider: string, ids: string[]) {
			try {
				const data = await this.getColumnValueStatement.all({ provider, ids })

				const result: (Record<string, any> | undefined)[] = []

				await Promise.allSettled(
					data.map(async (row) => {
						const idx = ids.findIndex((id) => id == row[provider])
						if (idx < 0) return

						const viewerData: Record<string, any> = {}
						for (const vari of this.variables) {
							const deserialized = await deserializeSchema(vari.schema, row[vari.name])
							const exposed = await exposeSchema(vari.schema, deserialized)
							viewerData[vari.name] = exposed
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
