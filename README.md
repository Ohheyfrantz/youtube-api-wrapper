# YouTube API Wrapper

A lightweight Next.js (App Router) service that wraps the YouTube Data API v3 to surface a channel's uploads, most popular videos, and "for you" suggestions. Everything is exposed via simple HTTP endpoints so applications can ingest YouTube data without needing to navigate through the complexity of the YouTube API.

## Prerequisites

- Node.js 18+ and npm (or pnpm/bun/yarn) for running the service
- A YouTube Data API v3 key with `youtube.readonly` access

## Getting Your YouTube API Key

To use this API, you **must** have a YouTube Data API v3 key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3** for your project
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. (Optional but recommended) Restrict the key to only YouTube Data API v3 for security
6. Copy the API key - you'll need to send it in the `x-youtube-api-key` header with each request

## Local Setup

1. Install dependencies:

   \`\`\`bash
   npm install
   \`\`\`

2. Run the dev server:

   \`\`\`bash
   npm run dev
   \`\`\`

   The API will listen on \`http://localhost:3000\` by default.

## API Headers

| Header               | Required | Description                                                                                 |
| -------------------- | -------- | ------------------------------------------------------------------------------------------- |
| \`x-youtube-api-key\`  | Yes*     | Your YouTube Data API v3 key. Required to fetch data from YouTube. |

\*Only \`/youtube-service\` requires the YouTube API key; the root health check (\`GET /\`) does not.

## Endpoints

### \`GET /\`

Health check that proves the service is online.

\`\`\`bash
curl http://localhost:3000/
\`\`\`

**Response**

\`\`\`json
{ "message": "Hi there! 👋, welcome to Left Click Services API." }
\`\`\`

### \`GET /youtube-service\`

Resolves a channel handle or URL, then returns the newest uploads plus two curated lists (popular and "for you").

**Query Parameters**

| Name | Required | Description |
| ---- | -------- | ----------- |
| \`url\` | Yes | Channel handle or URL such as \`https://www.youtube.com/@leftclick\`. |

**Sample Request**

\`\`\`bash
curl "http://localhost:3000/youtube-service?url=https://www.youtube.com/@leftclick" \\
  -H "x-youtube-api-key: <YOUR_YT_API_KEY>"
\`\`\`

**Success Response**

\`\`\`json
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
\`\`\`

Each video entry includes live status metadata, so callers can tell whether a video is live/upcoming.

**Error Responses**

- \`400\` – Missing \`url\` query param or \`x-youtube-api-key\` header.
- \`500\` – Upstream YouTube errors or unexpected failures; the body contains \`{ "success": false, "error": "<message>" }\`.

## Deployment

### Deployment Notes

- No environment variables are required for deployment
- Users must provide their own YouTube API key via the \`x-youtube-api-key\` header
- **Never commit \`.env.local\` or \`.env.production.local\` to git** – they're already excluded via \`.gitignore\`

### Security Best Practices

- ✅ Restrict your YouTube API keys to specific APIs in Google Cloud Console
- ✅ Set up quota alerts in Google Cloud to monitor API usage
- ✅ Consider adding rate limiting to your deployment to prevent abuse
- ✅ Monitor your deployment for unexpected traffic patterns
- ✅ Never share your YouTube API key publicly or commit it to version control

## Operational Notes

- Only YouTube handles (\`https://www.youtube.com/@handle\`) are supported today; other channel URL formats will raise "Unable to resolve channel".
- Each list currently returns up to 10 entries. Adjust the constants in app/youtube-service/route.ts if you need more results.
- The service proxies to the YouTube Data API without caching, so consider implementing your own caching/rate limiting for high-traffic scenarios.
- YouTube Data API has daily quota limits – monitor your usage in the Google Cloud Console.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
