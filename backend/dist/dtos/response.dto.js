"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.paginatedResponse = paginatedResponse;
function successResponse(data, message) {
    return { data, ...(message && { message }) };
}
function paginatedResponse(data, pagination) {
    return { data, pagination };
}
//# sourceMappingURL=response.dto.js.map