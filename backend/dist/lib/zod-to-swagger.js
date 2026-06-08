"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodToFastifySchema = zodToFastifySchema;
exports.zodToFastifyResponseSchema = zodToFastifyResponseSchema;
const zod_to_json_schema_1 = require("zod-to-json-schema");
function zodToFastifySchema(schema) {
    const jsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(schema, { target: 'openApi3', $refStrategy: 'none' });
    if ('$schema' in jsonSchema)
        delete jsonSchema.$schema;
    return jsonSchema;
}
function zodToFastifyResponseSchema(schema) {
    const jsonSchema = (0, zod_to_json_schema_1.zodToJsonSchema)(schema, { target: 'openApi3', $refStrategy: 'none' });
    if ('$schema' in jsonSchema)
        delete jsonSchema.$schema;
    return jsonSchema;
}
//# sourceMappingURL=zod-to-swagger.js.map