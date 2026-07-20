import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSetting {
    @PrimaryColumn()
    key: string;

    @Column({ type: 'text', nullable: true })
    value: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: 'general' })
    group: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
