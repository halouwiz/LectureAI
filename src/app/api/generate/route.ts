import Anthropic from "@anthropic-ai/sdk";
import type { Deck } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60; // Claude ใช้เวลา 20-40 วิ (Vercel default แค่ 10)

// ดึง JSON object ออกจากข้อความ (เผื่อมี ``` หรือข้อความปนมา)
function extractJson(text: string): string {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  return raw;
}

type ImageInput = { media_type: string; data: string };
type PdfInput = { data: string };

interface GenerateBody {
  text?: string;
  level?: string;
  theme?: string;
  extra?: string;
  model?: string;
  images?: ImageInput[];
  pdfs?: PdfInput[];
}

// โมเดลที่อนุญาตให้เลือก (ทุกตัวรองรับ structured outputs)
const ALLOWED_MODELS = new Set([
  "claude-opus-4-8",
  "claude-sonnet-4-6",
]);

export async function POST(request: Request) {
  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "ส่งข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const level = body.level ?? "ไม่ระบุ";
  const theme = (body.theme ?? "").trim();
  const extra = (body.extra ?? "").trim();
  const model = ALLOWED_MODELS.has(body.model ?? "") ? body.model! : "claude-opus-4-8";
  const images = body.images ?? [];
  const pdfs = body.pdfs ?? [];

  const hasContent = text || images.length > 0 || pdfs.length > 0;
  if (!hasContent) {
    return Response.json(
      { error: "กรุณาใส่เนื้อหา (ข้อความ / PDF / รูปภาพ) อย่างน้อย 1 อย่าง" },
      { status: 400 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ในไฟล์ .env.local" },
      { status: 500 },
    );
  }

  // ประกอบคำสั่งข้อความ
  let instruction = `ระดับชั้นปี: ${level}`;
  if (theme) {
    instruction += `\nธีมสีที่ผู้ใช้ต้องการ: ${theme} — เลือก accentColor และโทนสีของแต่ละแผ่นให้เข้ากับธีมนี้ให้มากที่สุด`;
  }
  if (extra) {
    instruction += `\nความต้องการเพิ่มเติมจากผู้ใช้: ${extra}`;
  }
  if (text) {
    instruction += `\n\n--- เนื้อหาเลคเชอร์ (ข้อความ) ---\n${text}`;
  }
  if (pdfs.length > 0 || images.length > 0) {
    instruction += `\n\n(มีไฟล์ PDF/รูปภาพแนบมาด้วย — อ่านและสรุปเนื้อหาจากไฟล์เหล่านั้น${
      text ? "รวมกับข้อความข้างบน" : ""
    })`;
  }

  // ประกอบ content blocks: PDF + รูป + ข้อความ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [];
  for (const pdf of pdfs) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: pdf.data },
    });
  }
  for (const img of images) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: img.media_type, data: img.data },
    });
  }
  content.push({ type: "text", text: instruction });

  const client = new Anthropic();

  // output_config เป็นพารามิเตอร์ใหม่ที่ TypeScript ของ SDK ยังไม่ครอบคลุม จึง cast เป็น any
  const params = {
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  try {
    const resp = await client.messages.create(params);
    const textBlock = resp.content.find(
      (b: { type: string }) => b.type === "text",
    ) as { text: string } | undefined;

    if (!textBlock) {
      return Response.json({ error: "AI ไม่ได้ส่งผลลัพธ์กลับมา" }, { status: 502 });
    }

    const deck = JSON.parse(extractJson(textBlock.text)) as Deck;
    return Response.json(deck);
  } catch (err) {
    console.error("[generate] error:", err);
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
    return Response.json({ error: `เรียก Claude ไม่สำเร็จ: ${message}` }, { status: 500 });
  }
}
