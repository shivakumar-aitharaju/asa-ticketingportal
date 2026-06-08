"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialSchema1748476800000 = void 0;
class InitialSchema1748476800000 {
    name = 'InitialSchema1748476800000';
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM('admin','manager','team_leader','agent','client')`);
        await queryRunner.query(`CREATE TYPE "ticket_status_enum" AS ENUM('open','assigned','in_progress','pending_client','resolved','closed','escalated','reopened')`);
        await queryRunner.query(`CREATE TYPE "priority_enum" AS ENUM('low','medium','high','critical')`);
        await queryRunner.query(`CREATE TYPE "escalation_status_enum" AS ENUM('active','resolved','closed')`);
        await queryRunner.query(`CREATE TYPE "sla_status_enum" AS ENUM('on_track','at_risk','breached','met')`);
        await queryRunner.query(`CREATE TYPE "notification_type_enum" AS ENUM('ticket_created','ticket_assigned','ticket_updated','ticket_replied','ticket_resolved','ticket_closed','ticket_reopened','ticket_escalated','sla_at_risk','sla_breached','internal_note','system_alert')`);
        await queryRunner.query(`
      CREATE TABLE "system_configurations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" varchar(255) NOT NULL UNIQUE,
        "value" text NOT NULL,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_system_configurations" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_departments" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL UNIQUE,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "category_department_mappings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_cdm" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cdm_cat_dept" UNIQUE ("category_id", "department_id"),
        CONSTRAINT "FK_cdm_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cdm_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "first_name" varchar(255),
        "last_name" varchar(255),
        "phone" varchar(20),
        "role" "user_role_enum" NOT NULL DEFAULT 'client',
        "department_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "failed_login_attempts" int NOT NULL DEFAULT 0,
        "locked_until" timestamptz,
        "last_login_at" timestamptz,
        "avatar_url" varchar(1024),
        "notification_prefs" jsonb NOT NULL DEFAULT '{}',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_department" ON "users" ("department_id")`);
        await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_number" varchar(50) NOT NULL UNIQUE,
        "subject" varchar(500) NOT NULL,
        "description" text NOT NULL,
        "status" "ticket_status_enum" NOT NULL DEFAULT 'open',
        "priority" "priority_enum" NOT NULL DEFAULT 'medium',
        "is_escalated" boolean NOT NULL DEFAULT false,
        "category_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "created_by_id" uuid NOT NULL,
        "assigned_to_id" uuid,
        "resolution_summary" text,
        "resolved_at" timestamptz,
        "closed_at" timestamptz,
        "first_response_at" timestamptz,
        "tags" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tickets_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tickets_department" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tickets_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_tickets_assigned_to" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_status" ON "tickets" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_priority" ON "tickets" ("priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_department" ON "tickets" ("department_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_assigned" ON "tickets" ("assigned_to_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_created_by" ON "tickets" ("created_by_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_escalated" ON "tickets" ("is_escalated")`);
        await queryRunner.query(`CREATE INDEX "IDX_tickets_created_at" ON "tickets" ("created_at")`);
        await queryRunner.query(`
      CREATE TABLE "ticket_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "author_id" uuid NOT NULL,
        "content" text NOT NULL,
        "is_client_facing" boolean NOT NULL DEFAULT true,
        "edited_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_ticket_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tm_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tm_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_tm_ticket" ON "ticket_messages" ("ticket_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tm_author" ON "ticket_messages" ("author_id")`);
        await queryRunner.query(`
      CREATE TABLE "attachments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "message_id" uuid,
        "uploaded_by_id" uuid NOT NULL,
        "file_name" varchar(500) NOT NULL,
        "file_type" varchar(100) NOT NULL,
        "file_size" int NOT NULL,
        "s3_key" varchar(1024) NOT NULL,
        "s3_bucket" varchar(255) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_attachments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_att_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_att_uploader" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_att_ticket" ON "attachments" ("ticket_id")`);
        await queryRunner.query(`
      CREATE TABLE "ticket_status_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "from_status" "ticket_status_enum",
        "to_status" "ticket_status_enum" NOT NULL,
        "changed_by_id" uuid NOT NULL,
        "reason" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_tsh" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tsh_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_tsh_changed_by" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_tsh_ticket" ON "ticket_status_history" ("ticket_id")`);
        await queryRunner.query(`
      CREATE TABLE "ticket_assignments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "assigned_to_id" uuid NOT NULL,
        "assigned_by_id" uuid NOT NULL,
        "unassigned_at" timestamptz,
        "reason" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_ta" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ta_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ta_assigned_to" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ta_assigned_by" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_ta_ticket" ON "ticket_assignments" ("ticket_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_ta_assigned_to" ON "ticket_assignments" ("assigned_to_id")`);
        await queryRunner.query(`
      CREATE TABLE "escalations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL,
        "escalated_by_id" uuid NOT NULL,
        "escalated_to_id" uuid,
        "reason" text NOT NULL,
        "level" int NOT NULL DEFAULT 1,
        "status" "escalation_status_enum" NOT NULL DEFAULT 'active',
        "resolved_at" timestamptz,
        "resolved_by_id" uuid,
        "resolution_note" text,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_escalations" PRIMARY KEY ("id"),
        CONSTRAINT "FK_esc_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_esc_escalated_by" FOREIGN KEY ("escalated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_esc_ticket" ON "escalations" ("ticket_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_esc_status" ON "escalations" ("status")`);
        await queryRunner.query(`
      CREATE TABLE "sla_configurations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "priority" "priority_enum" NOT NULL,
        "department_id" uuid,
        "category_id" uuid,
        "first_response_minutes" int NOT NULL,
        "resolution_minutes" int NOT NULL,
        "business_hours_only" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_sla_config" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sla_dept" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_sla_cat" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "sla_tracking" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ticket_id" uuid NOT NULL UNIQUE,
        "sla_config_id" uuid NOT NULL,
        "first_response_due" timestamptz NOT NULL,
        "resolution_due" timestamptz NOT NULL,
        "first_response_met" boolean,
        "first_response_at" timestamptz,
        "resolution_met" boolean,
        "resolved_at" timestamptz,
        "status" "sla_status_enum" NOT NULL DEFAULT 'on_track',
        "paused_at" timestamptz,
        "total_paused_minutes" int NOT NULL DEFAULT 0,
        "breach_notified_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_sla_tracking" PRIMARY KEY ("id"),
        CONSTRAINT "FK_slat_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_slat_config" FOREIGN KEY ("sla_config_id") REFERENCES "sla_configurations"("id") ON DELETE RESTRICT
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_slat_status" ON "sla_tracking" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_slat_due" ON "sla_tracking" ("resolution_due")`);
        await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "ticket_id" uuid,
        "type" "notification_type_enum" NOT NULL,
        "title" varchar(500) NOT NULL,
        "body" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" timestamptz,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at" timestamptz,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notif_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notif_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_notif_user_read" ON "notifications" ("user_id", "is_read")`);
        await queryRunner.query(`CREATE INDEX "IDX_notif_ticket" ON "notifications" ("ticket_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notif_created" ON "notifications" ("created_at")`);
        await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "actor_id" uuid,
        "action" varchar(100) NOT NULL,
        "resource" varchar(100) NOT NULL,
        "resource_id" uuid,
        "old_value" jsonb,
        "new_value" jsonb,
        "ip_address" varchar(50),
        "user_agent" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_actor" ON "audit_logs" ("actor_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_resource" ON "audit_logs" ("resource", "resource_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_action" ON "audit_logs" ("action")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_created" ON "audit_logs" ("created_at")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sla_tracking" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sla_configurations" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "escalations" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ticket_assignments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ticket_status_history" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "attachments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "ticket_messages" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tickets" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category_department_mappings" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "departments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "system_configurations" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "sla_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "escalation_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "priority_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "ticket_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    }
}
exports.InitialSchema1748476800000 = InitialSchema1748476800000;
//# sourceMappingURL=1748476800000-InitialSchema.js.map