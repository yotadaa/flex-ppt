import type { Metadata } from "next";
import "../src/styles/google-fonts.css";
import "../src/styles/tokens.css";
import "../src/styles/slide-source.css";
import "../src/styles/slide-compat.css";
import "../src/styles/app.css";

export const metadata: Metadata = {
  title: "Flex-PPT",
  description: "Personal presentation editor for dynamic thesis slides.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
