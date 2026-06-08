"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicketNumber = generateTicketNumber;
const system_configuration_entity_1 = require("../entities/system-configuration.entity");
const date_fns_1 = require("date-fns");
async function generateTicketNumber(dataSource) {
    const repo = dataSource.getRepository(system_configuration_entity_1.SystemConfiguration);
    const today = (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
    const key = `ticket_seq_${today}`;
    return dataSource.transaction(async (manager) => {
        let config = await manager.findOne(system_configuration_entity_1.SystemConfiguration, { where: { key } });
        if (!config) {
            config = manager.create(system_configuration_entity_1.SystemConfiguration, { key, value: '1' });
        }
        else {
            config.value = String(parseInt(config.value) + 1);
        }
        await manager.save(config);
        const seq = config.value.padStart(5, '0');
        return `ASA-${today}-${seq}`;
    });
}
//# sourceMappingURL=ticket-number.js.map