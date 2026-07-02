import "./globals.css";

export const metadata = {
  title: "Reload — training log",
  robots: { index: false, follow: false },
};

const ANTI_FLASH = `
try {
  var t = localStorage.getItem("rtr.theme");
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
