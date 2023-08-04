import { Resource, ResourceBase } from "./resource";
import * as fs from "fs/promises"
import * as path from "path"
import * as YAML from "yaml"

interface FileResourceConstructor {
    new (...args: any[]) : ResourceBase
    resourceDirectory : string
}

export class FileResource<ConfigType extends object, StateType extends object = {}> extends Resource<ConfigType, StateType> {

    static resourceDirectory : string = ""

    /**
     * Used to limit what part of the config is saved to file
     */
    get savedConfig() : object {
        return this.config
    }

    async load(savedConfig: object) : Promise<boolean> {
        await super.applyConfig(savedConfig) //Intentially call super here to avoid triggering a save
        return true
    }

    get directory() {
        return (this.constructor as FileResourceConstructor).resourceDirectory
    }

    get filename() {
        return path.join(this.directory, `${this.id}.yaml`)
    }

    async save() {
        await fs.writeFile(this.filename, YAML.stringify(this.savedConfig), 'utf-8')
    }

    async applyConfig(config: Partial<ConfigType>): Promise<void> {
        await super.applyConfig(config)
        await this.save()
    }

    async setConfig(config: ConfigType): Promise<void> {
        await super.setConfig(config)
        await this.save();
    }

    static async initialize() {
        await super.initialize()

        if (this.resourceDirectory == "") {
            throw new Error("Cannot load resources, no directory set!")
        }

        //TODO: Resolve directory out of the correct project folder
        const resolvedDir = this.resourceDirectory
        const files = await fs.readdir(resolvedDir)

        const fileLoadPromises = files.map(async (file) => {
            const id = path.basename(file, ".yaml")

            const fullFile = path.join(resolvedDir, file)

            try {
                const dataStr = await fs.readFile(fullFile, "utf-8")
                const data = YAML.parse(dataStr)

                const resource = new this()
                resource._id = id

                if (await resource.load(data) === false) {
                    return undefined
                }

                return resource

            } catch(err) {
                return undefined
            }
        })
        

        //Heh typescript bug can't detect we've eliminated all undefines
        const resources = (await Promise.all(fileLoadPromises)).filter(r => r != null) as ResourceBase[]

        this.storage.inject(...resources)
    }
}
