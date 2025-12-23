# Left Click Service API

Left Click Service API is a lightweight Next.js (App Router) service that wraps the YouTube Data API v3 to surface a channel’s uploads, most popular videos, and “for you” suggestions. Everything is exposed via simple HTTP endpoints so internal services can ingest YouTube data without touching the YouTube API directly.

## Prerequisites

- Node.js 18+ and npm (or pnpm/bun/yarn) for running the service.
- A YouTube Data API v3 key with `youtube.readonly` access.

## Environment Variables

This service has one optional environment variable:

| Variable       | Required | Description                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `YT_API_KEY`   | No       | Optional default YouTube Data API key. If not set, clients must provide their own key via the `x-youtube-api-key` header. |

### Getting Your YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3** for your project
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Optional) Restrict the key to only YouTube Data API v3 for security
6. Copy the API key and use it as your `YT_API_KEY` or pass it in requests

## Local Setup
environment variable. Requests are rejected with 403 Forbidden otherwise. |
| `x-youtube-api-key`  | Yes*     | YouTube Data API v3 key used to make requests to YouTube. If `YT_API_KEY` is set as an environment variable, you can use that value here. |

\*Only `/youtube-service` require
   npm install
   ```

2. Copy the sample environment file and fill in your secrets:

   ```bash
   cp example.env .env.local
   ```

   Edit `.env.local` and optionally add your YouTube API key:

   ```env
   YT_API_KEY="your-youtube-api-key-here"  # Optional
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   The API will listen on `http://localhost:3000` by default.

## Authentication & Headers

Every request passes through the global middleware (`middleware.ts:4`), so missing or incorrect credentials never reach the route handlers.

| Header               | Required | Description                                                                                 |
| -------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `authorization`      | Yes      | Must exactly match the `SERVICE_TOKEN` value. Requests are rejected with 401 otherwise.     |
| `x-youtube-api-key`  | Yes*     | YouTube Data API key forwarded to `createYoutubeClient` (`app/youtube-service/route.ts:9`). |

\*Only `/youtube-service` needs the YouTube key; the root health check does not.

## Endpoints

### `GET /`

Health check that proves the service is online.

```bash
curl http://localhost:3000/
```

**Response**

```json
{ "message": "Hi there! 👋, welcome to Left Click Services API." }
```

### `GET /youtube-service`

Resolves a channel handle or URL, then returns the newest uploads plus two curated lists (popular and “for you”).

**Query Parameters**

| Name | Required | Description |
| ---- | -------- | ----------- |
| `url` | Yes | Channel handle or URL such as `https://www.youtube.com/@leftclick`. |

**Sample Request**

```bash
curl "http://localhost:3000/youtube-service?url=https://www.youtube.com/@leftclick" \
  -H "x-youtube-api-key: <YOUR_YT_API_KEY>"
```

**Success Response**

```json
{
  "success": true,
  "channelId": "UCxxxx",
  "uploadsPlaylistId": "UUxxxx",
  "videos": [
    {
      "videoId": "abc123",
      "title": "Latest upload",
      "publishedAt": "2024-05-01T12:34:56Z",
      "liveBroadcastContent": "none",
      "liveStreamingDetails": null
    }
  ],
  "popularVideos": [ /* ordered by viewCount */ ],
  "forYou": [ /* ordered by relevance */ ]
}
```

Each video entry includes live status metadata populated via `getVideoLiveStatuses` (`app/lib/youtubeServices.ts:41`), so callers can tell whether a video is live/upcoming.

**Error Responses**

- `400` – Missing `url` query param or `x-youtube-api-key` header.
- `500` – Upstream YouTube errors or unexpected failures; the body contains `{ "success": false, "error": "<message>" }`.

## Deployment

### Environment Variables in Production

When deploying to Vercel, Netlify, or other platforms:

1. Optionally set `YT_API_KEY` if you want to provide a default key for users
2. **Never commit `.env.local` or `.env.production.local` to git** – they're already excluded via `.gitignore`

### Security Checklist Before Going Public

- ✅ Ensure `.env*` files are in `.gitignore` (already configured)
- ✅ Verify no secrets are hardcoded in source files
- ✅ Consider adding rate limiting to prevent API abuse
- ✅ If you set `YT_API_KEY`, restrict it to specific APIs in Google Cloud Console
- ✅ Monitor your deployment for unexpected traffic patterns

## Operational Notes

- Only YouTube handles (`https://www.youtube.com/@handle`) are supported today; other channel URL formats will raise "Unable to resolve channel".
- Each list currently returns up to 10 entries. Adjust the constants in [app/youtube-service/route.ts](app/youtube-service/route.ts) if you need more results.
- The service proxies to the YouTube Data API without caching, so consider implementing your own caching/rate limiting for high-traffic scenarios.
- YouTube Data API has daily quota limits – monitor your usage in the Google Cloud Console.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT