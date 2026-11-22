import "./globals.css";
import Link from "next/link";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  icons: { icon: `${BASE}/logo.jpg`, apple: `${BASE}/logo.jpg` },
  title: "coolBase - Free PDF tools that run on your device",
  description: "Merge, split, compress, convert, edit and protect PDFs. Files never leave your device.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="top">
          <Link href="/" className="logo"><img src={`${BASE}/logo.jpg`} alt="coolBase logo" width="34" height="34" /><span>cool<b>Base</b></span></Link>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>Your files never leave this device</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
