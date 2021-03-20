import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({
  name: 'payment_users',
})
export class PaymentUser {
  @PrimaryColumn('text')
  id!: string

  @Column({ name: 'twinte_user_id', type: 'uuid' })
  twinteUserId!: string

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName!: string | null

  @Column({ name: 'link', type: 'text', nullable: true })
  link!: string | null
}
