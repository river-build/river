import { parseChannelMetadataJSON } from './Utils'

describe('utils.test.ts', () => {
    test('channelMetadataJson', async () => {
        expect(parseChannelMetadataJSON('{"name":"name","description":"description"}')).toEqual({
            name: 'name',
            description: 'description',
        })
        expect(parseChannelMetadataJSON('name')).toEqual({
            name: 'name',
            description: '',
        })
        expect(parseChannelMetadataJSON('11111')).toEqual({
            name: '11111',
            description: '',
        })
    })
})
