import {
	IPCSchema,
	IPCViewerVariable,
	Schema,
	constructDefault,
	filterPromiseAll,
	getTypeByConstructor,
	getTypeByName,
} from "castmate-schema"
import { Service } from "../util/service"
import sqlite from "better-sqlite3"
import { ensureDirectory, ensureYAML, loadYAML, resolveProjectPath, writeYAML } from "../io/file-system"
import { deserializeSchema, exposeSchema, ipcConvertSchema, ipcParseSchema, serializeSchema } from "../util/ipc-schema"
import { usePluginLogger } from "../logging/logging"
import { ViewerVariable } from "castmate-schema"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { startPerfTime } from "../util/time-utils"

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
	return function (args: { columnName: string; columnType: string; columnDefault: any }) {
		db.exec(`ALTER TABLE ViewerData ADD COLUMN ${args.columnName} ${args.columnType} default ${args.columnDefault}`)
	}
	/*
	return db.prepare<{
		columnName: string
		columnType: string
		columnDefault: any
	}>("ALTER TABLE ViewerData ADD COLUMN @columnName @columnType default @columnDefault")
*/
}
type AddColumnStatement = ReturnType<typeof createAddColumnStatement>

function createCreateTableStatement(db: sqlite.Database) {
	return db.prepare<[]>("CREATE TABLE IF NOT EXISTS ViewerData (twitch TEXT UNIQUE, twitch_name TEXT)")
}
type CreateTableStatement = ReturnType<typeof createCreateTableStatement>

function createRemoveColumnStatement(db: sqlite.Database) {
	return function (args: { columnName: string }) {
		db.exec(`ALTER TABLE ViewerData DROP COLUMN ${args.columnName}`)
	}

	//return db.prepare<{ columnName: string }>("ALTER TABLE ViewerData DROP COLUMN :columnName")
}
type RemoveTableStatement = ReturnType<typeof createRemoveColumnStatement>

function createPagedQueryStatement(db: sqlite.Database) {
	return db.prepare<{ start: number; quantity: number }>("SELECT * FROM ViewerData LIMIT :quantity OFFSET :start")
}
type PagedQueryStatement = ReturnType<typeof createPagedQueryStatement>

function createPagedQueryOrderedStatement(db: sqlite.Database) {
	return function (args: { start: number; quantity: number; orderBy: string; order: string }) {
		const statement = db.prepare(
			`SELECT * FROM ViewerData ORDER BY ${args.orderBy} ${args.order} LIMIT ${args.quantity} OFFSET ${args.start}`
		)
		return statement.all()
	}
}
type PagedQueryOrderedStatement = ReturnType<typeof createPagedQueryOrderedStatement>

function createSetColumnValueStatement(db: sqlite.Database) {
	return function (args: {
		provider: string
		columnName: string
		id: string
		displayName: string
		columnValue: any
	}) {
		const query = `INSERT INTO ViewerData (${args.provider}, ${args.provider}_name, ${args.columnName}) VALUES('${
			args.id
		}', '${escapeSql(args.displayName)}', ${args.columnValue}) ON CONFLICT(${args.provider}) DO UPDATE SET ${
			args.columnName
		}=${args.columnValue}, ${args.provider}_name='${escapeSql(args.displayName)}'`

		logger.log("  ", query)

		const statement = db.prepare(query)

		const result = statement.all()

		logger.log("  ", result)
	}
	/*
	return db.prepare<{
		provider: string
		providerName: string
		columnName: string
		id: string
		displayName: string
		columnValue: any
	}>(
		`INSERT INTO ViewerData(:provider, :providerName, :columnName) VALUES(:id, :displayName, :columnValue) ON CONFLICT(:provider) DO UPDATE SET :columnName=:columnValue, :providerName=:displayName`
	)*/
}
type SetColumnValueStatement = ReturnType<typeof createSetColumnValueStatement>

function createUpdateColumnValue(db: sqlite.Database) {
	return function (args: { provider: string; id: string; columnName: string; columnValue: any }) {
		const query = `UPDATE ViewerData SET ${args.columnName}=${args.columnValue} WHERE ${args.provider}='${args.id}'`

		logger.log("Updating w/", query)

		db.exec(query)
	}
}
type UpdateColumnValue = ReturnType<typeof createUpdateColumnValue>

