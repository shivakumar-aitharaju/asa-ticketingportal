export interface MaskConfig {
  exclude?: string[]
  mask?: Record<string, 'email' | 'phone' | 'partial' | ((value: any) => string)>
}

function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) cloned[key] = deepClone(obj[key])
  }
  return cloned
}

export function mask<T>(data: T, config: MaskConfig = {}): T {
  if (data === null || data === undefined) return data
  const { exclude = [], mask: maskFields = {} } = config
  if (Array.isArray(data)) return data.map(item => mask(item, config)) as unknown as T
  if (typeof data !== 'object') return data
  if (data instanceof Date) return data

  const cloned = deepClone(data) as Record<string, any>
  for (const key in cloned) {
    if (!Object.prototype.hasOwnProperty.call(cloned, key)) continue
    if (exclude.includes(key)) { delete cloned[key]; continue }
    if (key in maskFields) continue
    if (typeof cloned[key] === 'object' && cloned[key] !== null && !(cloned[key] instanceof Date)) {
      cloned[key] = mask(cloned[key], config)
    }
  }
  return cloned as T
}

export const userMaskConfig: MaskConfig = { exclude: ['password'] }
