import { FastifyRequest, FastifyReply } from 'fastify'
import { isValidEthereumAddress } from './validators';

export function handleMetadataRequest(request: FastifyRequest, reply: FastifyReply, baseUrl: string) {
	const { spaceAddress } = request.params as { spaceAddress?: string };
	const { chainId: queryChainId } = request.query as { chainId?: string };
	const chainId = queryChainId ? Number(queryChainId) : undefined;

	if (!spaceAddress) {
    return reply
      .code(400)
      .send({ error: 'Bad Request', message: 'spaceAddress parameter is required' });
  }

	 // Validate spaceAddress format using the helper function
	 if (!isValidEthereumAddress(spaceAddress)) {
    return reply
      .code(400)
      .send({ error: 'Bad Request', message: 'Invalid spaceAddress format' });
  }

	if (chainId !== undefined && isNaN(chainId)) {
    return reply
      .code(400)
      .send({ error: 'Bad Request', message: 'Invalid chainId format' });
  }

	const dummyJson = {
			name: "....",
			description: "....",
			members: 99999,
			fees: "0.001 eth",
			image: `${baseUrl}/space/${spaceAddress}/image`
	};

	reply
    .header('Content-Type', 'application/json')
    .send(dummyJson);
}
