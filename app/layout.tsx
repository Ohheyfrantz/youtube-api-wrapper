export const metadata = {
  title: 'YouTube API Wrapper',
  description: 'A lightweight Next.js service that wraps the YouTube Data API v3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
