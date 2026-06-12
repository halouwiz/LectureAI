import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LectureAI — สรุปเลคเชอร์เป็นสไลด์น่ารัก",
  description: "ย่อเอกสารเรียนพยาบาลเป็นสไลด์สรุปภาพสวยๆ อ่านง่ายบน iPad",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        <link href="/fonts/fonts.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