function createInsertWithColumnValue(db: sqlite.Database) {
	return function (args: {
		provider: string
		columnName: string
		id: string
		displayName: string
		columnValue: any
	}) {
		const query = `INSERT INTO ViewerData (${args.provider}, ${args.provider}_name, ${args.columnName}) VALUES('${
			args.id
		}', '${escapeSql(args.displayName)}', ${args.columnValue})`

		logger.log("Insert w/", query)

		db.exec(query)
	}
}
type InsertColumnValue = ReturnType<typeof createInsertWithColumnValue>

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

function createQueryNumViewers(db: sqlite.Database) {
	//TODO: "IS THIS FAST?"
	return db.prepare<[], { "COUNT(*)": number }>("SELECT COUNT(*) FROM ViewerData")
}

type QueryNumViewersStatement = ReturnType<typeof createQueryNumViewers>

const rendererViewerDataChanged = defineCallableIPC<
	(provider: string, id: string, varName: string, value: any) => void
>("viewer-data", "viewerDataChanged")

const rendererViewerDataAdded = defineCallableIPC<(provider: string, id: string, data: any) => void>(
	"viewer-data",
	"viewerDataAdded"
)

const rendererColumnAdded = defineCallableIPC<(ipcDef: IPCViewerVariable) => void>("viewer-data", "columnAdded")
const rendererColumnRemoved = defineCallableIPC<(name: string) => void>("viewer-data", "columnRemoved")

