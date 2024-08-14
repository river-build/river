import { FastifyRequest, FastifyReply } from 'fastify'

export async function handleHealthCheckRequest(request: FastifyRequest, reply: FastifyReply) {
	return reply.code(200).send({ status: 'ok' })
}
