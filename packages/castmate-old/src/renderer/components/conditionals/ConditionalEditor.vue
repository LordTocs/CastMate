<template>
	<v-card :color="color">
		<v-card-text>
			<empty-conditional v-if="isEmpty" v-model="modelObj" />
			<div class="array-div" v-else-if="isAnd">
				<div class="array-header">And</div>
				<div class="array-container">
					<v-row v-for="(subConditional, i) in value.and" :key="i">
						<v-col>
							<conditional-editor
								:model-value="subConditional"
								@update:model-value="
									(v) => updateSubCondition(i, v)
								"
								@delete="deleteSubCondition(i)"
							/>
						</v-col>
					</v-row>
					<v-row>
						<v-col>
							<empty-conditional
								:model-value="null"
								@update:model-value="(v) => addSubCondition(v)"
							/>
						</v-col>
					</v-row>
				</div>
				<v-btn @click="$emit('delete')" color="red"> Delete </v-btn>
			</div>
			<div class="array-div" v-else-if="isOr">
				<div class="array-header">Or</div>
				<div class="array-container">
					<v-row v-for="(subConditional, i) in value.or" :key="i">
						<v-col>
							<conditional-editor
								:model-value="subConditional"
								@update:model-value="
									(v) => updateSubCondition(i, v)
								"
								@delete="deleteSubCondition(i)"
							/>
						</v-col>
					</v-row>
					<v-row>
						<v-col>
							<empty-conditional
								:model-value="null"
								@update:model-value="(v) => addSubCondition(v)"
							/>
						</v-col>
					</v-row>
				</div>
				<v-btn @click="$emit('delete')" color="red"> Delete </v-btn>
			</div>
			<div class="array-div" v-else-if="isNot">
				<div class="array-header">Not</div>
				<div class="array-container">
					<conditional-editor
						:model-value="value.not"
						@update:model-value="(v) => changeStateValue('not', v)"
						@delete="(v) => changeStateValue('not', null)"
					/>
				</div>
				<div style="flex: 0; margin-bottom: 18px; margin-left: 5px">
					<v-btn @click="$emit('delete')" color="red"> Delete </v-btn>
				</div>
			</div>
			<v-row v-else>
				<v-col>
					<state-selector
						label="Variable Name"
						:model-value="stateName"
						@update:model-value="
							(v) => changeStateName(stateName, v)
						"
						@delete="deleteSubCondition(i)"
					/>
				</v-col>
				<v-col>
					<number-input
						:model-value="stateValue"
						@update:model-value="
							(v) => changeStateValue(stateName, v)
						"
						label="Target Value"
						allowTemplate
					/>
				</v-col>
				<div style="margin-top: 28px">
					<v-btn @click="$emit('delete')" color="red"> Delete </v-btn>
				</div>
			</v-row>
		</v-card-text>
	</v-card>
</template>

<script>
import StateSelector from "../state/StateSelector.vue"
import EmptyConditional from "./EmptyConditional.vue"
import { changeObjectKey } from "../../utils/objects.js"
import NumberInput from "../data/types/NumberInput.vue"
import { mapModel } from "../../utils/modelValue"
export default {
	name: "ConditionalEditor",
	props: {
		modelValue: {},
	},
	emits: ["update:modelValue"],
	components: {
		StateSelector,
		EmptyConditional,
		NumberInput,
	},
	computed: {
		isOr() {
			return "or" in this.value
		},
		isAnd() {
			return "and" in this.value
		},
		isNot() {
			return "not" in this.value
		},
		isEmpty() {
			return !this.value
		},
		...mapModel(),
		stateName() {
			let keys = Object.keys(this.value)
			if (keys.length > 0) return keys[0]
			return null
		},
		stateValue() {
			return this.value[this.stateName]
		},
		color() {
			if (this.isEmpty || this.isOr || this.isAnd || this.isNot) {
				return "grey darken-3"
			}
			return "grey darken-2"
		},
	},
	methods: {
		updateSubCondition(index, subValue) {
			let newValue = {}
			let newArray = null
			if (this.isOr) {
				newArray = [...this.value.or]
				newValue.or = newArray
			} else if (this.isAnd) {
				newArray = [...this.value.and]
				newValue.and = newArray
			}

			newArray[index] = subValue

			this.$emit("input", newValue)
		},
		deleteSubCondition(index) {
			let newValue = {}
			let newArray = null
			if (this.isOr) {
				newArray = [...this.value.or]
				newValue.or = newArray
			} else if (this.isAnd) {
				newArray = [...this.value.and]
				newValue.and = newArray
			}

			newArray.splice(index, 1)

			this.$emit("input", newValue)
		},
		changeStateName(oldName, newName) {
			let newValue = null

			if (oldName) {
				newValue = changeObjectKey(this.value, oldName, newName)
			} else {
				newValue = { [newName]: null }
			}

			this.$emit("input", newValue)
		},
		changeStateValue(key, value) {
			let newValue = { ...this.value }

			newValue[key] = value

			this.$emit("input", newValue)
		},
		addSubCondition(subCondition) {
			let newValue = {}
			let newArray = null
			if (this.isOr) {
				newArray = [...this.value.or]
				newValue.or = newArray
			} else if (this.isAnd) {
				newArray = [...this.value.and]
				newValue.and = newArray
			}
			newArray.push(subCondition)
			this.$emit("input", newValue)
		},
	},
}
</script>

<style scope>
.value-div {
	display: flex;
	flex-direction: row;
	flex: 1;
}

.array-div {
	display: flex;
	flex-direction: row;
}

.array-header {
	display: flex;
	flex-direction: column;
	justify-content: center;

	border: 2px solid #dbdbdb;
	border-right: 0px;

	margin-right: 1rem;
	margin-bottom: 18px;
	padding-left: 18px;
}

.array-container {
	flex: 1;
	margin-right: 0.5rem;
}
</style>
