"use client";
// เรนเดอร์หน้า PDF เป็นรูปภาพ + ครอปเฉพาะส่วน "บนเบราว์เซอร์" ด้วย pdf.js
// (วิ่งฝั่ง client เพื่อเลี่ยงปัญหา native deps บน Vercel)
import * as pdfjsLib from "pdfjs-dist";

// pdf.js ต้องการ worker — เสิร์ฟจาก public/ (ไฟล์ copy มาจาก node_modules ตอน build, ดู scripts)
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type RenderedPage = {
  page: number; // 1-based
  canvas: HTMLCanvasElement; // เก็บไว้ครอปทีหลัง
  dataUrl: string; // JPEG ของทั้งหน้า (ส่งให้ AI ดู)
  width: number;
  height: number;
};

// เรนเดอร์ทุกหน้า (จำกัดจำนวน + ขนาด เพื่อคุมเวลา/หน่วยความจำ)
export async function renderPdfPages(
  file: File,
  opts?: { maxPages?: number; scale?: number; jpegQuality?: number },
): Promise<RenderedPage[]> {
  const maxPages = opts?.maxPages ?? 25;
  const scale = opts?.scale ?? 1.6;
  const q = opts?.jpegQuality ?? 0.72;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
  const n = Math.min(pdf.numPages, maxPages);
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= n; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // pdf.js v5: ใช้ canvasContext path (canvas:null) — เสถียรสุด
    await page.render({ canvasContext: ctx!, canvas: null, viewport }).promise;
    pages.push({
      page: i,
      canvas,
      dataUrl: canvas.toDataURL("image/jpeg", q),
      width: canvas.width,
      height: canvas.height,
    });
  }
  return pages;
}

// ครอปกรอบ bbox (พิกัด normalize 0–1 เทียบหน้า) ออกมาเป็น JPEG data URL
export function cropFromPage(
  pageCanvas: HTMLCanvasElement,
  bbox: [number, number, number, number],
  pad = 0.01,
): string | null {
  const [x0, y0, x1, y1] = bbox;
  const W = pageCanvas.width;
  const H = pageCanvas.height;
  const sx = Math.max(0, Math.min(1, Math.min(x0, x1) - pad)) * W;
  const sy = Math.max(0, Math.min(1, Math.min(y0, y1) - pad)) * H;
  const ex = Math.max(0, Math.min(1, Math.max(x0, x1) + pad)) * W;
  const ey = Math.max(0, Math.min(1, Math.max(y0, y1) + pad)) * H;
  const w = Math.round(ex - sx);
  const h = Math.round(ey - sy);
  if (w < 8 || h < 8) return null;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(pageCanvas, sx, sy, w, h, 0, 0, w, h);
  return out.toDataURL("image/jpeg", 0.82);
}
