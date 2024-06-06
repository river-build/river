export function channelMessagePostWhere(filterFn) {
    return (event) => {
        return ((event.decryptedContent?.kind === 'channelMessage' &&
            event.decryptedContent?.content.payload.case === 'post' &&
            event.decryptedContent?.content.payload.value.content.case === 'text' &&
            filterFn(event.decryptedContent?.content.payload.value.content.value)) ||
            (event.localEvent?.channelMessage?.payload.case === 'post' &&
                event.localEvent?.channelMessage?.payload.value.content.case === 'text' &&
                filterFn(event.localEvent?.channelMessage?.payload.value.content.value)));
    };
}
//# sourceMappingURL=timeline.js.map