'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [url, setUrl] = useState('https://www.youtube.com/@dougitydog');
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch(`/youtube-service?url=${encodeURIComponent(url)}`, {
        headers: {
          'x-youtube-api-key':  apiKey,
        },
      });

      const data = await res.json();
      setResponse(data);
      
      if (!res.ok) {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError('Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          🎥 YouTube API Wrapper
        </h1>
      </header>

      {/* Overview */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Overview</h2>
        <p className={styles.sectionText}>
                  A lightweight Next.js (App Router) service that wraps the YouTube Data API v3 to surface a channel's uploads, most popular videos, and "for you" suggestions. Everything is exposed via simple HTTP endpoints so applications can ingest YouTube data without you needing to navigate through the complexity of the YouTube API.
        </p>
      </section>

      {/* Getting Started */}
      <section className={styles.gettingStarted}>
        <h2 className={styles.sectionTitle}>Getting Your YouTube API Key</h2>
        <ol>
          <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
          <li>Create a new project or select an existing one</li>
          <li>Enable the <strong>YouTube Data API v3</strong> for your project</li>
          <li>Go to <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>API Key</strong></li>
          <li>Copy the API key - you'll send it in the <code>x-youtube-api-key</code> header</li>
        </ol>
      </section>

      {/* API Tester */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Try It Out</h2>
        <form onSubmit={handleTest} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              YouTube Channel URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://www.youtube.com/@dougitydog"
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              YouTube API Key
            </label>
            <input
              type="input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your YouTube Data API v3 key"
              className={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Loading...' : 'Test API'}
          </button>



            {response?.success && (
                <div className={styles.videoContainer}>
                    <h3 className={styles.videoTitle}>Sample Video from Channel</h3>
                    <div className={styles.videoWrapper}>
                        <iframe 
                            src={`https://www.youtube.com/embed/${response.videos[0].videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

        </form>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {response && (
          <div className={styles.responseContainer}>
            <h3 className={styles.responseTitle}>Response</h3>
            <pre className={styles.codeBlock}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Endpoints */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>API Endpoints</h2>
        
        <div className={styles.endpointSection}>
          <h3 className={styles.endpointTitle}>
            <code className={styles.badge}>GET /</code>
          </h3>
          <p className={styles.sectionText}>Health check endpoint</p>
          <pre className={styles.codeBlock}>
{`curl http://localhost:3000/`}
          </pre>
        </div>

        <div className={styles.endpointSection}>
          <h3 className={styles.endpointTitle}>
            <code className={styles.badge}>GET /youtube-service</code>
          </h3>
          <p className={styles.sectionText}>
            Get channel uploads, popular videos, and "for you" recommendations
          </p>
          
          <h4 className={styles.subheading}>Query Parameters:</h4>
          <ul>
            <li><code>url</code> (required) - Channel handle or URL</li>
          </ul>

          <h4 className={styles.subheading}>Headers:</h4>
          <ul>
            <li><code>x-youtube-api-key</code> (required) - Your YouTube Data API v3 key</li>
          </ul>

          <h4 className={styles.subheading}>Example:</h4>
          <pre className={styles.codeBlock}>
{`curl "http://localhost:3000/youtube-service?url=https://www.youtube.com/@leftclick" \\
  -H "x-youtube-api-key: YOUR_API_KEY"`}
          </pre>
        </div>
      </section>

      {/* Code Examples */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Code Examples</h2>
        
        <div className={styles.codeExample}>
          <h3 className={styles.codeExampleTitle}>JavaScript (Fetch)</h3>
          <pre className={styles.codeBlock}>
{`const response = await fetch(
  'http://localhost:3000/youtube-service?url=https://www.youtube.com/@leftclick',
  {
    headers: {
      'x-youtube-api-key': 'YOUR_API_KEY'
    }
  }
);

const data = await response.json();
console.log(data);`}
          </pre>
        </div>

        <div className={styles.codeExample}>
          <h3 className={styles.codeExampleTitle}>Python (requests)</h3>
          <pre className={styles.codeBlock}>
{`import requests

response = requests.get(
    'http://localhost:3000/youtube-service',
    params={'url': 'https://www.youtube.com/@leftclick'},
    headers={'x-youtube-api-key': 'YOUR_API_KEY'}
)

data = response.json()
print(data)`}
          </pre>
        </div>

        <div className={styles.codeExample}>
          <h3 className={styles.codeExampleTitle}>Node.js (axios)</h3>
          <pre className={styles.codeBlock}>
{`const axios = require('axios');

const { data } = await axios.get(
  'http://localhost:3000/youtube-service',
  {
    params: { url: 'https://www.youtube.com/@leftclick' },
    headers: { 'x-youtube-api-key': 'YOUR_API_KEY' }
  }
);

console.log(data);`}
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Built by Frantz Lindor • <a href="https://github.com/Ohheyfrantz/youtube-api-wrapper" target="_blank" rel="noopener noreferrer">View on GitHub</a></p>
      </footer>
    </div>
  );
}
