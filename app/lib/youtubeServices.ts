type ChannelVideoSearchOptions = {
    order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
    limit?: number;
    query?: string;
};

type LiveStatus = {
    liveBroadcastContent: string;
    liveStreamingDetails: any;
};

function parseInput(input: string) {
    let raw = input.trim();
    if (raw.startsWith('@')) raw = `https://www.youtube.com/${raw}`;
    return raw;
}

export function createYoutubeClient(apiKey: string) {
    if (!apiKey) {
        throw new Error('YouTube API key is required');
    }

    const resolveChannelId = async (input: string) => {
        const parsedInput = new URL(parseInput(input));
        const handle = parsedInput.pathname.startsWith('/@')
            ? parsedInput.pathname.slice(2)
            : null;

        if (!handle) throw new Error('Unable to resolve channel, maybe unsupported URL format');

        const apiUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
        apiUrl.searchParams.set('key', apiKey);
        apiUrl.searchParams.set('forHandle', handle);

        const resp = await fetch(apiUrl);
        if (!resp.ok) throw new Error(`YouTube API error (forHandle): ${resp.status}`);

        const data = await resp.json();
        const channelId = data.items?.[0]?.id;
        if (!channelId) throw new Error('Channel not found for handle');
        return channelId;
    };

    const getUploadsPlaylistId = async (channelId: string) => {
        const url = new URL('https://www.googleapis.com/youtube/v3/channels');
        url.searchParams.set('part', 'contentDetails');
        url.searchParams.set('id', channelId);
        url.searchParams.set('key', apiKey);

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`YouTube API error (contentDetails): ${resp.status}`);

        const data = await resp.json();
        const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
        if (!playlistId) throw new Error('Uploads playlist not found');
        return playlistId;
    };

    const getVideoLiveStatuses = async (videoIds: string[]) => {
        const statusMap: Record<string, LiveStatus> = {};
        const chunkSize = 50; // YouTube API max IDs per call
        for (let i = 0; i < videoIds.length; i += chunkSize) {
            const chunk = videoIds.slice(i, i + chunkSize);
            const url = new URL('https://www.googleapis.com/youtube/v3/videos');
            url.searchParams.set('part', 'snippet,liveStreamingDetails');
            url.searchParams.set('id', chunk.join(','));
            url.searchParams.set('key', apiKey);

            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`YouTube API error (videos): ${resp.status}`);
            const data = await resp.json();
            for (const item of data.items ?? []) {
                const videoId = item.id;
                statusMap[videoId] = {
                    liveBroadcastContent: item.snippet?.liveBroadcastContent ?? 'none',
                    liveStreamingDetails: item.liveStreamingDetails ?? null,
                };
            }
        }
        return statusMap;
    };

    const getPlaylistHeadVideos = async (playlistId: string, limit = 10) => {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'contentDetails,snippet');
        url.searchParams.set('playlistId', playlistId);
        url.searchParams.set('maxResults', limit.toString());
        url.searchParams.set('key', apiKey);

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`YouTube API error (playlistItems): ${resp.status}`);
        const data = await resp.json();
        const items = data.items ?? [];
        const videoIds = items
            .map((item: any) => item.contentDetails?.videoId)
            .filter((vid?: string): vid is string => Boolean(vid));
        const statusMap = videoIds.length ? await getVideoLiveStatuses(videoIds) : {};
        return items.map((item: any) => {
            const videoId = item.contentDetails?.videoId;
            const statuses = videoId ? statusMap[videoId] : undefined;
            return {
                videoId,
                title: item.snippet?.title ?? 'Untitled',
                publishedAt: item.contentDetails?.videoPublishedAt,
                liveBroadcastContent: statuses?.liveBroadcastContent ?? 'none',
                liveStreamingDetails: statuses?.liveStreamingDetails ?? null,
            };
        });
    };

    const getChannelVideosBySearch = async (
        channelId: string,
        { order, limit = 10, query }: ChannelVideoSearchOptions = {},
    ) => {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'id,snippet');
        url.searchParams.set('channelId', channelId);
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', Math.min(limit, 50).toString());
        if (order) url.searchParams.set('order', order);
        if (query) url.searchParams.set('q', query);
        url.searchParams.set('key', apiKey);

        const resp = await fetch(url.toString());
        if (!resp.ok) throw new Error(`YouTube API error (search): ${resp.status}`);
        const data = await resp.json();
        const items = data.items ?? [];
        const videoIds = items
            .map((item: any) => item.id?.videoId)
            .filter((vid?: string): vid is string => Boolean(vid));
        const statusMap = videoIds.length ? await getVideoLiveStatuses(videoIds) : {};
        return items
            .filter((item: any) => Boolean(item.id?.videoId))
            .map((item: any) => {
                const videoId = item.id.videoId as string;
                const statuses = statusMap[videoId];
                return {
                    videoId,
                    title: item.snippet?.title ?? 'Untitled',
                    description: item.snippet?.description ?? '',
                    publishedAt: item.snippet?.publishedAt,
                    thumbnails: item.snippet?.thumbnails ?? {},
                    liveBroadcastContent: statuses?.liveBroadcastContent ?? 'none',
                    liveStreamingDetails: statuses?.liveStreamingDetails ?? null,
                };
            });
    };

    const getChannelPopularVideos = (channelId: string, limit = 10) => {
        return getChannelVideosBySearch(channelId, { order: 'viewCount', limit });
    };

    const getChannelForYouVideos = (channelId: string, limit = 10) => {
        return getChannelVideosBySearch(channelId, { order: 'relevance', limit });
    };

    return {
        resolveChannelId,
        getUploadsPlaylistId,
        getPlaylistHeadVideos,
        getChannelPopularVideos,
        getChannelForYouVideos,
    };
}
