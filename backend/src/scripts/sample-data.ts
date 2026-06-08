import 'reflect-metadata'
import * as dotenv from 'dotenv'
dotenv.config()

import * as bcrypt from 'bcrypt'
import { AppDataSource } from '../configs/data-source'
import { Department } from '../entities/department.entity'
import { Category } from '../entities/category.entity'
import { CategoryDepartmentMapping } from '../entities/category-department-mapping.entity'
import { SLAConfiguration } from '../entities/sla-configuration.entity'
import { User } from '../entities/user.entity'
import { Ticket } from '../entities/ticket.entity'
import { TicketMessage } from '../entities/ticket-message.entity'
import { TicketStatusHistory } from '../entities/ticket-status-history.entity'
import { TicketAssignment } from '../entities/ticket-assignment.entity'
import { SLATracking, SLAStatus } from '../entities/sla-tracking.entity'
import { UserRole } from '../types/user-role.enum'
import { Priority } from '../types/priority.enum'
import { TicketStatus } from '../types/ticket-status.enum'

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function addMinutes(date: Date, mins: number): Date {
  return new Date(date.getTime() + mins * 60000)
}

function randomDateInMonth(year: number, month: number, dayIndex: number, totalDays: number, rand: () => number): Date {
  const daysInMonth = new Date(year, month, 0).getDate()
  const day = Math.max(1, Math.min(daysInMonth, 1 + Math.floor((dayIndex / totalDays) * (daysInMonth - 1))))
  const hour = 8 + Math.floor(rand() * 9) // 8am – 5pm
  const minute = Math.floor(rand() * 60)
  return new Date(year, month - 1, day, hour, minute, 0)
}

// ──────────────────────────────────────────────────────────────────
// Master data
// ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { name: 'Tech Queries', description: 'Software, system access, email, VPN, and hardware support' },
  { name: 'Accounting', description: 'Invoice queries, payments, expense reimbursements, and financial reports' },
  { name: 'Billing', description: 'Enrollment billing, rate adjustments, statements, and payment processing' },
  { name: 'Agency', description: 'Agency compliance, staff placement, contracts, and onboarding' },
]

const CATEGORIES: Record<string, Array<{ name: string; description: string }>> = {
  'Tech Queries': [
    { name: 'Software Issues', description: 'Application errors, crashes, and installation problems' },
    { name: 'System Access', description: 'Account creation, access revocation, and permission changes' },
    { name: 'Email & Communication', description: 'Email sync, Outlook config, and communication tools' },
    { name: 'VPN & Remote Access', description: 'VPN connectivity and remote desktop issues' },
    { name: 'Hardware Support', description: 'Printers, peripherals, and workstation problems' },
  ],
  'Accounting': [
    { name: 'Invoice Queries', description: 'Invoice discrepancies and billing questions' },
    { name: 'Payment Discrepancies', description: 'Missing or misapplied payments' },
    { name: 'Expense Reimbursements', description: 'Expense submission and reimbursement tracking' },
    { name: 'Financial Reports', description: 'Report access and data accuracy' },
    { name: 'Tax & Compliance', description: 'Tax documents and compliance queries' },
  ],
  'Billing': [
    { name: 'Billing Corrections', description: 'Statement corrections and adjustments' },
    { name: 'Enrollment Billing', description: 'New enrollment and billing sync issues' },
    { name: 'Monthly Statements', description: 'Statement generation and delivery' },
    { name: 'Rate Adjustments', description: 'Tuition rate changes and tier updates' },
    { name: 'Payment Processing', description: 'ACH, credit card, and manual payment issues' },
  ],
  'Agency': [
    { name: 'Agency Compliance', description: 'Staff ratios, background checks, and compliance' },
    { name: 'Staff Placement', description: 'New placements and replacements' },
    { name: 'Contract Updates', description: 'Contract amendments and renewals' },
    { name: 'Agency Onboarding', description: 'New agency vendor setup' },
  ],
}

const MANAGERS = [
  { firstName: 'Shivakumar', lastName: 'Aitharaju', email: 'shivakumar.aitharaju@asaind.co.in', dept: 'Tech Queries', role: UserRole.Manager },
  { firstName: 'Nitesh', lastName: 'Gupta', email: 'nitesh.gupta@asaind.co.in', dept: 'Accounting', role: UserRole.Manager },
  { firstName: 'Deepak', lastName: 'Khatri', email: 'deepak.khatri@asaind.co.in', dept: 'Billing', role: UserRole.Manager },
  { firstName: 'Manish', lastName: 'Karande', email: 'manish.karande@asaind.co.in', dept: 'Agency', role: UserRole.Manager },
  { firstName: 'Harsh', lastName: 'Agrawal', email: 'harsh.agrawal@asaind.co.in', dept: null, role: UserRole.Manager },
  { firstName: 'Kriyesh', lastName: 'Shetty', email: 'kriyesh.shetty@asaind.co.in', dept: null, role: UserRole.Manager },
]

const AGENTS: Array<{ firstName: string; lastName: string; email: string; dept: string }> = [
  // Tech Queries
  { firstName: 'Aryan', lastName: 'Ankushrao', email: 'aryan.ankushrao@asaind.co.in', dept: 'Tech Queries' },
  { firstName: 'Manthan', lastName: 'Mohite', email: 'manthan.mohite@asaind.co.in', dept: 'Tech Queries' },
  // Accounting
  { firstName: 'Gaurav', lastName: 'Nandivadekar', email: 'gaurav.nandivadekar@asaind.co.in', dept: 'Accounting' },
  { firstName: 'Neha', lastName: 'Falaskar', email: 'neha.falaskar@asaind.co.in', dept: 'Accounting' },
  { firstName: 'Pratham', lastName: 'Doshi', email: 'pratham.doshi@asaind.co.in', dept: 'Accounting' },
  { firstName: 'Anamika', lastName: 'Singh', email: 'anamika.singh@asaind.co.in', dept: 'Accounting' },
  { firstName: 'Kasthuridevi', lastName: 'Rao', email: 'kasthuridevi.rao@asaind.co.in', dept: 'Accounting' },
  { firstName: 'Prajakta', lastName: 'Sarang', email: 'prajakta.sarang@asaind.co.in', dept: 'Accounting' },
  // Billing
  { firstName: 'Sayali', lastName: 'Gurav', email: 'sayali.gurav@asaind.co.in', dept: 'Billing' },
  { firstName: 'Harsha', lastName: 'Kothari', email: 'harsha.kothari@asaind.co.in', dept: 'Billing' },
  { firstName: 'Priyanka', lastName: 'Padwal', email: 'priyanka.padwal@asaind.co.in', dept: 'Billing' },
  // Agency
  { firstName: 'Ritesh', lastName: 'Mhatre', email: 'ritesh.mhatre@asaind.co.in', dept: 'Agency' },
  { firstName: 'Shraddha', lastName: 'Kadam', email: 'shraddha.kadam@asaind.co.in', dept: 'Agency' },
  { firstName: 'Shubhada', lastName: 'Bhosle', email: 'shubhada.bhosle@asaind.co.in', dept: 'Agency' },
]

