

/**
 * 
 * @param {String} str 
 * @returns {Boolean}
 */
export function isHexColor(str) {
    return /^#(?:(?:[A-F0-9]{2}){3,4}|[A-F0-9]{3})$/i.test(str)
}