"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMaskConfig = void 0;
exports.mask = mask;
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (Array.isArray(obj))
        return obj.map(item => deepClone(item));
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
            cloned[key] = deepClone(obj[key]);
    }
    return cloned;
}
function mask(data, config = {}) {
    if (data === null || data === undefined)
        return data;
    const { exclude = [], mask: maskFields = {} } = config;
    if (Array.isArray(data))
        return data.map(item => mask(item, config));
    if (typeof data !== 'object')
        return data;
    if (data instanceof Date)
        return data;
    const cloned = deepClone(data);
    for (const key in cloned) {
        if (!Object.prototype.hasOwnProperty.call(cloned, key))
            continue;
        if (exclude.includes(key)) {
            delete cloned[key];
            continue;
        }
        if (key in maskFields)
            continue;
        if (typeof cloned[key] === 'object' && cloned[key] !== null && !(cloned[key] instanceof Date)) {
            cloned[key] = mask(cloned[key], config);
        }
    }
    return cloned;
}
exports.userMaskConfig = { exclude: ['password'] };
//# sourceMappingURL=mask.js.map