const CENTERS = [
  { name: 'Ramsey', state: 'NJ', entity: 'CSI' },
  { name: 'Ledgewood', state: 'NJ', entity: 'CSI' },
  { name: 'Foxboro', state: 'MA', entity: 'NVK' },
  { name: 'Littleton', state: 'MA', entity: 'NVK' },
  { name: 'Milford', state: 'MA', entity: 'NVK' },
  { name: 'East Brunswick', state: 'NJ', entity: 'CSI' },
  { name: 'River Vale', state: 'NJ', entity: 'CSI' },
  { name: 'Billerica', state: 'MA', entity: 'NVK' },
  { name: 'Owings Mills', state: 'MD', entity: 'CSI' },
  { name: 'Rohnert Park', state: 'CA', entity: 'NVK' },
  { name: 'Arvada West', state: 'CO', entity: 'NVK' },
  { name: 'Upper West Side', state: 'NY', entity: 'CSI' },
  { name: 'Santa Clarita', state: 'CA', entity: 'NVK' },
  { name: 'Andover', state: 'MA', entity: 'NVK' },
  { name: 'Huntington Beach', state: 'CA', entity: 'NVK' },
  { name: 'Torrance', state: 'CA', entity: 'NVK' },
  { name: 'Dedham', state: 'MA', entity: 'NVK' },
  { name: "Hell's Kitchen", state: 'NY', entity: 'CSI' },
  { name: 'Franklin Shadow', state: 'TN', entity: 'NVK' },
  { name: 'Germantown', state: 'TN', entity: 'NVK' },
  { name: 'Collierville', state: 'TN', entity: 'NVK' },
  { name: 'Ashburn', state: 'VA', entity: 'CSI' },
  { name: 'Timnath', state: 'CO', entity: 'NVK' },
  { name: 'Clovis', state: 'CA', entity: 'NVK' },
  { name: 'Bakersfield', state: 'CA', entity: 'NVK' },
  { name: 'Tuckahoe', state: 'NY', entity: 'CSI' },
  { name: 'Newark', state: 'DE', entity: 'CSI' },
  { name: 'Loveland', state: 'CO', entity: 'NVK' },
  { name: 'Manassas', state: 'VA', entity: 'CSI' },
  { name: 'Bushwick', state: 'NY', entity: 'CSI' },
  { name: 'Elk Grove', state: 'CA', entity: 'NVK' },
  { name: 'Hudson Yards', state: 'NY', entity: 'CSI' },
  { name: 'Bristow', state: 'VA', entity: 'CSI' },
  { name: 'Spring Hill', state: 'TN', entity: 'NVK' },
  { name: 'Fresno', state: 'CA', entity: 'NVK' },
  { name: 'Columbus Circle', state: 'NY', entity: 'CSI' },
  { name: 'Newbury Park', state: 'CA', entity: 'NVK' },
  { name: 'Sterling', state: 'VA', entity: 'CSI' },
  { name: 'Franklin', state: 'MA', entity: 'NVK' },
  { name: 'Gainesville', state: 'VA', entity: 'CSI' },
  { name: 'Natick', state: 'MA', entity: 'NVK' },
]

// ──────────────────────────────────────────────────────────────────
// Ticket templates
// ──────────────────────────────────────────────────────────────────

