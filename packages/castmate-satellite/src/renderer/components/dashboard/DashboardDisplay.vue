<template>
	<div class="flex-grow-1 flex flex-column">
		<div class="page-header"></div>
		<dashboard-page :page="currentPage"> </dashboard-page>
	</div>
</template>

<script setup lang="ts">
import DashboardPage from "./DashboardPage.vue"
import YAML from "yaml"
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { computed, ref } from "vue"

const currentPageIndex = ref(0)

const currentPage = computed(() => {
	const clampedIdx = Math.min(Math.max(currentPageIndex.value, 0), testData.pages.length - 1)
	return testData.pages[clampedIdx]
})

const testData = YAML.parse(`name: Test Dashboard
pages:
  - id: 8VzC1Fqm7x_vcz-8JJnL1
    name: ""
    sections:
      - id: Asik1IiHMilYkrX7ublzZ
        name: ""
        widgets:
          - id: BVuK_niIVYPNSEZpbL8Eq
            plugin: dashboards
            widget: button
            size:
              width: 1
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
            displayName: HELLO
            color: "#0022ff"
          - id: nc3XXiEHdvjiiwSoaAY1B
            plugin: dashboards
            widget: button
            size:
              width: 2
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: HULLO
          - id: Tmd9tgpLu0l9G8-1hsADZ
            plugin: dashboards
            widget: button
            size:
              width: 1
              height: 2
            config:
              triggerName: ""
              color: "#8c00ff"
              displayName: ""
          - id: lp7ek4AMuW6mUr7NrR13k
            plugin: dashboards
            widget: button
            size:
              width: 2
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
          - id: XcC6nOY-JcSMBf9mM0b4p
            plugin: dashboards
            widget: button
            size:
              width: 2
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
        columns: 4
      - id: xXRBj9lO28IeMJyyZNslu
        name: ""
        widgets:
          - id: C87xnGBPVMk6effeLcZto
            plugin: dashboards
            widget: button
            size:
              width: 2
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
          - id: SAADEBQHDc_XUdpMXkC3l
            plugin: dashboards
            widget: button
            size:
              width: 3
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
        columns: 4
  - id: L_Vdbtek0g3riV3SB4lPO
    name: ""
    sections:
      - id: WC3jSkAdQJCH0n-mO5v9I
        name: ""
        widgets:
          - id: R0o1YOBc3Jha8OapqNqnp
            plugin: dashboards
            widget: button
            size:
              width: 2
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
        columns: 4
      - id: vKJy-wi6ncLqc5Z7Bt7sN
        name: ""
        widgets:
          - id: PJG0xGQHOUNI9PKTATq5A
            plugin: dashboards
            widget: button
            size:
              width: 4
              height: 2
            config:
              triggerName: ""
              color: "#FF0000"
              displayName: ""
        columns: 4
remoteTwitchIds: []
`) as DashboardConfig
</script>

<style scoped></style>
