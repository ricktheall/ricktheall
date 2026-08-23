import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, IBM_Plex_Sans_Thai, Noto_Serif_Thai, Trirong } from "next/font/google";

import "./globals.css";

/** Interface, labels and controls — a clean sans that also carries Thai. */
const uiThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ui-thai",
});

/** Reading text — a Thai serif, for the manuscript feel. */
const readThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-read-thai",
});

/** Display Latin — high-contrast Didone for numerals and Latin titles. */
const displayLatin = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-display-latin",
});

/** Display Thai — high-contrast Thai serif, paired with the Didone. */
const displayThai = Trirong({
  subsets: ["thai", "latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-display-thai",
});

export const metadata: Metadata = {
  title: "TheAll Bible Coffee",
  description:
    "พระคัมภีร์ที่ลึกพอให้เข้าใจ อบอุ่นพอให้อยากอยู่ และชัดพอให้นำไปใช้จริง — เริ่มที่เอเฟซัสบทที่ 1",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * Applies the stored theme + font size before first paint so readers never see
 * a flash of the wrong theme. The product default is dark.
 */
const themeBootstrap = `
(function () {
  try {
    var raw = localStorage.getItem("theall-bible-coffee:mvp:v1");
    var theme = "dark";
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
    <html lang="th" className="dark" data-font-size="md" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${uiThai.variable} ${readThai.variable} ${displayLatin.variable} ${displayThai.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