const TICKETS: Record<string, Array<{ subject: string; description: string; catIndex: number }>> = {
  'Tech Queries': [
    { subject: 'Unable to access the billing portal', description: 'Hi, I am unable to log into the ASAIND billing portal. Getting a "403 Forbidden" error after entering my credentials. This has been happening since this morning.', catIndex: 0 },
    { subject: 'Login credentials not working after password change', description: 'I reset my password last night using the reset link, but now I cannot log in with the new password. The system says "Invalid credentials". Please help urgently.', catIndex: 1 },
    { subject: 'Email not syncing with Outlook', description: 'My Outlook is not receiving any new emails from the ASAIND domain since yesterday afternoon. Sent items are going out fine but incoming emails are stuck.', catIndex: 2 },
    { subject: 'VPN disconnecting every 15 minutes', description: 'The GlobalProtect VPN keeps disconnecting every 10-15 minutes during work hours. This is causing disruption in accessing internal systems. Issue started after the recent Windows update.', catIndex: 3 },
    { subject: 'Printer not showing on network', description: 'The shared office printer is no longer visible on the network after we moved to the new router. Other computers can see it but mine cannot. Can you help reconnect it?', catIndex: 4 },
    { subject: 'Enrollment report CSV export is blank', description: 'When I try to export the monthly enrollment report as a CSV file, the downloaded file is empty. The preview shows data correctly but the export fails. This is needed for month-end processing.', catIndex: 0 },
    { subject: 'Two-factor authentication SMS not received', description: 'The 2FA verification code SMS is not being delivered to my phone. I have tried 5 times in the last 30 minutes. My phone number is correct in the profile. Cannot access the portal at all.', catIndex: 1 },
    { subject: 'Dashboard timing out with loading error', description: 'The main dashboard is taking more than 2 minutes to load and then showing a timeout error. Other sections of the portal work fine. This started happening on Monday.', catIndex: 0 },
    { subject: 'Cannot upload enrollment documents', description: 'When trying to upload enrollment documents (PDF, max 5MB), the upload progress bar stalls at 95% and then fails. I have tried on Chrome and Edge browsers.', catIndex: 0 },
    { subject: 'SSL certificate error on portal login page', description: 'Getting "Your connection is not private" (ERR_CERT_DATE_INVALID) when navigating to the portal. This is happening on all browsers. Started today.', catIndex: 0 },
    { subject: 'Auto-login session expires too quickly', description: 'My login session keeps expiring after just a few minutes of inactivity, forcing me to log in repeatedly throughout the day. This is very disruptive for daily operations.', catIndex: 1 },
    { subject: 'New staff account creation request', description: 'We have a new center director starting on Monday. Please create a portal account for her: Sarah Mitchell, sarah.mitchell@[center].com. She needs access to the enrollment and billing modules.', catIndex: 1 },
    { subject: 'Access revocation for departed staff member', description: 'Our previous assistant director, John Cooper, left the company last Friday. Please revoke all portal access for john.cooper@[center].com immediately.', catIndex: 1 },
    { subject: 'Enrollment data export producing wrong date range', description: 'When I set the date range filter to Q1 2026 and export, the resulting file shows October 2025 data instead. The filter seems to be broken on the export side.', catIndex: 0 },
    { subject: 'Remote access tool not connecting', description: 'I am working from home today and the remote access tool (Remote Desktop) is not connecting to the office workstation. Getting "Remote Desktop cannot connect to the remote computer" error.', catIndex: 3 },
    { subject: 'Screen sharing not working for virtual meeting', description: 'During our weekly team meeting on Teams, I was unable to share my screen. The share button was greyed out. My Teams is up to date. Other participants could share fine.', catIndex: 2 },
    { subject: 'Password reset link expired before use', description: 'I received the password reset email but the link expired before I could use it. I was on a call when the email arrived. Can you send a new reset link or extend the expiry time?', catIndex: 1 },
    { subject: 'Multi-tab usage logging out of session', description: 'When I open the portal in multiple browser tabs to work on enrollment and billing simultaneously, the system logs me out after switching between tabs. This is a major workflow issue.', catIndex: 1 },
    { subject: 'Enrollment module search results not loading', description: 'The search results in the enrollment module are not loading. I type in a child name and press search, but the results spinner never stops. Console shows a 500 error.', catIndex: 0 },
    { subject: 'New iPad not able to connect to office WiFi', description: 'We received a new iPad for the front desk. It is not connecting to the office WiFi network. Other devices connect fine. The iPad shows the network but fails to authenticate.', catIndex: 4 },
    { subject: 'Staff permissions not updated after role change', description: 'One of our staff members was promoted to Assistant Director last week. Her portal permissions have not been updated to reflect her new access level despite the HR ticket being closed.', catIndex: 1 },
    { subject: 'Bulk enrollment import template failing', description: 'The bulk enrollment import template I downloaded from the portal is not being accepted when I try to upload it. Error says "Invalid template version." Please provide the latest template.', catIndex: 0 },
    { subject: 'Email notifications not arriving for enrollment updates', description: 'We used to receive automatic email notifications whenever an enrollment was updated or confirmed. These stopped arriving about two weeks ago. Our notification settings appear correct.', catIndex: 2 },
    { subject: 'Keyboard shortcut for report download not working', description: 'The Ctrl+D keyboard shortcut that used to trigger the report download no longer works. The regular download button still works but the shortcut was much faster for our workflow.', catIndex: 0 },
    { subject: 'Portal login page not loading on Safari', description: 'Safari browser on MacOS shows a blank white page when navigating to the portal login URL. Chrome and Firefox work fine on the same computer. Safari is version 17.', catIndex: 0 },
    { subject: 'Permission denied when accessing financial reports', description: 'After the system maintenance last weekend, I can no longer access the financial reports section. I had access before. My role has not changed. Error says "403 - Access Denied".', catIndex: 1 },
    { subject: 'Slow system performance on enrollment module', description: 'The enrollment module has been very slow this week. Simple operations like adding a new child take 30+ seconds to save. This is impacting our enrollment team productivity significantly.', catIndex: 0 },
    { subject: 'Calendar sync not working with Google Calendar', description: 'The portal calendar is no longer syncing with Google Calendar. Events created in the portal do not appear in our center Google Calendar. The sync was working fine last month.', catIndex: 2 },
    { subject: 'Staff forgot security questions for account recovery', description: 'A staff member locked herself out of her account and cannot remember her security questions. Please reset her account. Email: staff member contact provided in attached note.', catIndex: 1 },
    { subject: 'Report filter saving not persisting', description: 'When I save a custom filter configuration for reports, it resets the next day. I have to set up the filters manually every morning which takes significant time.', catIndex: 0 },
  ],
  'Accounting': [
    { subject: 'Invoice showing incorrect amount for January', description: 'Invoice INV-2026-0142 for January 2026 shows $4,850 but our agreed rate per the contract is $4,600 per month. Please review and issue a corrected invoice.', catIndex: 0 },
    { subject: 'Payment from December not reflected in account', description: 'We submitted a wire transfer payment of $4,600 on December 28, 2025 (reference: WT-DEC-28-001). This payment has not appeared on our January statement. Please investigate.', catIndex: 1 },
    { subject: 'Expense reimbursement pending for 45 days', description: 'My expense reimbursement request ER-2025-0891 (submitted November 12, 2025) has been approved by my manager but the payment has not arrived. Amount: $342.50. Bank details on file.', catIndex: 2 },
    { subject: 'Account balance discrepancy on February statement', description: 'Our February 2026 account balance shows $1,200 more than expected. We have attached a reconciliation spreadsheet showing what we believe is a duplicate charge from January 31.', catIndex: 3 },
    { subject: 'W-9 form request for vendor filing', description: 'We need a W-9 form for ASAIND as part of our year-end 1099 vendor reporting. Our accounting team needs this before the February 10 IRS deadline.', catIndex: 4 },
    { subject: 'Enrollment fee charged twice for same child', description: 'Child: Emma Rodriguez, DOB: March 15, 2022 – enrollment fee of $150 was charged twice on January 15, 2026. Please issue a credit for the duplicate charge on our next statement.', catIndex: 0 },
    { subject: 'Credit memo not applied to current statement', description: 'Credit memo CM-2025-1102 issued on December 10, 2025 (amount: $220) has not been applied to our January or February statements. This credit was for an overbilling correction.', catIndex: 0 },
    { subject: 'Refund not processed after temporary closure', description: 'Our center was temporarily closed from January 20-24, 2026 due to a water main break. We submitted a closure notice on January 20 requesting a credit for those 5 days. No credit received.', catIndex: 1 },
    { subject: 'February monthly statement not received', description: 'We have not received our February 2026 monthly statement. Our statement is typically delivered by the 5th of the following month. Today is March 8 and it has not arrived by email or mail.', catIndex: 3 },
    { subject: 'Late fee waiver request - system error caused delay', description: 'A $50 late fee was applied to our account for March 2026. Our payment was delayed because the online payment portal was down on the due date (March 1). We have a screenshot as evidence.', catIndex: 0 },
    { subject: 'Subsidy calculation appears incorrect for February', description: 'Our Medicaid subsidy for February appears to be $180 less than the expected amount per our subsidy agreement. Per our contract, the subsidy should cover 65% of enrollment fees for qualified children.', catIndex: 4 },
    { subject: 'Annual account statement request for 2025', description: 'Our center needs a complete annual account statement for the 2025 calendar year (January 1 to December 31, 2025) for our year-end financial audit. Please provide in PDF format.', catIndex: 3 },
    { subject: 'Wire transfer matched to wrong account', description: 'A wire transfer of $4,600 sent on February 14, 2026 (wire reference: WR-0214-CSI-042) appears to have been applied to a different center account. Our account still shows a balance due.', catIndex: 1 },
    { subject: 'Invoice not matching PO for agency services', description: 'Invoice INV-2026-0198 for agency services does not match our approved Purchase Order PO-2026-011. The invoice total is $1,200 higher than the PO amount. Cannot process payment without clarification.', catIndex: 0 },
    { subject: 'Expense report form not accessible', description: 'The expense report submission form in the portal is showing a "Form temporarily unavailable" message. I need to submit March expenses before the end of the week for the monthly cutoff.', catIndex: 2 },
    { subject: 'Request for aging report copy', description: 'We would like a copy of our current aging report as of March 31, 2026. Our new director needs this for a financial review meeting with the regional office on April 8.', catIndex: 3 },
    { subject: 'Incorrect late billing rate applied', description: 'The late billing rate applied to our account shows $12.50/hour but our contract specifies $11.00/hour effective January 1, 2026. This difference has accumulated over 3 months of statements.', catIndex: 0 },
    { subject: 'Missing reimbursement for professional development', description: 'Professional development reimbursement for $475 (attended ECE conference on February 5-6) was approved by regional director on February 20 but not yet reimbursed. Submission ID: PD-2026-034.', catIndex: 2 },
    { subject: 'Tax exemption certificate needed for new vendor', description: 'We need ASAIND tax exemption certificate for our state to avoid being charged sales tax on our software subscription renewal. Please provide the certificate for NJ state.', catIndex: 4 },
    { subject: 'Account statement shows 3 extra enrollment days', description: 'Our April statement shows 3 additional enrollment days (April 28-30) that were not authorized. These dates fall on state holidays when our center was closed. Please remove these charges.', catIndex: 0 },
    { subject: 'Payment plan request for overdue balance', description: 'We have an overdue balance of $2,400 from Q4 2025 due to enrollment shortfall. We would like to request a 6-month payment plan to settle this balance. Can you arrange a call to discuss?', catIndex: 1 },
    { subject: 'Budget variance report for Q1 2026', description: 'Could you please provide a budget variance report comparing Q1 2026 actual costs against the projected budget? We need this for our quarterly board meeting on April 15.', catIndex: 3 },
    { subject: 'Invoice issued to wrong legal entity', description: 'Invoice INV-2026-0221 was issued to "CSI Centers LLC" but should be issued to "Child Success Inc." as per our contract. Please reissue with the correct entity name for our accounting records.', catIndex: 0 },
    { subject: 'Reimbursement for center emergency supplies', description: 'Emergency supply purchase of $680 (receipts attached) was made on February 28 after a plumbing emergency. Prior approval was given verbally by the regional manager. Requesting reimbursement.', catIndex: 2 },
    { subject: 'Early billing rate change not reflected in March', description: 'The new early billing rate of $8.50/hour (effective March 1, 2026 per our contract amendment) has not been applied to the March statement. Still showing old rate of $9.00/hour.', catIndex: 0 },
    { subject: 'Request for enrollment count verification', description: 'Our enrollment count on the March statement shows 42 children but our internal records show 45. Please provide a breakdown of enrolled children for March 2026 to reconcile the discrepancy.', catIndex: 3 },
    { subject: 'Overcharge identified on staff reimbursement', description: 'Staff reimbursement ER-2026-044 was processed for $520 but the correct amount should be $450 per the approved expense report. Please issue a recovery request for the $70 overpayment.', catIndex: 2 },
    { subject: 'Missing credit for waitlist child non-enrollment', description: 'Child on waitlist (L. Peterson) was confirmed enrolled in our January billing but never actually started. The enrollment should have been cancelled. Please remove from January and February billing.', catIndex: 0 },
    { subject: 'Agency invoice in dispute - services not rendered', description: 'Agency invoice INV-AG-2026-019 for $1,800 covers the week of March 10-14. Agency staff did not report on March 11 and 12 (verified by center sign-in logs). Requesting reduction of $720.', catIndex: 0 },
    { subject: 'Request for year-to-date financial summary', description: 'We need a year-to-date financial summary (January 1 – April 30, 2026) showing total charges, payments, credits, and current balance for our budget review meeting with the board.', catIndex: 3 },
    { subject: 'Duplicate payment received - requesting refund', description: 'We accidentally processed our April payment twice via ACH on April 2 and April 3. Total overpayment: $4,600. Please confirm receipt and arrange a refund to our account on file.', catIndex: 1 },
    { subject: 'Late payment notification received in error', description: 'Received an overdue payment notice for our account despite making our payment on the due date. Bank confirmation reference: ACH-2026-0301-4892. Please update account status and remove any late fees.', catIndex: 1 },
    { subject: 'Request for amended invoice - different billing period', description: 'Invoice INV-2026-0245 covers March 1-31 but we closed for renovation from March 15-20 (6 days). Per our agreement, non-operational days are excluded. Please issue an amended invoice.', catIndex: 0 },
    { subject: 'Scholarship discount not applied for Q1', description: 'We have 3 children on financial assistance scholarships (25% discount). This discount was correctly applied in Q4 2025 but has not appeared on Q1 2026 statements. Please review.', catIndex: 0 },
    { subject: 'Quarterly summary report for parent board', description: 'Our parent board meets next week and needs a quarterly financial summary for Q1 2026. Specifically: enrollment revenue, subsidy amounts, and agency costs. Can you generate this report?', catIndex: 3 },
    { subject: 'Check payment not cleared after 3 weeks', description: 'Check #4821 for $4,600 was mailed on March 1, 2026 but has not cleared our account yet. Please confirm if received and being processed. We can stop payment and reissue if lost.', catIndex: 1 },
  ],
  'Billing': [
    { subject: 'February statement total is incorrect', description: 'Our February 2026 statement shows a total of $5,240 but based on our enrollment records (38 full-time, 4 part-time) the expected amount should be approximately $4,890. Please review.', catIndex: 0 },
    { subject: 'Enrollment not updating in billing system', description: 'We enrolled 3 new children on January 28, 2026. Their names are Marcus Webb, Lily Chen, and Noah Park. They do not appear in the February billing statement. Please add them to the billing system.', catIndex: 1 },
    { subject: 'January rate change not reflected in February billing', description: 'Per our contract amendment effective January 1, 2026, the monthly rate per full-time child increased from $1,100 to $1,150. The February statement still shows the old rate of $1,100.', catIndex: 2 },
    { subject: 'Withdrawn child still appearing in billing', description: 'Child: Alex Thompson (DOB: July 12, 2021) was withdrawn from enrollment on February 7, 2026. He still appears on the March statement. Withdrawal form was submitted on February 6.', catIndex: 0 },
    { subject: 'Center closure credit not applied', description: 'We submitted a center closure notice for February 8-9 (snow emergency). Per our agreement, we receive a credit for each closure day. The February statement does not show this credit.', catIndex: 0 },
    { subject: 'Medicaid subsidy billing needs update', description: 'Two children in our program (A. Martinez and D. Johnson) qualified for Medicaid subsidy starting February 1, 2026. Billing should reflect the subsidized rate. Current statement shows full rate.', catIndex: 0 },
    { subject: 'Mid-month enrollment prorated billing issue', description: 'Child Sophia Williams enrolled on January 15, 2026. The January statement shows a full month charge instead of a prorated amount (half month = $575 based on $1,150/month rate).', catIndex: 1 },
    { subject: 'Duplicate enrollment showing on statement', description: 'Child: Jake Rivera (DOB: Sept 3, 2022) appears twice on the March statement. He was enrolled once with two different enrollment IDs (EN-2026-0412 and EN-2026-0489). Please remove the duplicate.', catIndex: 1 },
    { subject: 'New enrollment not appearing in billing', description: 'We enrolled Emily Foster on April 1, 2026. It is now April 10 and she has not appeared in any billing preview. Enrollment form was submitted and confirmed via email. Enrollment ID: EN-2026-0512.', catIndex: 1 },
    { subject: 'Billing cycle shows wrong month-end date', description: 'Our April statement billing cycle shows March 28 – April 27 instead of April 1 – April 30. This one-day discrepancy has been causing enrollment count mismatches for the past three months.', catIndex: 2 },
    { subject: 'Center overpaid last month - requesting credit', description: 'Due to an accounting error on our end, we overpaid our February invoice by $350. Please apply this overpayment as a credit to our March invoice rather than issuing a refund check.', catIndex: 0 },
    { subject: 'Wrong tuition rate tier applied for full-time child', description: 'Child: Oliver Greene (full-time, age 3) is being billed at the infant rate ($1,250/month) instead of the preschool rate ($1,100/month). He turned 2.5 in December and should have moved to the lower tier.', catIndex: 2 },
    { subject: 'Billing report missing 3 enrollments for February', description: 'When we downloaded the February enrollment report, only 39 children were listed. Our records show 42 enrolled children. The 3 missing children are: R. Kim, B. Patel, and T. Johnson (enrollment IDs in attachment).', catIndex: 2 },
    { subject: 'Waitlist conversion billing not triggered', description: 'Child Mia Santos was converted from waitlist to enrolled status on March 5, 2026. Billing was not generated for her March enrollment. The system shows her as "enrolled" but she is not on the March statement.', catIndex: 1 },
    { subject: 'Part-time to full-time upgrade not reflected', description: 'As of February 1, 2026, child Connor Murphy was upgraded from part-time (3 days/week) to full-time (5 days/week). The February statement still charges the part-time rate.', catIndex: 1 },
    { subject: 'State subsidy amount changed - billing not updated', description: 'Effective March 1, 2026, the Colorado state childcare subsidy amount increased by $50 per child per month. We have 6 state-subsidized children. The March statement does not reflect the updated subsidy.', catIndex: 2 },
    { subject: 'Manual billing adjustment request for closure week', description: 'Our center was closed the week of January 6-10, 2026 for staff training (approved by ASAIND regional manager). We need a manual billing adjustment for those 5 days across all 40 enrolled children.', catIndex: 0 },
    { subject: 'Billing contact updated - resend current statements', description: 'Our billing contact has changed. New contact: Patricia Lane, p.lane@[center].com. Please update the billing records and resend the last 3 months of statements to the new contact.', catIndex: 2 },
    { subject: 'April statement sent to old email address', description: 'The April 2026 statement was sent to our former director (retired February 28). Please resend to our current director: Director contact info in portal profile. Also please update email for future statements.', catIndex: 2 },
    { subject: 'Extra day fee not shown on statement breakdown', description: 'Per our contract, children attending on Friday (optional extra day) are billed at $65/day. We had 8 children attend on 3 Fridays in March but the statement does not show these extra day charges.', catIndex: 2 },
    { subject: 'New enrollment backdating request', description: 'Child Ava Johnson has been attending since January 6 but her official enrollment start date was erroneously entered as January 13. Please backdate the enrollment to January 6 and adjust billing accordingly.', catIndex: 1 },
    { subject: 'Enrollment status showing "pending" for 3 weeks', description: 'Three children enrolled on April 8 still show status "pending enrollment confirmation" in the portal. Families have paid deposits. We cannot finalize billing setup until enrollment is confirmed.', catIndex: 1 },
    { subject: 'Credit for holiday closures not reflected', description: 'MLK Day (January 20) and Presidents Day (February 17) are contractual holidays. Billing credits for these 2 days have not been applied to either January or February statements.', catIndex: 0 },
    { subject: 'Billing rate schedule not matching contract', description: 'Our current billing rate schedule in the portal shows rates from our 2024 contract. Per our 2026 renewal signed November 2025, rates increased. Please update the billing rate schedule in the system.', catIndex: 2 },
    { subject: 'End-of-month reconciliation report needed', description: 'We need the end-of-month billing reconciliation report for March 2026 to compare against our internal accounting system. Please generate and send the detailed reconciliation report.', catIndex: 2 },
  ],
  'Agency': [
    { subject: 'Agency staff no-show on Tuesday morning', description: 'Our assigned agency staff member (placement for Lead Teacher position) did not report to work on Tuesday, March 4, 2026 without any prior notice. This left us short-staffed during morning drop-off.', catIndex: 0 },
    { subject: 'Contract renewal documentation needed for April', description: 'Our agency staffing contract (Contract ID: AG-CSI-2025-042) expires on March 31, 2026. We have not received renewal documentation yet. Please initiate the renewal process immediately.', catIndex: 2 },
    { subject: 'Incorrect agency hours submitted for week of March 10', description: 'The agency timesheet submitted for the week of March 10-14 shows 45 hours for placement staff. Our sign-in logs confirm only 38 hours were worked. Please review and correct the invoice.', catIndex: 0 },
    { subject: 'New agency vendor onboarding documentation', description: 'We have been approved to onboard "Bright Future Staffing" as a new agency vendor. Please send the required documentation checklist for vendor onboarding and compliance verification.', catIndex: 3 },
    { subject: 'Agency staff performance concern from center director', description: 'Our center director has raised concerns about the reliability and communication skills of the current agency placement. This is the second incident this month. We need to discuss a performance review or replacement.', catIndex: 1 },
    { subject: 'Temporary staff needed for Spring Break week', description: 'Our regular staff will be at reduced capacity during Spring Break (March 24-28). We need 2 additional temporary agency staff for that week. Minimum qualification: 2 years ECE experience.', catIndex: 1 },
    { subject: 'Agency invoice discrepancy for March 2026', description: 'Agency invoice INV-AG-2026-031 for March 2026 totals $3,200 but our calculations based on approved hours (80 hours × $35/hr) should be $2,800. Please review the invoice and provide itemized breakdown.', catIndex: 0 },
    { subject: 'Background check status for new placement', description: 'New agency placement (name provided in secure channel) is scheduled to start March 18. We need confirmation that the background check has been completed and cleared per our state licensing requirements.', catIndex: 0 },
    { subject: 'Agency contract amendment - change in scope', description: 'We need to amend our agency contract to add 10 additional weekly hours for our newly approved After School program starting April 1, 2026. Please prepare an amendment to Contract AG-NVK-2026-008.', catIndex: 2 },
    { subject: 'Complaint regarding agency staff conduct', description: 'A parent filed a complaint regarding an agency staff member behavior during dismissal on February 26. We have documented the incident. This needs to be escalated to agency management for formal review.', catIndex: 0 },
    { subject: 'Agency substitution provided without advance notice', description: 'On April 7, a different agency staff member showed up instead of our regular placement. No advance notice was given. This caused confusion during licensing inspection. Please review communication protocol.', catIndex: 1 },
    { subject: 'Request for additional agency hours for summer', description: 'Our summer enrollment increases significantly. We need to expand agency coverage from 30 to 50 hours per week starting June 1. Please advise on availability and any rate changes for extended coverage.', catIndex: 1 },
    { subject: 'Agency staff ratio not maintained on April 3', description: 'On April 3, 2026, the agency placement called out sick and no substitute was provided. This caused us to fall below required staff-to-child ratios for 2 hours until we arranged internal coverage. This is a licensing risk.', catIndex: 0 },
    { subject: 'Background check renewal needed for compliance', description: 'Agency staff member placed at our center has a background check expiring April 30, 2026. State licensing requires renewal 30 days before expiration. Please initiate the renewal process immediately.', catIndex: 0 },
    { subject: 'Billing for agency overtime hours not approved', description: 'The April agency invoice includes $450 in overtime charges. Our contract states that overtime must be pre-approved in writing. We have no record of approving overtime for April. Please remove from invoice.', catIndex: 0 },
  ],
}

