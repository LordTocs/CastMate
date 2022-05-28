import _cloneDeep from "lodash/cloneDeep"

function setDeep(obj, path, value) {
    const pathSplit = path.split('.');

    if (!(obj instanceof Object)) {
        obj = {};
    }

    let subObj = obj;
    for (let i = 0; i < pathSplit.length - 1; ++i) {
        const varName = pathSplit[i];
        if (!(varName in subObj)) {
            subObj[varName] = {};
        }
    }

    subObj[pathSplit[pathSplit.length - 1]] = value;

    return obj;
}

export default {
    install(Vue) {
        Vue.prototype.$subEmit = function (event, path, value) {
            let newValue = _cloneDeep(this.value);

            newValue = setDeep(newValue, path, value);

            this.$emit(event, newValue);
        }
    }
}