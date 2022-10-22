import _cloneDeep from 'lodash/cloneDeep'
import { computed } from 'vue';

/*
//NESTED MODEL VALUES IS HARD D:

// Ideally we'd have some sort of nest-v-model-forwarding so when you edited obj.subobj we didn't have to clone all of obj and could just update subobj
// This requires more thought and I'm surprised it wasn't put into vue3 natively as it's the biggest PITA when building form components.
// It seems vue3 has gone the multi-v-model route and the samples of an address component bind each of the values as separate v-models
// This sucks because in our generated UI we don't know what values are expected to exist at bind time.
// Overall, very shortsighted of vue3. 6/10 

function setModelValue(self, objPath, newValue) {
    if (objPath.length == 0) {
        return self.$emit('update:modelValue', newValue);
    }

    const newObj = _cloneDeep(self.modelValue);

    let container = newObj;

    for (let i = 0; i < objPath.length - 1; ++i) {
        if (!(objPath[i] in container)) {
            container[objPath[i]] = {};
        }
        container = container[objPath[i]]
    }

    container[objPath[objPath.length - 1]] = newValue;

    self.$emit('update:modelValue', newObj);
}

const createSetter = (self, objPath) => {
    return (newValue) => {

    }
}

function createSubModelHelper(self, totalObjPath, schema) {
    totalObjPath = totalObjPath || [];
    const modelHelper = {};

    const createValueHelper = (objPath) => {
        return computed({
            get: () => {
                let result = self.modelValue;

                if (!result)
                    return null;

                for (let p of objPath) {
                    result = result[p];
                    if (!result)
                        return null;
                }
                return result;
            },
            set: (newValue) => setModelValue(self, objPath, newValue)
        })
    }

    for (let key of Object.keys(schema.properties)) {
        let helper = null;
        if (schema.properties && schema.properties[key] instanceof Object) {
            helper = createSubModelHelper(self, [...totalObjPath, key])
        }
        else {
            helper = createValueHelper(self, [...totalObjPath, key], schema.properties[key])
        }

        Object.defineProperty(modelHelper, key, {
            enumerable: true,
            writable: true,
            get: () => helper,
            set: (newValue) => helper = newValue
        })
    }

    return modelHelper;
}


export function mapModelObj(schema) {
    return {
        modelObj: {
            get() {

            },
            set(newValue) {
                setModelValue(this, [], newValue);
            }
        }
    }
}
*/
export function mapModelValues(subvalues, varname="modelValue") {
    const result = {};

    for (let sv of subvalues) {
        result[sv] = {
            get() {
                return this[varname] ? this[varname][sv] : null;
            },
            set(newValue) {
                const newObj = _cloneDeep(this[varname]);
                newObj[sv] = newValue;
                this.$emit(`update:${varname}`, newObj);
            }
        }
    }

    return result;
}

export function mapModel(varname="modelValue", as="modelObj") {
    return {
        [as]: {
            get() {
                return this[varname];
            },
            set(newValue) {
                this.$emit(`update:${varname}`, newValue);
            }
        }
    }
}

export function defineModel(varName="modelValue", propSpec={}) {
    const prop = defineProps({
        [varName]: propSpec
    })

    const emitName = `update:${modelValue}`;
    const emit = defineEmits([emitName])

    return computed({
        get() {
            return prop[varName];
        },
        set(value) {
            emit(emitName, value)
        }
    })
}