// Status distribution by month index (0=Jan, 1=Feb, 2=Mar, 3=Apr, 4=May)
const STATUS_POOLS: TicketStatus[][] = [
  // January: mostly closed
  [...Array(70).fill(TicketStatus.Closed), ...Array(25).fill(TicketStatus.Resolved), ...Array(5).fill(TicketStatus.PendingClient)],
  // February: mostly closed
  [...Array(65).fill(TicketStatus.Closed), ...Array(25).fill(TicketStatus.Resolved), ...Array(10).fill(TicketStatus.PendingClient)],
  // March: mix
  [...Array(50).fill(TicketStatus.Closed), ...Array(25).fill(TicketStatus.Resolved), ...Array(15).fill(TicketStatus.InProgress), ...Array(10).fill(TicketStatus.Assigned)],
  // April: more open
  [...Array(35).fill(TicketStatus.Closed), ...Array(25).fill(TicketStatus.Resolved), ...Array(25).fill(TicketStatus.InProgress), ...Array(15).fill(TicketStatus.Assigned)],
  // May: fresh tickets
  [...Array(10).fill(TicketStatus.Closed), ...Array(15).fill(TicketStatus.Resolved), ...Array(30).fill(TicketStatus.InProgress), ...Array(25).fill(TicketStatus.Assigned), ...Array(20).fill(TicketStatus.Open)],
]

