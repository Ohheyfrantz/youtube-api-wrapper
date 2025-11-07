import { NextRequest, NextResponse } from 'next/server';
import { createYoutubeClient } from '../lib/youtubeServices';

export async function GET(req: NextRequest) {
  try {
    const youtubeApiKey =
      req.headers.get('x-youtube-api-key')?.trim();
    if (!youtubeApiKey) {
      return NextResponse.json(
        { success: false, error: 'YouTube API key is required.' },
        { status: 400 }
      );
    }

    const {
      resolveChannelId,
      getUploadsPlaylistId,
      getPlaylistHeadVideos,
      getChannelPopularVideos,
      getChannelForYouVideos,
    } = createYoutubeClient(youtubeApiKey);

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query param "url" is required.' },
        { status: 400 }
      );
    }

    const input = url.trim();
    const channelId = await resolveChannelId(input);
    const uploadsPlaylistId = await getUploadsPlaylistId(channelId);

    const [videos, popularVideos, forYou] = await Promise.all([
      getPlaylistHeadVideos(uploadsPlaylistId, 10),
      getChannelPopularVideos(channelId, 10),
      getChannelForYouVideos(channelId, 10),
    ]);

    return NextResponse.json({
      success: true,
      channelId,
      uploadsPlaylistId,
      videos,
      popularVideos,
      forYou,
    });
  } catch (err: any) {
    const message = err?.message || 'Internal Server Error';
    console.error('[YouTube Service GET]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
