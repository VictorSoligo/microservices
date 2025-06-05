import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { sendOrderCreatedMessage } from '../broker/messages/order-created.ts'
import { db } from '../database/client.ts'
import { schema } from '../database/schema/index.ts'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', (_, reply) => {
  return reply.status(200).send()
})

// curl --header "Content-Type: application/json" --request POST --data '{"amount": 100}' http://localhost:3333/orders

app.post(
  '/orders',
  {
    schema: {
      body: z.object({
        amount: z.number(),
      }),
    },
  },
  async (request, reply) => {
    const { amount } = request.body

    const id = randomUUID()
    const customerId = '1'

    sendOrderCreatedMessage({
      orderId: id,
      amount,
      customer: {
        id: customerId,
      },
    })

    await db.insert(schema.orders).values({
      id,
      amount,
      customerId,
    })

    return reply.status(201).send({ amount })
  },
)

app.listen({ port: 3333 }).then(() => {
  console.log('[Order] HTTP Server is running on port 3333')
})