const PRIORITY_POOL: Priority[] = [
  ...Array(30).fill(Priority.Low),
  ...Array(50).fill(Priority.Medium),
  ...Array(15).fill(Priority.High),
  ...Array(5).fill(Priority.Critical),
]

// Per-month dept ticket counts — varied to produce realistic chart variation
// Jan:75  Feb:92  Mar:118  Apr:134  May:48
const MONTHLY_DIST: Array<Array<{ dept: string; count: number }>> = [
  [{ dept: 'Tech Queries', count: 22 }, { dept: 'Accounting', count: 27 }, { dept: 'Billing', count: 19 }, { dept: 'Agency', count: 7 }],
  [{ dept: 'Tech Queries', count: 27 }, { dept: 'Accounting', count: 33 }, { dept: 'Billing', count: 22 }, { dept: 'Agency', count: 10 }],
  [{ dept: 'Tech Queries', count: 35 }, { dept: 'Accounting', count: 43 }, { dept: 'Billing', count: 28 }, { dept: 'Agency', count: 12 }],
  [{ dept: 'Tech Queries', count: 40 }, { dept: 'Accounting', count: 48 }, { dept: 'Billing', count: 33 }, { dept: 'Agency', count: 13 }],
  [{ dept: 'Tech Queries', count: 14 }, { dept: 'Accounting', count: 17 }, { dept: 'Billing', count: 13 }, { dept: 'Agency', count: 4 }],
]

