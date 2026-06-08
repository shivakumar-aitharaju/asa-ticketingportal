"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = seed;
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const bcrypt = __importStar(require("bcrypt"));
const typeorm_1 = require("typeorm");
const data_source_1 = require("../configs/data-source");
const department_entity_1 = require("../entities/department.entity");
const category_entity_1 = require("../entities/category.entity");
const category_department_mapping_entity_1 = require("../entities/category-department-mapping.entity");
const sla_configuration_entity_1 = require("../entities/sla-configuration.entity");
const user_entity_1 = require("../entities/user.entity");
const user_role_enum_1 = require("../types/user-role.enum");
const priority_enum_1 = require("../types/priority.enum");
async function seed() {
    console.log('Connecting to database...');
    await data_source_1.AppDataSource.initialize();
    console.log('Running migrations...');
    await data_source_1.AppDataSource.runMigrations();
    console.log('\n--- Seeding Departments ---');
    const deptRepo = data_source_1.AppDataSource.getRepository(department_entity_1.Department);
    const departmentData = [
        { name: 'IT Support', description: 'Hardware, software, and infrastructure support' },
        { name: 'Finance', description: 'Billing, invoices, and financial matters' },
        { name: 'Client Success', description: 'Client onboarding, service requests, and feedback' },
        { name: 'HR', description: 'Human resources, payroll, and benefits' },
        { name: 'Legal', description: 'Contracts, compliance, and legal matters' },
        { name: 'Operations', description: 'Process improvement and vendor management' },
    ];
    const departments = {};
    for (const d of departmentData) {
        let dept = await deptRepo.findOne({ where: { name: d.name } });
        if (!dept) {
            dept = await deptRepo.save(deptRepo.create(d));
            console.log(`  Created: ${d.name}`);
        }
        else {
            console.log(`  Exists:  ${d.name}`);
        }
        departments[d.name] = dept;
    }
    console.log('\n--- Seeding Categories ---');
    const catRepo = data_source_1.AppDataSource.getRepository(category_entity_1.Category);
    const mappingRepo = data_source_1.AppDataSource.getRepository(category_department_mapping_entity_1.CategoryDepartmentMapping);
    const categoryData = [
        { name: 'Hardware Issues', description: 'Laptop, desktop, and peripheral problems', dept: 'IT Support' },
        { name: 'Software & Applications', description: 'Application errors and installation requests', dept: 'IT Support' },
        { name: 'Network & Connectivity', description: 'VPN, WiFi, and internet access issues', dept: 'IT Support' },
        { name: 'Account Access', description: 'Password resets, lockouts, and permission requests', dept: 'IT Support' },
        { name: 'Invoice & Billing', description: 'Invoice queries and billing corrections', dept: 'Finance' },
        { name: 'Payment Issues', description: 'Payment processing and refund requests', dept: 'Finance' },
        { name: 'Expense Reports', description: 'Expense submissions and reimbursements', dept: 'Finance' },
        { name: 'Onboarding Support', description: 'New client setup and welcome assistance', dept: 'Client Success' },
        { name: 'Service Requests', description: 'General service and product inquiries', dept: 'Client Success' },
        { name: 'Complaints & Feedback', description: 'Client complaints and improvement suggestions', dept: 'Client Success' },
        { name: 'Recruitment', description: 'Job postings, interviews, and hiring processes', dept: 'HR' },
        { name: 'Payroll & Benefits', description: 'Salary, benefits, and payroll queries', dept: 'HR' },
        { name: 'Leave & Attendance', description: 'Leave requests and attendance records', dept: 'HR' },
        { name: 'Contract Review', description: 'Contract drafting and legal review requests', dept: 'Legal' },
        { name: 'Compliance', description: 'Regulatory compliance and policy queries', dept: 'Legal' },
        { name: 'Process Improvement', description: 'Workflow and process optimization requests', dept: 'Operations' },
        { name: 'Vendor Management', description: 'Vendor onboarding and relationship queries', dept: 'Operations' },
    ];
    for (const c of categoryData) {
        let cat = await catRepo.findOne({ where: { name: c.name } });
        if (!cat) {
            cat = await catRepo.save(catRepo.create({ name: c.name, description: c.description }));
            console.log(`  Created: ${c.name}`);
        }
        else {
            console.log(`  Exists:  ${c.name}`);
        }
        const dept = departments[c.dept];
        if (dept) {
            const existingMapping = await mappingRepo.findOne({
                where: { categoryId: cat.id, departmentId: dept.id }
            });
            if (!existingMapping) {
                await mappingRepo.save(mappingRepo.create({ categoryId: cat.id, departmentId: dept.id }));
            }
        }
    }
    console.log('\n--- Seeding SLA Configurations ---');
    const slaRepo = data_source_1.AppDataSource.getRepository(sla_configuration_entity_1.SLAConfiguration);
    const slaData = [
        {
            name: 'Critical - Global',
            priority: priority_enum_1.Priority.Critical,
            firstResponseMinutes: 30,
            resolutionMinutes: 240,
        },
        {
            name: 'High - Global',
            priority: priority_enum_1.Priority.High,
            firstResponseMinutes: 120,
            resolutionMinutes: 480,
        },
        {
            name: 'Medium - Global',
            priority: priority_enum_1.Priority.Medium,
            firstResponseMinutes: 480,
            resolutionMinutes: 4320,
        },
        {
            name: 'Low - Global',
            priority: priority_enum_1.Priority.Low,
            firstResponseMinutes: 1440,
            resolutionMinutes: 7200,
        },
    ];
    for (const s of slaData) {
        const existing = await slaRepo.findOne({
            where: { name: s.name, departmentId: (0, typeorm_1.IsNull)(), categoryId: (0, typeorm_1.IsNull)() }
        });
        if (!existing) {
            await slaRepo.save(slaRepo.create({ ...s, businessHoursOnly: true, isActive: true }));
            console.log(`  Created: ${s.name} (FR: ${s.firstResponseMinutes}min, Res: ${s.resolutionMinutes}min)`);
        }
        else {
            console.log(`  Exists:  ${s.name}`);
        }
    }
    console.log('\n--- Seeding Users ---');
    const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
    const itSupport = departments['IT Support'];
    const userData = [
        {
            email: 'admin@asaind.co.in',
            firstName: 'System',
            lastName: 'Admin',
            role: user_role_enum_1.UserRole.Admin,
            password: 'Admin@123456',
            departmentId: null,
        },
        {
            email: 'manager@asaind.co.in',
            firstName: 'Portal',
            lastName: 'Manager',
            role: user_role_enum_1.UserRole.Manager,
            password: 'Manager@123456',
            departmentId: null,
        },
        {
            email: 'tl@asaind.co.in',
            firstName: 'Team',
            lastName: 'Leader',
            role: user_role_enum_1.UserRole.TeamLeader,
            password: 'TL@123456',
            departmentId: itSupport?.id ?? null,
        },
        {
            email: 'agent@asaind.co.in',
            firstName: 'Support',
            lastName: 'Agent',
            role: user_role_enum_1.UserRole.Agent,
            password: 'Agent@123456',
            departmentId: itSupport?.id ?? null,
        },
        {
            email: 'client@asaind.co.in',
            firstName: 'Demo',
            lastName: 'Client',
            role: user_role_enum_1.UserRole.Client,
            password: 'Client@123456',
            departmentId: null,
        },
    ];
    for (const u of userData) {
        const existing = await userRepo.findOne({ where: { email: u.email } });
        if (!existing) {
            const hashed = await bcrypt.hash(u.password, 12);
            await userRepo.save(userRepo.create({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                password: hashed,
                departmentId: u.departmentId,
                isActive: true,
            }));
            console.log(`  Created: ${u.email} (${u.role})`);
        }
        else {
            console.log(`  Exists:  ${u.email}`);
        }
    }
    console.log('\n✅ Seed complete!\n');
    console.log('Demo credentials:');
    console.log('  Role          Email                          Password');
    console.log('  ──────────────────────────────────────────────────────────');
    for (const u of userData) {
        console.log(`  ${u.role.padEnd(13)} ${u.email.padEnd(30)} ${u.password}`);
    }
    await data_source_1.AppDataSource.destroy();
}
if (require.main === module) {
    seed().catch(err => {
        console.error('\n❌ Seed failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed.js.map