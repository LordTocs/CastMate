<template>
	<scrolling-tab-body ref="body">
		<div>hello</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { provideDataEditor, provideRootData, ScrollingTabBody } from "castmate-ui-core"
import { ref, useTemplateRef } from "vue"
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

const editor = provideDataEditor()
provideRootData(data)
</script>

<style scoped></style>
