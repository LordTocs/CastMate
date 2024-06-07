import { MagicString, walkASTSetup, parseSFC, isCallOf, walkAST } from "@vue-macros/common"
import type { Node } from "@babel/types"

const DEFINE_WIDGET = "defineOverlayWidget"

export function transformDefineWidget(code: string, id: string) {
	if (!code.includes(DEFINE_WIDGET)) return

	const sfc = parseSFC(code, id)
	if (!sfc.scriptSetup) return

	const offset = sfc.scriptSetup.loc.start.offset
	const s = new MagicString(code)
	const setupAst = sfc.getSetupAst()!

	walkAST<Node>(setupAst, {
		enter(node, parent, key, index) {
			if (!isCallOf(node, DEFINE_WIDGET)) return

			//node is -> defineOverlayWidget(...)
			//const props = defineOverlayWidget(...)

			/* Transform to

            const __overlayOptions = declareOverlayOptions(...);
            const props = defineProps<ResolvedSchemaType<typeof __overlayOptions.config>>();
            defineOptions(__overlayOptions);
            */

			const configObj = node.arguments[0]
			if (!configObj) throw new Error("defineOverlayWidget requires a config obj")
		},
	})
}
