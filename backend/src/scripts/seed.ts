import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()

import * as bcrypt from 'bcrypt'
import { IsNull } from 'typeorm'
import { AppDataSource } from '../configs/data-source'
import { Department } from '../entities/department.entity'
import { Category } from '../entities/category.entity'
import { CategoryDepartmentMapping } from '../entities/category-department-mapping.entity'
import { SLAConfiguration } from '../entities/sla-configuration.entity'
import { User } from '../entities/user.entity'
import { UserRole } from '../types/user-role.enum'
import { Priority } from '../types/priority.enum'

async function seed() {
  console.log('Connecting to database...')
  await AppDataSource.initialize()

  console.log('Running migrations...')
  await AppDataSource.runMigrations()

  console.log('\n--- Seeding Departments ---')
  const deptRepo = AppDataSource.getRepository(Department)

  const departmentData = [
    { name: 'IT Support', description: 'Hardware, software, and infrastructure support' },
    { name: 'Finance', description: 'Billing, invoices, and financial matters' },
    { name: 'Client Success', description: 'Client onboarding, service requests, and feedback' },
    { name: 'HR', description: 'Human resources, payroll, and benefits' },
    { name: 'Legal', description: 'Contracts, compliance, and legal matters' },
    { name: 'Operations', description: 'Process improvement and vendor management' },
  ]

  const departments: Record<string, Department> = {}
  for (const d of departmentData) {
    let dept = await deptRepo.findOne({ where: { name: d.name } })
    if (!dept) {
      dept = await deptRepo.save(deptRepo.create(d))
      console.log(`  Created: ${d.name}`)
    } else {
      console.log(`  Exists:  ${d.name}`)
    }
    departments[d.name] = dept
  }

  console.log('\n--- Seeding Categories ---')
  const catRepo = AppDataSource.getRepository(Category)
  const mappingRepo = AppDataSource.getRepository(CategoryDepartmentMapping)

  const categoryData: Array<{ name: string; description: string; dept: string }> = [
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
  ]

  for (const c of categoryData) {
    let cat = await catRepo.findOne({ where: { name: c.name } })
    if (!cat) {
      cat = await catRepo.save(catRepo.create({ name: c.name, description: c.description }))
      console.log(`  Created: ${c.name}`)
    } else {
      console.log(`  Exists:  ${c.name}`)
    }

    const dept = departments[c.dept]
    if (dept) {
      const existingMapping = await mappingRepo.findOne({
        where: { categoryId: cat.id, departmentId: dept.id }
      })
      if (!existingMapping) {
        await mappingRepo.save(mappingRepo.create({ categoryId: cat.id, departmentId: dept.id }))
      }
    }
  }

  console.log('\n--- Seeding SLA Configurations ---')
  const slaRepo = AppDataSource.getRepository(SLAConfiguration)

  const slaData = [
    {
      name: 'Critical - Global',
      priority: Priority.Critical,
      firstResponseMinutes: 30,
      resolutionMinutes: 240,
    },
    {
      name: 'High - Global',
      priority: Priority.High,
      firstResponseMinutes: 120,
      resolutionMinutes: 480,
    },
    {
      name: 'Medium - Global',
      priority: Priority.Medium,
      firstResponseMinutes: 480,
      resolutionMinutes: 4320,
    },
    {
      name: 'Low - Global',
      priority: Priority.Low,
      firstResponseMinutes: 1440,
      resolutionMinutes: 7200,
    },
  ]

  for (const s of slaData) {
    const existing = await slaRepo.findOne({
      where: { name: s.name, departmentId: IsNull(), categoryId: IsNull() }
    })
    if (!existing) {
      await slaRepo.save(slaRepo.create({ ...s, businessHoursOnly: true, isActive: true }))
      console.log(`  Created: ${s.name} (FR: ${s.firstResponseMinutes}min, Res: ${s.resolutionMinutes}min)`)
    } else {
      console.log(`  Exists:  ${s.name}`)
    }
  }

  console.log('\n--- Seeding Users ---')
  const userRepo = AppDataSource.getRepository(User)
  const itSupport = departments['IT Support']

  const userData = [
    {
      email: 'admin@asaind.co.in',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.Admin,
      password: 'Admin@123456',
      departmentId: null as string | null,
    },
    {
      email: 'manager@asaind.co.in',
      firstName: 'Portal',
      lastName: 'Manager',
      role: UserRole.Manager,
      password: 'Manager@123456',
      departmentId: null as string | null,
    },
    {
      email: 'tl@asaind.co.in',
      firstName: 'Team',
      lastName: 'Leader',
      role: UserRole.TeamLeader,
      password: 'TL@123456',
      departmentId: itSupport?.id ?? null,
    },
    {
      email: 'agent@asaind.co.in',
      firstName: 'Support',
      lastName: 'Agent',
      role: UserRole.Agent,
      password: 'Agent@123456',
      departmentId: itSupport?.id ?? null,
    },
    {
      email: 'client@asaind.co.in',
      firstName: 'Demo',
      lastName: 'Client',
      role: UserRole.Client,
      password: 'Client@123456',
      departmentId: null as string | null,
    },
  ]

  for (const u of userData) {
    const existing = await userRepo.findOne({ where: { email: u.email } })
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 12)
      await userRepo.save(userRepo.create({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        password: hashed,
        departmentId: u.departmentId,
        isActive: true,
      }))
      console.log(`  Created: ${u.email} (${u.role})`)
    } else {
      console.log(`  Exists:  ${u.email}`)
    }
  }

  console.log('\n✅ Seed complete!\n')
  console.log('Demo credentials:')
  console.log('  Role          Email                          Password')
  console.log('  ──────────────────────────────────────────────────────────')
  for (const u of userData) {
    console.log(`  ${u.role.padEnd(13)} ${u.email.padEnd(30)} ${u.password}`)
  }

  await AppDataSource.destroy()
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
