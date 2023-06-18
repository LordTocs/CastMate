<template>
	<v-autocomplete
		v-model="modelObj"
		:items="files"
		:loading="loading"
		:search-input.sync="search"
		cache-items
		:label="label"
		:clearable="clearable"
		item-title="basename"
		item-value="path"
		@copy.stop=""
		@paste.stop=""
	>
		<template #append>
			<v-btn icon="mdi-folder" size="x-small" @click="openFolder" />
		</template>
	</v-autocomplete>
</template>

<script>
import fs from "fs"
import path from "path"
import recursiveReaddir from "recursive-readdir"
import { mapModel } from "../../utils/modelValue"
import { shell } from "electron"
import { mapState } from "pinia"
import { usePathStore } from "../../store/paths"

export default {
	props: {
		path: { type: String },
		label: { type: String, default: () => undefined },
		ext: { type: Array, default: () => [] },
		recursive: { type: Boolean, default: () => false },
		basePath: { type: String, default: () => null },
		clearable: { type: Boolean, default: () => false },
		modelValue: {},
	},
	emits: ["update:modelValue"],
	computed: {
		...mapState(usePathStore, {
			userFolder: "userFolder",
		}),
		...mapModel(),
		searchPath() {
			return path.join(this.userFolder, this.path)
		},
		fullBasePath() {
			return path.join(this.userFolder, this.basePath)
		},
	},
	data() {
		return {
			search: null,
			files: [],
			loading: false,
		}
	},
	watch: {
		search(newValue) {
			if (newValue && newValue != this.value) {
				this.filterFiles(newValue)
			}
		},
	},
	methods: {
		async getFilenames() {
			console.log("Searching: ", this.searchPath)

			let files = await (!this.recursive
				? fs.readdirSync(this.searchPath)
				: recursiveReaddir(this.searchPath))

			//Filter out extensions
			if (this.ext && this.ext.length > 0) {
				files = files.filter((filename) =>
					this.ext.includes(path.extname(filename))
				)
			}

			if (!this.recursive) {
				files = files.map((filename) =>
					path.join(this.searchPath, filename)
				)
			}

			files = files.map((filename) => ({
				path: path.relative(
					!this.basePath ? this.searchPath : this.fullBasePath,
					filename
				),
				basename: path.basename(filename),
			}))

			return files
		},
		async filterFiles(name) {
			this.loading = true

			const allFiles = await this.getFilenames()

			//Filter on name
			this.files = allFiles.filter((fileObj) =>
				fileObj.basename.toLowerCase().includes(name.toLowerCase())
			)

			this.loading = false
		},
		async openFolder() {
			shell.openPath(this.searchPath)
		},
	},
	async mounted() {
		this.loading = true

		this.files = await this.getFilenames()

		this.loading = false
	},
}
</script>

<style></style>
