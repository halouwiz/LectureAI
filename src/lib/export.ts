// ตัวช่วย export สไลด์ทุกใบรวมเป็นไฟล์เดียว (PDF หลายหน้า / JPG ภาพยาว)
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const PAGE_BG = "#FFF6FA";

function getSlideNodes(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".lecture-slide"));
}

function safeName(name: string): string {
  return (name || "lecture-summary").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
}

async function captureAll(): Promise<{ dataUrl: string; w: number; h: number }[]> {
  const nodes = getSlideNodes();
  // รอให้ฟอนต์โหลดเสร็จก่อน ไม่งั้นภาพจะเพี้ยน
  if (document.fonts?.ready) await document.fonts.ready;
  const out: { dataUrl: string; w: number; h: number }[] = [];
  for (const node of nodes) {
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      backgroundColor: PAGE_BG,
      cacheBust: true,
    });
    out.push({ dataUrl, w: node.offsetWidth, h: node.offsetHeight });
  }
  return out;
}

export async function exportDeckToPdf(deckTitle: string): Promise<void> {
  const images = await captureAll();
  if (images.length === 0) return;
  const first = images[0];
  const pdf = new jsPDF({ unit: "px", format: [first.w, first.h], orientation: "portrait" });
  images.forEach((img, i) => {
    if (i > 0) pdf.addPage([img.w, img.h], "portrait");
    pdf.addImage(img.dataUrl, "PNG", 0, 0, img.w, img.h);
  });
  pdf.save(safeName(deckTitle) + ".pdf");
}

export async function exportDeckToJpg(deckTitle: string): Promise<void> {
  const images = await captureAll();
  if (images.length === 0) return;

  const loaded = await Promise.all(
    images.map(
      (img) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const el = new Image();
          el.onload = () => resolve(el);
          el.onerror = reject;
          el.src = img.dataUrl;
        }),
    ),
  );

  const gap = 48; // ระยะห่างระหว่างแผ่น (pixelRatio 2)
  const width = Math.max(...loaded.map((i) => i.width));
  const height = loaded.reduce((sum, i) => sum + i.height, 0) + gap * (loaded.length - 1);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#FFF5F8";
  ctx.fillRect(0, 0, width, height);

  let y = 0;
  for (const el of loaded) {
    ctx.drawImage(el, (width - el.width) / 2, y);
    y += el.height + gap;
  }

  const url = canvas.toDataURL("image/jpeg", 0.92);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName(deckTitle) + ".jpg";
  a.click();
}
