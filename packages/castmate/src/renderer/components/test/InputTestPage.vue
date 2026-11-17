<template>
	<scrolling-tab-body ref="body">
		<div>
			hello
			<data-input v-model="data" :schema="testSchema" />
		</div>
		<div><ui-data-editor-debug :editor="editor" /></div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { provideUIDataEditor, ScrollingTabBody, DataInput, UiDataEditorDebug } from "castmate-ui-core"
import { onMounted, ref, useTemplateRef } from "vue"
import { S, SchemaType } from "castmate-schema"

const body = useTemplateRef("body")

const testSchema = S.Object({
	a: S.Number(),
	b: S.Optional(S.Number()),
	c: S.String(),
	d: S.Optional(S.String()),
})

const data = ref<SchemaType<typeof testSchema>>({
	a: 10,
	c: "",
})

const editor = provideUIDataEditor(data)
</script>

<style scoped></style>
