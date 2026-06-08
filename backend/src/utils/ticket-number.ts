import { DataSource } from 'typeorm'
import { SystemConfiguration } from '../entities/system-configuration.entity'
import { format } from 'date-fns'

export async function generateTicketNumber(dataSource: DataSource): Promise<string> {
  const repo = dataSource.getRepository(SystemConfiguration)
  const today = format(new Date(), 'yyyyMMdd')
  const key = `ticket_seq_${today}`

  return dataSource.transaction(async manager => {
    let config = await manager.findOne(SystemConfiguration, { where: { key } })

    if (!config) {
      config = manager.create(SystemConfiguration, { key, value: '1' })
    } else {
      config.value = String(parseInt(config.value) + 1)
    }

    await manager.save(config)
    const seq = config.value.padStart(5, '0')
    return `ASA-${today}-${seq}`
  })
}
