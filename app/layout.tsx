import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Таза қазақша",
  description: "Қазақ сөзінің тірі мағынасы мен 3D кейіпкері",
};

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <head>
        {/* Preload posters for 0ms closed-mouth instant render */}
        <link rel="preload" href="/live-video/woman-idle.jpg" as="image" />
        <link rel="preload" href="/live-video/man-idle.jpg" as="image" />
        {/* Preload ultra-lightweight faststart MP4 videos for 0ms speech start */}
        <link
          rel="preload"
          href="/live-video/ai-woman.mp4"
          as="video"
          type="video/mp4"
        />
        <link
          rel="preload"
          href="/live-video/ai-man.mp4"
          as="video"
          type="video/mp4"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
