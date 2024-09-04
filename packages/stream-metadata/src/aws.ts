import { CloudFront } from '@aws-sdk/client-cloudfront'

import { config } from './environment'

export const cloudFront = new CloudFront({
	region: config.aws.region,
	credentials:
		config.aws.accessKeyId && config.aws.secretAccessKey
			? {
					accessKeyId: config.aws.accessKeyId,
					secretAccessKey: config.aws.secretAccessKey,
			  }
			: undefined,
})
