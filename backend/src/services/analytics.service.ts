import { DataSource } from 'typeorm'
import { TicketStatus } from '../types/ticket-status.enum'

export class AnalyticsService {
  constructor(private dataSource: DataSource) {}

  async getDashboardOverview(departmentId?: string) {
    const conn = this.dataSource

    const base = (extra = '') => `
      SELECT COUNT(*) FROM tickets t
      WHERE t.deleted_at IS NULL ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      ${extra}
    `

    const [total, open, inProgress, escalated, resolved, closed, slaBreached] = await Promise.all([
      conn.query(base()),
      conn.query(base(`AND t.status = '${TicketStatus.Open}'`)),
      conn.query(base(`AND t.status = '${TicketStatus.InProgress}'`)),
      conn.query(base(`AND t.is_escalated = true AND t.status NOT IN ('resolved','closed')`)),
      conn.query(base(`AND t.status = '${TicketStatus.Resolved}'`)),
      conn.query(base(`AND t.status = '${TicketStatus.Closed}'`)),
      conn.query(`
        SELECT COUNT(*) FROM sla_tracking st
        INNER JOIN tickets t ON t.id = st.ticket_id
        WHERE st.status = 'breached' AND t.deleted_at IS NULL
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      `),
    ])

    const totalResolved = parseInt(resolved[0].count) + parseInt(closed[0].count)
    const totalTickets = parseInt(total[0].count)
    const slaCompliance = totalTickets > 0
      ? Math.round(((totalTickets - parseInt(slaBreached[0].count)) / totalTickets) * 100)
      : 100

    return {
      totalTickets,
      open: parseInt(open[0].count),
      inProgress: parseInt(inProgress[0].count),
      escalated: parseInt(escalated[0].count),
      resolved: totalResolved,
      slaBreached: parseInt(slaBreached[0].count),
      slaCompliance,
    }
  }

  async getTicketTrend(days = 30, departmentId?: string) {
    const result = await this.dataSource.query(`
      SELECT
        DATE_TRUNC('day', t.created_at) AS date,
        COUNT(*) AS count
      FROM tickets t
      WHERE t.deleted_at IS NULL
        AND t.created_at >= NOW() - INTERVAL '${days} days'
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      GROUP BY DATE_TRUNC('day', t.created_at)
      ORDER BY date ASC
    `)

    return result.map((r: any) => ({
      date: r.date,
      count: parseInt(r.count)
    }))
  }

  async getAgentPerformance(departmentId?: string) {
    return this.dataSource.query(`
      SELECT
        u.id,
        u.first_name || ' ' || COALESCE(u.last_name,'') AS name,
        u.email,
        COUNT(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 END) AS open_tickets,
        COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) AS resolved_tickets,
        ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at))/3600)::numeric, 1) AS avg_resolution_hours
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to_id = u.id AND t.deleted_at IS NULL
      WHERE u.role = 'agent' AND u.is_active = true AND u.deleted_at IS NULL
        ${departmentId ? `AND u.department_id = '${departmentId}'` : ''}
      GROUP BY u.id, u.first_name, u.last_name, u.email
      ORDER BY resolved_tickets DESC
    `)
  }

  async getDepartmentBreakdown() {
    return this.dataSource.query(`
      SELECT
        d.id,
        d.name,
        COUNT(t.id) AS total_tickets,
        COUNT(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 END) AS open_tickets,
        COUNT(CASE WHEN t.is_escalated = true THEN 1 END) AS escalated_tickets
      FROM departments d
      LEFT JOIN tickets t ON t.department_id = d.id AND t.deleted_at IS NULL
      WHERE d.deleted_at IS NULL
      GROUP BY d.id, d.name
      ORDER BY total_tickets DESC
    `)
  }

  async getStatusDistribution(departmentId?: string): Promise<Array<{ status: string; count: number }>> {
    const result = await this.dataSource.query(`
      SELECT
        t.status,
        COUNT(*) AS count
      FROM tickets t
      WHERE t.deleted_at IS NULL
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      GROUP BY t.status
      ORDER BY count DESC
    `)

    return result.map((r: any) => ({
      status: r.status,
      count: parseInt(r.count),
    }))
  }

  async getPriorityDistribution(departmentId?: string): Promise<Array<{ priority: string; count: number }>> {
    const result = await this.dataSource.query(`
      SELECT
        t.priority,
        COUNT(*) AS count
      FROM tickets t
      WHERE t.deleted_at IS NULL
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      GROUP BY t.priority
      ORDER BY count DESC
    `)

    return result.map((r: any) => ({
      priority: r.priority,
      count: parseInt(r.count),
    }))
  }

  async getMonthlyTrend(
    year: number,
    departmentId?: string
  ): Promise<Array<{ month: number; count: number; resolved: number }>> {
    const result = await this.dataSource.query(`
      SELECT
        EXTRACT(MONTH FROM t.created_at)::int AS month,
        COUNT(*) AS count,
        COUNT(CASE WHEN t.status IN ('resolved','closed') THEN 1 END) AS resolved
      FROM tickets t
      WHERE t.deleted_at IS NULL
        AND EXTRACT(YEAR FROM t.created_at) = ${year}
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      GROUP BY EXTRACT(MONTH FROM t.created_at)
      ORDER BY month ASC
    `)

    // Build a full 12-month array, filling in zeros for months with no data
    const byMonth = new Map<number, { count: number; resolved: number }>()
    for (const r of result) {
      byMonth.set(r.month, { count: parseInt(r.count), resolved: parseInt(r.resolved) })
    }

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const entry = byMonth.get(m)
      return { month: m, count: entry?.count ?? 0, resolved: entry?.resolved ?? 0 }
    })
  }

  async getAvgResolutionTime(
    departmentId?: string
  ): Promise<{ avgHours: number; p50Hours: number; fastestHours: number; slowestHours: number }> {
    const result = await this.dataSource.query(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)::numeric, 2) AS avg_hours,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600
        )::numeric, 2) AS p50_hours,
        ROUND(MIN(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)::numeric, 2) AS fastest_hours,
        ROUND(MAX(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600)::numeric, 2) AS slowest_hours
      FROM tickets t
      WHERE t.deleted_at IS NULL
        AND t.resolved_at IS NOT NULL
        AND t.created_at IS NOT NULL
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
    `)

    const row = result[0] ?? {}
    return {
      avgHours: parseFloat(row.avg_hours) || 0,
      p50Hours: parseFloat(row.p50_hours) || 0,
      fastestHours: parseFloat(row.fastest_hours) || 0,
      slowestHours: parseFloat(row.slowest_hours) || 0,
    }
  }

  async getCategoryBreakdown() {
    return this.getDepartmentBreakdown()
  }

  async getSLATrend(
    days: number,
    departmentId?: string
  ): Promise<Array<{ date: string; met: number; breached: number }>> {
    const result = await this.dataSource.query(`
      SELECT
        DATE_TRUNC('day', st.created_at)::date AS date,
        COUNT(CASE WHEN st.status = 'met' THEN 1 END) AS met,
        COUNT(CASE WHEN st.status = 'breached' THEN 1 END) AS breached
      FROM sla_tracking st
      INNER JOIN tickets t ON t.id = st.ticket_id
      WHERE t.deleted_at IS NULL
        AND st.created_at >= NOW() - INTERVAL '${days} days'
        ${departmentId ? `AND t.department_id = '${departmentId}'` : ''}
      GROUP BY DATE_TRUNC('day', st.created_at)::date
      ORDER BY date ASC
    `)

    return result.map((r: any) => ({
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      met: parseInt(r.met),
      breached: parseInt(r.breached),
    }))
  }
}