const RESOLUTION_MESSAGES: string[] = [
  'Issue has been investigated and resolved. Root cause identified and corrective action taken. Please test and confirm if you are still experiencing the problem.',
  'We have reviewed your case and applied the necessary corrections. The adjustment will reflect on your next statement. No further action required on your end.',
  'The issue has been resolved. We have updated the system records and the change will be reflected within 24 hours. Please verify at your earliest convenience.',
  'Thank you for your patience. We have corrected the discrepancy and the updated records are now available. Please review and let us know if everything looks accurate.',
  'Your request has been processed successfully. The necessary updates have been made in our system. Please verify within one business day and reach out if you notice any remaining issues.',
  'Investigation complete. We have identified the root cause and implemented a fix. The correction has been applied retroactively to ensure accuracy. Please confirm resolution.',
  'After thorough review, we have resolved the issue as requested. All corrections are now in effect. A confirmation email has been sent with the details of the changes made.',
]

const AGENT_RESPONSES: string[] = [
  'Thank you for reaching out. We have received your request and are looking into this. We will provide an update within 1 business day.',
  'I have reviewed your case and escalated it to our specialist team for further investigation. You can expect an update by end of business today.',
  'We have located the issue in our system. Our team is working on the correction and will have this resolved for you shortly.',
  'Thank you for providing those details. I have identified the root cause and am processing the correction now. Estimated resolution: 2-4 hours.',
  'I have reproduced the issue in our test environment and it is now being fixed by our technical team. We will notify you once the fix is deployed.',
  'Your case has been assigned to me. I will review all the relevant records and get back to you with a resolution plan within a few hours.',
  'I have confirmed the discrepancy you reported. Processing the adjustment now — it will be reflected within 1-2 business days.',
]