export const ViewerData = Service(
	class {
		private db: sqlite.Database

		private addColumnStatement: AddColumnStatement
		private createTableStatement: CreateTableStatement
		private removeTableStatement: RemoveTableStatement
		private setColumnValueStatement: SetColumnValueStatement
		private getColumnValueStatement: GetColumnValueStatement
		private pagedQueryStatement: PagedQueryStatement
		private pagedQueryOrderedStatement: PagedQueryOrderedStatement
		private queryNumViewerStatement: QueryNumViewersStatement

		private updateValue: UpdateColumnValue
		private insertValue: InsertColumnValue

		private _variables: ViewerVariable[] = []

		get variables() {
			return this._variables
		}

		private providers = new Map<string, ViewerProvider>()

		constructor() {}

		private async createDb(): Promise<void> {
			await ensureDirectory(resolveProjectPath("viewer-data"))
			const path = resolveProjectPath("viewer-data", "db.sqlite3")
			logger.log("Creating ViewerData DB", path)
			this.db = sqlite(path)
		}

		private async ensureColumn(variable: ViewerVariable) {
			try {
				const schemaType = getTypeByConstructor(variable.schema.type)
				if (!schemaType) return

				const sqlType = sqlTypes[schemaType.name] ?? "BLOB"

				const defaultValue = await constructDefault(variable.schema)
				const serializedDefault = await serializeSchema(variable.schema, defaultValue)

				this.addColumnStatement({
					columnName: variable.name,
					columnType: sqlType,
					columnDefault: serializedDefault,
				})
			} catch {}
		}

		private async loadVariables() {
			await ensureYAML([], "viewer-data", "variables.yaml")

			const data: SerializedViewerVariableDesc[] = await loadYAML("viewer-data", "variables.yaml")

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

		private async saveVariables() {
			const data = new Array<SerializedViewerVariableDesc>()

			for (const vari of this.variables) {
				const type = getTypeByConstructor(vari.schema.type)
				if (!type) continue

				const serializedVar: SerializedViewerVariableDesc = {
					name: vari.name,
					type: type.name,
				}

				if (vari.schema.default != null) {
					serializedVar.defaultValue = await serializeSchema(vari.schema, vari.schema.default)
				}

				data.push(serializedVar)
			}

			await writeYAML(data, "viewer-data", "variables.yaml")
		}

		getVariable(name: string) {
			return this.variables.find((v) => v.name == name)
		}

		async initialize() {
			await ensureDirectory(resolveProjectPath("/viewer-data"))

			await this.createDb()

			this.createTableStatement = createCreateTableStatement(this.db)
			await this.createTableStatement.run()

			this.addColumnStatement = createAddColumnStatement(this.db)
			this.removeTableStatement = createRemoveColumnStatement(this.db)
			this.getColumnValueStatement = createGetColumnValueStatement(this.db)
			this.setColumnValueStatement = createSetColumnValueStatement(this.db)
			this.pagedQueryStatement = createPagedQueryStatement(this.db)
			this.pagedQueryOrderedStatement = createPagedQueryOrderedStatement(this.db)
			this.queryNumViewerStatement = createQueryNumViewers(this.db)

			this.insertValue = createInsertWithColumnValue(this.db)
			this.updateValue = createUpdateColumnValue(this.db)

			await this.loadVariables()

			defineIPCFunc("viewer-data", "getVariables", () => {
				return this.variables.map((vari) => ({
					name: vari.name,
					schema: ipcConvertSchema(vari.schema, `viewerData_${vari.name}`),
				}))
			})

			defineIPCFunc(
				"viewer-data",
				"queryPagedData",
				async (start: number, end: number, sortBy: string | undefined, sortOrder: number | undefined) => {
					return await this.getPagedViewerData(start, end, sortBy, sortOrder)
				}
			)

			defineIPCFunc("viewer-data", "createVariable", async (ipcVarDesc: IPCViewerVariable) => {
				const schema = ipcParseSchema(ipcVarDesc.schema)

				await this.addViewerVariable(ipcVarDesc.name, schema)
			})

			defineIPCFunc("viewer-data", "getNumRows", async () => {
				return await this.getNumRows()
			})
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
			await this.saveVariables()

			const exposedDefault = await exposeSchema(schema, defaultValue)

			for (const provider of this.providers.values()) {
				provider.onColumnAdded(name, exposedDefault)
			}

			rendererColumnAdded({
				name,
				schema: ipcConvertSchema(schema, `viewerData_${name}`),
			})
		}

		async removeViewerVariable(name: string) {
			const idx = this.variables.findIndex((v) => v.name == name)
			if (idx < 0) return

			await this.removeTableStatement({ columnName: name })

			this.variables.splice(idx, 1)

			await this.saveVariables()

			for (const provider of this.providers.values()) {
				provider.onColumnRemoved(name)
			}

			rendererColumnRemoved(name)
		}

		async setViewerValue(provider: string, id: string, displayName: string, varname: string, value: any) {
			const vari = this.getVariable(varname)
			if (!vari) return

			const serialized = await serializeSchema(vari.schema, value)

			try {
				this.insertValue({
					provider,
					columnName: varname,
					columnValue: serialized,
					id,
					displayName,
				})

				try {
					await this.providers.get(provider)?.onDataChanged(id, varname, value)
				} catch (err) {
					logger.error("Error Updating Provider Data", id, varname, value, err)
				}

				const defaultValue = await this.getDefaultViewerData()

				defaultValue[varname] = value

				rendererViewerDataAdded(provider, id, defaultValue)
			} catch (err) {
				try {
					this.updateValue({
						provider,
						id,
						columnName: varname,
						columnValue: serialized,
					})

					try {
						await this.providers.get(provider)?.onDataChanged(id, varname, value)
					} catch (err) {
						logger.error("Error Updating Provider Data", id, varname, value, err)
					}

					rendererViewerDataChanged(provider, id, varname, value)
				} catch (err) {
					logger.error("Error Inserting New Viewer Data", id, varname, value, err)
				}
			}
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

		async getNumRows() {
			return this.queryNumViewerStatement.get()?.["COUNT(*)"] ?? 0
		}

		async getPagedViewerData(
			start: number,
			end: number,
			sortBy: string | undefined,
			sortOrder: number | undefined
		) {
			if (!sortBy) {
				const result = this.pagedQueryStatement.all({
					start,
					quantity: end - start,
				}) as Record<string, any>[]
				return result
			} else {
				const result = this.pagedQueryOrderedStatement({
					start,
					quantity: end - start,
					orderBy: sortBy,
					order: sortOrder == null || sortOrder >= 0 ? "ASC" : "DESC",
				}) as Record<string, any>[]
				return result
			}
		}
	}
)
