"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBusinessHour = isBusinessHour;
exports.addBusinessMinutes = addBusinessMinutes;
exports.getBusinessMinutesBetween = getBusinessMinutesBetween;
const date_fns_1 = require("date-fns");
const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 18;
function isBusinessHour(date) {
    if ((0, date_fns_1.isWeekend)(date))
        return false;
    const h = (0, date_fns_1.getHours)(date);
    const m = (0, date_fns_1.getMinutes)(date);
    const totalMinutes = h * 60 + m;
    return totalMinutes >= BUSINESS_START_HOUR * 60 && totalMinutes < BUSINESS_END_HOUR * 60;
}
function addBusinessMinutes(startDate, minutes) {
    let remaining = minutes;
    let current = new Date(startDate);
    current = nextBusinessMinute(current);
    while (remaining > 0) {
        current = (0, date_fns_1.addMinutes)(current, 1);
        if (isBusinessHour(current))
            remaining--;
    }
    return current;
}
function nextBusinessMinute(date) {
    let d = new Date(date);
    let iterations = 0;
    while (!isBusinessHour(d) && iterations < 60 * 24 * 7) {
        d = (0, date_fns_1.addMinutes)(d, 1);
        iterations++;
    }
    return d;
}
function getBusinessMinutesBetween(start, end) {
    let count = 0;
    let current = new Date(start);
    while (current < end) {
        if (isBusinessHour(current))
            count++;
        current = (0, date_fns_1.addMinutes)(current, 1);
    }
    return count;
}
//# sourceMappingURL=business-hours.js.map