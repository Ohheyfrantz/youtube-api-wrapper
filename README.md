# Left Click Service API

Left Click Service API is a lightweight Next.js (App Router) service that wraps the YouTube Data API v3 to surface a channel’s uploads, most popular videos, and “for you” suggestions. Everything is exposed via simple HTTP endpoints so internal services can ingest YouTube data without touching the YouTube API directly.

## Prerequisites

- Node.js 18+ and npm (or pnpm/bun/yarn) for running the service.
- A YouTube Data API v3 key with `youtube.readonly` access.
- A shared service token string that all callers must send with each request.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the sample environment file and fill in your secrets:

   ```bash
   cp example.env .env.local
   ```

   | Variable       | Purpose                                                                 |
   | -------------- | ----------------------------------------------------------------------- |
   | `SERVICE_TOKEN`| the `authorization` header in `middleware.ts:4`. |
   | `YT_API_KEY`   | Optional placeholder if you want to store a default API key locally.    |

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
curl -H "authorization: <SERVICE_TOKEN>" http://localhost:3000/
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
  -H "authorization: <SERVICE_TOKEN>" \
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
- `401` – `authorization` header does not match `SERVICE_TOKEN`.
- `500` – Upstream YouTube errors or unexpected failures; the body contains `{ "success": false, "error": "<message>" }`.

## Operational Notes

- Only YouTube handles (`https://www.youtube.com/@handle`) are supported today (`app/lib/youtubeServices.ts:18`); other channel URL formats will raise “Unable to resolve channel”.
- Each list currently returns up to 10 entries (see `app/youtube-service/route.ts:32-36`). Adjust the constants there if another service needs more results.
- The service simply proxies to the YouTube Data API, so apply your own caching/rate limiting if you expect heavy traffic.
- To test without hitting YouTube, you can stub the fetch calls inside `createYoutubeClient` or wrap it behind a feature flag.