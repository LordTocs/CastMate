import _ from 'lodash'
import { callIpcFunc, ipcFunc } from "../utils/electronBridge"
import { nanoid } from 'nanoid/non-secure'
import fs from 'fs'
import path from 'path'
import { ensureFolder, userFolder } from '../utils/configuration'
import YAML from 'yaml'
import { ResourceManager } from './resource-manager'
import { cleanSchemaForIPC } from '../utils/schema'


export class Resource {
    constructor(type, spec) {
        this.spec = spec
        this.resourceType = type
        this.resources = []

        this.createIOFuncs();

        ResourceManager.getInstance().registerResource(this);
    }

    get name() {
        return this.spec.name || this.spec.type;
    }

    get type() {
        return this.spec.type;
    }

    toIpcDescription() {
        const desc =  {
            type: this.type,
            name: this.name,
            typePlural: this.spec.typePlural ? this.spec.typePlural : `${this.spec.type}s`,
            description: this.spec.description,
            config: cleanSchemaForIPC(`${this.spec.type}_config`, this.spec.config),
        }
        console.log(desc);
        return desc;
    }

    _transformForIPC(resource) {
        if (!resource)
            return undefined
        return {
            id: resource.id,
            config: resource.config
        }
    }

    _triggerUpdate() {
        callIpcFunc('resources_updateResourceArray', { type: this.spec.type, resources: this.resources.map(r => this._transformForIPC(r)) })
    }

    getById(id) {
        return this.resources.find(r => r.id === id)
    }

    async create(config) {
        const hasStaticCreate = _.isFunction(this.resourceType.create)

        console.log("Creating", this.name, " with ", config);

        const newResource = hasStaticCreate ? await this.resourceType.create(config) : new this.resourceType(config)

        this.resources.push(newResource)

        this._triggerUpdate();

        return newResource
    }

    async load() {
        console.log("Loading... ", this.name);
        this.resources = await this.resourceType.load()
        console.log(this.resources);

        this._triggerUpdate();
    }

    async deleteById(id) {
        const idx = this.resources.findIndex(r => r.id === id)
        if (idx == -1)
            return;

        const r = this.resources[idx];
        await r.deleteSelf();

        this.resources.splice(idx, 1);

        this._triggerUpdate();
    }

    async clone(id) {
        const r = this.getById(id)
        if (!r)
            return;

        if (_.isFunction(r.clone)) {
            const newResource = await r.clone();

            this.resources.push(newResource)
            this._triggerUpdate();

            return newResource
        }
        else {
            return await this.create(r.config)
        }
    }

    createIOFuncs() {
        ipcFunc("resources", `${this.type}_get`, () => {
            return this.resources.map(r => this._transformForIPC(r)) //????
        })

        ipcFunc("resources", `${this.type}_getById`, (id) => {
            return this._transformForIPC(this.getById(id))
        })

        ipcFunc("resources", `${this.type}_setConfig`, async (id, config) => {
            const r = this.getById(id);
            await r?.setConfig(config);
            this._triggerUpdate();
        })

        ipcFunc("resources", `${this.type}_create`, async (config) => {
            return this._transformForIPC(await this.create(config));
        })

        ipcFunc("resources", `${this.type}_delete`, async (id) => {
            await this.deleteById(id)
        })

        ipcFunc("resources", `${this.type}_clone`, async (id) => {
            return this._transformForIPC(await this.clone(id))
        })
    }
}

export class FileResource {
    static async create(config) {
        const instance = new this();

        instance.config = config;
        if (!instance.id) {
            instance.id = nanoid();
        }

        const dir = path.join(userFolder, this.storageFolder);
        ensureFolder(dir);
        await fs.promises.writeFile(path.join(dir, `${instance.id}.yaml`), YAML.stringify(instance.config), 'utf-8');
    }

    static async load() {
        const dir = path.join(userFolder, this.storageFolder);
        ensureFolder(dir);

        let files = await fs.promises.readdir(dir);
		files = files.filter(f => path.extname(f) == '.yaml');

        const instances = await Promise.all(files.map(async file => {
            const filename = path.join(dir, file);

            try {
                const str = await fs.promises.readFile(filename, 'utf-8')
                const yaml = YAML.parse(str)
                const instance = new this()
                instance.id = path.basename(file, '.yaml')
                instance.config = yaml
                return instance
            }
            catch(err) {

            }
            return null;
        }))

        return instances.filter(i => !!i)
    }

    async clone() {
        await this.constructor.create(this.config)
    }

    async setConfig(config) {
        this.config = config
        console.log("Set Config", config, userFolder, this.constructor.storageFolder)
        await fs.promises.writeFile(path.join(userFolder, this.constructor.storageFolder, `${this.id}.yaml`), YAML.stringify(config), 'utf-8');
    }

    async deleteSelf() {
        await fs.promises.unlink(path.join(userFolder, this.constructor.storageFolder, `${this.id}.yaml`))
    }
}