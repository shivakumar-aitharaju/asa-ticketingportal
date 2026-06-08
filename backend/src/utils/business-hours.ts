import { addMinutes, isWeekend, getHours, getMinutes } from 'date-fns'

const BUSINESS_START_HOUR = 9   // 09:00
const BUSINESS_END_HOUR = 18    // 18:00

export function isBusinessHour(date: Date): boolean {
  if (isWeekend(date)) return false
  const h = getHours(date)
  const m = getMinutes(date)
  const totalMinutes = h * 60 + m
  return totalMinutes >= BUSINESS_START_HOUR * 60 && totalMinutes < BUSINESS_END_HOUR * 60
}

export function addBusinessMinutes(startDate: Date, minutes: number): Date {
  let remaining = minutes
  let current = new Date(startDate)

  // Jump forward to next business hour if we're outside
  current = nextBusinessMinute(current)

  while (remaining > 0) {
    current = addMinutes(current, 1)
    if (isBusinessHour(current)) remaining--
  }

  return current
}

function nextBusinessMinute(date: Date): Date {
  let d = new Date(date)
  let iterations = 0
  while (!isBusinessHour(d) && iterations < 60 * 24 * 7) {
    d = addMinutes(d, 1)
    iterations++
  }
  return d
}

export function getBusinessMinutesBetween(start: Date, end: Date): number {
  let count = 0
  let current = new Date(start)
  while (current < end) {
    if (isBusinessHour(current)) count++
    current = addMinutes(current, 1)
  }
  return count
}
