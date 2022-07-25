
/*
module.exports = {
    plugins: [
        require('@volar-plugins/prettyhtml')({ printWidth: 100 }),
    ],
};*/

import prettyhtml from '@volar-plugins/prettyhtml';

export default {
    plugins: [
        prettyhtml({ printWidth: 100 })
    ]
}