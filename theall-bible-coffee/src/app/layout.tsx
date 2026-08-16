import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Trirong } from "next/font/google";

import "./globals.css";

/** Interface + body copy: highly readable Thai sans. Only the weights we use. */
const thaiSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-thai-sans",
});

/** A true Thai serif, reserved for headings and the Scripture moment. */
const thaiSerif = Trirong({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-thai-serif",
});

export const metadata: Metadata = {
  title: "TheAll Bible Coffee",
  description:
    "พระคัมภีร์ที่ลึกพอให้เข้าใจ อบอุ่นพอให้อยากอยู่ และชัดพอให้นำไปใช้จริง — เริ่มที่เอเฟซัสบทที่ 1",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f1" },
    { media: "(prefers-color-scheme: dark)", color: "#14100e" },
  ],
};

/**
 * Applies the stored theme + font size before first paint so readers never see
 * a flash of the wrong theme. Kept deliberately tiny and failure-tolerant.
 */
const themeBootstrap = `
(function () {
  try {
    var raw = localStorage.getItem("theall-bible-coffee:mvp:v1");
    var theme = "system";
    var fontSize = "md";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.preferences) {
        if (["light","dark","system"].indexOf(parsed.preferences.theme) > -1) theme = parsed.preferences.theme;
        if (["sm","md","lg","xl"].indexOf(parsed.preferences.fontSize) > -1) fontSize = parsed.preferences.fontSize;
      }
    }
    var dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.dataset.theme = theme;
    root.dataset.fontSize = fontSize;
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-font-size="md" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`${thaiSans.variable} ${thaiSerif.variable} antialiased`}>{children}</body>
    </html>
  );
}
