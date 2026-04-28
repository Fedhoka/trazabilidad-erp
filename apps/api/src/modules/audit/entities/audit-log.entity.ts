import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * Immutable audit trail — never update or soft-delete records here.
 * One row per write operation across all business entities.
 */
@Entity('audit_logs')
@Index(['tenantId', 'createdAt'])
@Index(['tenantId', 'entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  /** User who performed the action (null for system/scheduled tasks). */
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  @Column({ name: 'user_email', type: 'text', nullable: true })
  userEmail: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  /** TypeORM entity name / business domain, e.g. "PurchaseOrder" */
  @Column()
  entity: string;

  @Column({ name: 'entity_id', type: 'text', nullable: true })
  entityId: string | null;

  /** Arbitrary JSON snapshot / diff — what was sent in the request body. */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'text', nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
