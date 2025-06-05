import '@opentelemetry/auto-instrumentations-node/register'

import '../broker/subscriber.ts'

import fastifyCors from '@fastify/cors'
import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', (_, reply) => {
  return reply.status(200).send()
})

app.listen({ port: 4444 }).then(() => {
  console.log('[Invoice] HTTP Server is running on port 4444')
})