async function sampleData() {
  console.log('Connecting to database...')
  await AppDataSource.initialize()

  const deptRepo = AppDataSource.getRepository(Department)
  const catRepo = AppDataSource.getRepository(Category)
  const mappingRepo = AppDataSource.getRepository(CategoryDepartmentMapping)
  const userRepo = AppDataSource.getRepository(User)
  const ticketRepo = AppDataSource.getRepository(Ticket)
  const messageRepo = AppDataSource.getRepository(TicketMessage)
  const historyRepo = AppDataSource.getRepository(TicketStatusHistory)
  const assignmentRepo = AppDataSource.getRepository(TicketAssignment)
  const slaRepo = AppDataSource.getRepository(SLAConfiguration)
  const slaTrackRepo = AppDataSource.getRepository(SLATracking)

  // ──────────────────────────────────────────────────────────────
  // Step 1: Departments
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- Creating Departments ---')
  const deptMap: Record<string, Department> = {}
  for (const d of DEPARTMENTS) {
    let dept = await deptRepo.findOne({ where: { name: d.name } })
    if (!dept) {
      dept = await deptRepo.save(deptRepo.create(d))
      console.log(`  + ${d.name}`)
    } else {
      console.log(`  = ${d.name}`)
    }
    deptMap[d.name] = dept
  }

  // ──────────────────────────────────────────────────────────────
  // Step 2: Categories
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- Creating Categories ---')
  const catMap: Record<string, Record<number, Category>> = {}
  for (const [deptName, cats] of Object.entries(CATEGORIES)) {
    catMap[deptName] = {}
    const dept = deptMap[deptName]
    for (let i = 0; i < cats.length; i++) {
      const c = cats[i]
      let cat = await catRepo.findOne({ where: { name: c.name } })
      if (!cat) {
        cat = await catRepo.save(catRepo.create(c))
        console.log(`  + [${deptName}] ${c.name}`)
      }
      catMap[deptName][i] = cat
      if (dept) {
        const existing = await mappingRepo.findOne({ where: { categoryId: cat.id, departmentId: dept.id } })
        if (!existing) {
          await mappingRepo.save(mappingRepo.create({ categoryId: cat.id, departmentId: dept.id }))
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Step 3: SLA configs (reuse existing global ones)
  // ──────────────────────────────────────────────────────────────
  const slaConfigs = await slaRepo.find({ where: { isActive: true } })
  const slaByPriority: Record<Priority, SLAConfiguration | undefined> = {
    [Priority.Critical]: slaConfigs.find(s => s.priority === Priority.Critical),
    [Priority.High]: slaConfigs.find(s => s.priority === Priority.High),
    [Priority.Medium]: slaConfigs.find(s => s.priority === Priority.Medium),
    [Priority.Low]: slaConfigs.find(s => s.priority === Priority.Low),
  }

  // ──────────────────────────────────────────────────────────────
  // Step 4: Team members (managers + agents)
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- Creating Team Members ---')
  const DEFAULT_PASS = 'Asaind@2026'
  const hashedPass = await bcrypt.hash(DEFAULT_PASS, 10)

  const agentMap: Record<string, User[]> = {}
  for (const deptName of Object.keys(DEPARTMENTS.reduce((a, d) => ({ ...a, [d.name]: true }), {}))) {
    agentMap[deptName] = []
  }

  for (const m of MANAGERS) {
    let user = await userRepo.findOne({ where: { email: m.email } })
    if (!user) {
      user = await userRepo.save(userRepo.create({
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        role: m.role,
        password: hashedPass,
        departmentId: m.dept ? deptMap[m.dept]?.id ?? null : null,
        isActive: true,
        isEmailVerified: true,
      }))
      console.log(`  + Manager: ${m.firstName} ${m.lastName} (${m.dept ?? 'ALL'})`)
    }
  }

  for (const a of AGENTS) {
    let user = await userRepo.findOne({ where: { email: a.email } })
    if (!user) {
      user = await userRepo.save(userRepo.create({
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        role: UserRole.Agent,
        password: hashedPass,
        departmentId: deptMap[a.dept]?.id ?? null,
        isActive: true,
        isEmailVerified: true,
      }))
      console.log(`  + Agent:   ${a.firstName} ${a.lastName} (${a.dept})`)
    } else {
      console.log(`  = Agent:   ${a.firstName} ${a.lastName}`)
    }
    agentMap[a.dept] = agentMap[a.dept] ?? []
    agentMap[a.dept].push(user!)
  }

  // ──────────────────────────────────────────────────────────────
  // Step 5: Client users from centers
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- Creating Center Client Users ---')
  const clientUsers: User[] = []
  for (const center of CENTERS) {
    const emailBase = (center.name + '.' + center.state)
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.+/g, '.')
    const email = `${emailBase}@asaind.co.in`

    let user = await userRepo.findOne({ where: { email } })
    if (!user) {
      const nameParts = center.name.split(' ')
      user = await userRepo.save(userRepo.create({
        email,
        firstName: center.name,
        lastName: `(${center.entity})`,
        role: UserRole.Client,
        password: hashedPass,
        departmentId: null,
        isActive: true,
        isEmailVerified: true,
      }))
    }
    clientUsers.push(user!)
  }
  console.log(`  Created/verified ${clientUsers.length} center client users`)

  // ──────────────────────────────────────────────────────────────
  // Step 6: Tickets — 100/month Jan–May 2026
  // ──────────────────────────────────────────────────────────────
  console.log('\n--- Generating Tickets (varied/month × 5 months) ---')

  let ticketSeq = 1
  const existingCount = await ticketRepo.count()
  ticketSeq = existingCount + 1

  const MONTHS = [1, 2, 3, 4, 5] // Jan–May 2026

  for (let mIdx = 0; mIdx < MONTHS.length; mIdx++) {
    const month = MONTHS[mIdx]
    const rand = rng(month * 9973 + 1234)
    const statusPool = STATUS_POOLS[mIdx]
    const monthDist = MONTHLY_DIST[mIdx]
    const monthTotal = monthDist.reduce((s, d) => s + d.count, 0)
    let ticketsInMonth = 0
    let totalThisMonth = 0

    for (const { dept: deptName, count } of monthDist) {
      const dept = deptMap[deptName]
      if (!dept) continue
      const agents = agentMap[deptName] ?? []
      const templates = TICKETS[deptName] ?? []
      const cats = catMap[deptName] ?? {}

      for (let t = 0; t < count; t++) {
        const template = templates[t % templates.length]
        const priority = pick(PRIORITY_POOL, rand) as Priority
        const status = pick(statusPool, rand) as TicketStatus
        const client = pick(clientUsers, rand)
        const createdAt = randomDateInMonth(2026, month, totalThisMonth, monthTotal, rand)
        const ticketNum = `TKT-2026-${String(ticketSeq).padStart(5, '0')}`

        const isResolved = [TicketStatus.Resolved, TicketStatus.Closed].includes(status)
        const isAssigned = status !== TicketStatus.Open

        const assignedAgent = isAssigned && agents.length > 0
          ? agents[Math.floor(rand() * agents.length)]
          : null

        const firstResponseAt = isAssigned
          ? addMinutes(createdAt, 15 + Math.floor(rand() * 120))
          : null

        const resolvedAt = isResolved
          ? addMinutes(createdAt, 60 + Math.floor(rand() * 2880))
          : null

        const closedAt = status === TicketStatus.Closed && resolvedAt
          ? addMinutes(resolvedAt, 30 + Math.floor(rand() * 480))
          : null

        // Build subject/description with center name interpolated
        const centerName = client.firstName ?? 'the center'
        const subject = template.subject.replace('[center]', centerName)
        const description = template.description.replace(/\[center\]/g, centerName)

        const cat = cats[template.catIndex] ?? cats[0]
        if (!cat) continue

        // Create ticket
        const ticket = await ticketRepo.save(ticketRepo.create({
          ticketNumber: ticketNum,
          subject,
          description,
          status,
          priority,
          isEscalated: false,
          categoryId: cat.id,
          departmentId: dept.id,
          createdById: client.id,
          assignedToId: assignedAgent?.id ?? null,
          firstResponseAt,
          resolvedAt,
          closedAt,
          resolutionSummary: isResolved ? pick(RESOLUTION_MESSAGES, rand) : null,
        }))

        // Manually set createdAt via raw query (TypeORM uses DEFAULT)
        await AppDataSource.query(
          `UPDATE tickets SET created_at = $1, updated_at = $2 WHERE id = $3`,
          [createdAt, closedAt ?? resolvedAt ?? createdAt, ticket.id]
        )

        // Status history
        const histories: Partial<TicketStatusHistory>[] = [
          { ticketId: ticket.id, fromStatus: undefined, toStatus: TicketStatus.Open, changedById: client.id }
        ]
        if (isAssigned && assignedAgent) {
          histories.push({ ticketId: ticket.id, fromStatus: TicketStatus.Open, toStatus: TicketStatus.Assigned, changedById: assignedAgent.id })
        }
        if ([TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Closed].includes(status) && assignedAgent) {
          histories.push({ ticketId: ticket.id, fromStatus: TicketStatus.Assigned, toStatus: TicketStatus.InProgress, changedById: assignedAgent.id })
        }
        if (isResolved && assignedAgent) {
          histories.push({ ticketId: ticket.id, fromStatus: TicketStatus.InProgress, toStatus: TicketStatus.Resolved, changedById: assignedAgent.id })
        }
        if (status === TicketStatus.Closed && assignedAgent) {
          histories.push({ ticketId: ticket.id, fromStatus: TicketStatus.Resolved, toStatus: TicketStatus.Closed, changedById: assignedAgent.id })
        }
        for (const h of histories) {
          await historyRepo.save(historyRepo.create(h as any))
        }

        // Assignment record
        if (isAssigned && assignedAgent) {
          const systemUser = await userRepo.findOne({ where: { role: UserRole.Admin } })
          await assignmentRepo.save(assignmentRepo.create({
            ticketId: ticket.id,
            assignedToId: assignedAgent.id,
            assignedById: systemUser?.id ?? assignedAgent.id,
          }))
        }

        // Messages
        // 1. Initial client message (the ticket description itself)
        const initMsg = messageRepo.create({
          ticketId: ticket.id,
          authorId: client.id,
          content: description,
          isClientFacing: true,
        })
        await AppDataSource.query(
          `INSERT INTO ticket_messages (ticket_id, author_id, content, is_client_facing, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$5)`,
          [ticket.id, client.id, description, true, createdAt]
        )

        // 2. Agent acknowledgement
        if (isAssigned && assignedAgent && firstResponseAt) {
          const ackContent = pick(AGENT_RESPONSES, rand)
          await AppDataSource.query(
            `INSERT INTO ticket_messages (ticket_id, author_id, content, is_client_facing, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$5)`,
            [ticket.id, assignedAgent.id, ackContent, true, firstResponseAt]
          )
        }

        // 3. Resolution message
        if (isResolved && assignedAgent && resolvedAt) {
          const resContent = pick(RESOLUTION_MESSAGES, rand)
          await AppDataSource.query(
            `INSERT INTO ticket_messages (ticket_id, author_id, content, is_client_facing, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$5)`,
            [ticket.id, assignedAgent.id, resContent, true, resolvedAt]
          )
        }

        // SLA Tracking
        const slaConfig = slaByPriority[priority]
        if (slaConfig) {
          const frDue = addMinutes(createdAt, slaConfig.firstResponseMinutes)
          const resDue = addMinutes(createdAt, slaConfig.resolutionMinutes)

          let slaStatus: SLAStatus
          if (isResolved) {
            slaStatus = resolvedAt && resolvedAt <= resDue ? SLAStatus.Met : SLAStatus.Breached
          } else {
            const now = new Date()
            slaStatus = now > resDue ? SLAStatus.Breached : now > addMinutes(resDue, -60) ? SLAStatus.AtRisk : SLAStatus.OnTrack
          }

          await slaTrackRepo.save(slaTrackRepo.create({
            ticketId: ticket.id,
            slaConfigId: slaConfig.id,
            firstResponseDue: frDue,
            resolutionDue: resDue,
            firstResponseMet: firstResponseAt ? firstResponseAt <= frDue : null,
            firstResponseAt: firstResponseAt ?? undefined,
            resolutionMet: isResolved ? (resolvedAt! <= resDue) : null,
            resolvedAt: resolvedAt ?? undefined,
            status: slaStatus,
            totalPausedMinutes: 0,
          }))
        }

        ticketSeq++
        ticketsInMonth++
        totalThisMonth++
      }
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    console.log(`  ${monthNames[mIdx]} 2026: ${ticketsInMonth} tickets created`)
  }

  console.log('\n✅ Sample data complete!')
  console.log('\nSummary:')
  console.log(`  Departments : ${Object.keys(deptMap).length} new`)
  console.log(`  Categories  : ${Object.values(CATEGORIES).flat().length} across 4 depts`)
  console.log(`  Managers    : ${MANAGERS.length}  (password: ${DEFAULT_PASS})`)
  console.log(`  Agents      : ${AGENTS.length}  (password: ${DEFAULT_PASS})`)
  console.log(`  Clients     : ${clientUsers.length} center accounts`)
  console.log(`  Tickets     : 467 (Jan:75 Feb:92 Mar:118 Apr:134 May:48)`)
  console.log('\nManager logins:')
  for (const m of MANAGERS) {
    console.log(`  ${m.email.padEnd(42)} ${DEFAULT_PASS}`)
  }

  await AppDataSource.destroy()
}

sampleData().catch(err => {
  console.error('\n❌ Sample data failed:', err.message ?? err)
  process.exit(1)
})
