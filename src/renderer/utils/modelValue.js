import _cloneDeep from 'lodash/cloneDeep'
import { computed } from 'vue';

/*
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
export function mapModelValues(subvalues) {
    const result = {};

    for (let sv of subvalues) {
        result[sv] = {
            get() {
                return this.modelValue ? this.modelValue[sv] : null;
            },
            set(newValue) {
                const newObj = _cloneDeep(this.modelValue);
                newObj[sv] = newValue;
                this.$emit('update:modelValue', newObj);
            }
        }
    }

    console.log(result);

    return result;
}

export function mapModel() {
    return {
        modelObj: {
            get() {
                return this.modelValue;
            },
            set(newValue) {
                this.$emit('update:modelValue', newValue);
            }
        }
    }
}