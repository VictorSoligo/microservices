import { pgTable, text } from 'drizzle-orm/pg-core'

export const customers = pgTable('customers', {
  id: text().primaryKey(),
})
