import '@opentelemetry/auto-instrumentations-node/register'

import fastifyCors from '@fastify/cors'
import { trace } from '@opentelemetry/api'
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
import { setTimeout } from 'node:timers/promises'
import { tracer } from '../tracer/tracer.ts'

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

    await db.insert(schema.orders).values({
      id,
      amount,
      customerId,
    })

    const span = tracer.startSpan('aqui ta lento piazao')

    span.setAttribute('meu span', 'é us guri')

    await setTimeout(3000)

    span.end()

    trace.getActiveSpan()?.setAttribute('order_id', id)

    sendOrderCreatedMessage({
      orderId: id,
      amount,
      customer: {
        id: customerId,
      },
    })

    return reply.status(201).send({ amount })
  },
)

app.listen({ port: 3333 }).then(() => {
  console.log('[Order] HTTP Server is running on port 3333')
})
