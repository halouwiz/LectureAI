import Anthropic from "@anthropic-ai/sdk";
import type { Deck } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 800; // Vercel Pro (Fluid compute) รองรับสูงสุด 800 วิ ~13 นาที — เผื่อเอกสารใหญ่มากๆ (คิดเงินตาม CPU ที่ใช้จริง ไม่ใช่เพดานนี้)

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

  const params = {
    model,
    max_tokens: 32000, // เผื่อสไลด์เยอะ (Opus 4.8 รองรับถึง 128K) — ใช้ streaming กัน HTTP timeout
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // เรียก AI แล้วคืน Deck หรือ {error} (ไม่ throw ออกไปข้างนอก)
  async function buildResult(): Promise<Deck | { error: string }> {
    const aiStream = client.messages.stream(params);
    const resp = await aiStream.finalMessage();

    // โดน max_tokens = JSON ถูกตัดกลางคัน บอกผู้ใช้ให้แบ่งเนื้อหา
    if (resp.stop_reason === "max_tokens") {
      console.error("[generate] hit max_tokens — output truncated");
      return {
        error:
          "เนื้อหายาวเกินไป AI สร้างสไลด์ได้ไม่จบ 😅 ลองแบ่งเนื้อหาเป็นส่วนย่อย (เช่น ทีละหัวข้อ/ทีละตอน) แล้วสร้างทีละส่วนนะคะ",
      };
    }

    const textBlock = resp.content.find(
      (b: { type: string }) => b.type === "text",
    ) as { text: string } | undefined;
    if (!textBlock) return { error: "AI ไม่ได้ส่งผลลัพธ์กลับมา" };

    try {
      return JSON.parse(extractJson(textBlock.text)) as Deck;
    } catch {
      console.error(
        "[generate] JSON parse failed. stop_reason:",
        resp.stop_reason,
        "text length:",
        textBlock.text.length,
      );
      return {
        error:
          "AI ตอบกลับมาในรูปแบบที่อ่านไม่ได้ 🙏 ลองกด 'สร้างสรุป' ใหม่อีกครั้ง หรือลดความซับซ้อน/ความยาวของเนื้อหาลงนะคะ",
      };
    }
  }

  // สตรีม "heartbeat" (ช่องว่าง) ทุก 10 วิระหว่างรอ AI เพื่อกันการเชื่อมต่อ idle ถูกตัด
  // (เคสไฟล์ PDF ใหญ่ที่ AI ใช้เวลานาน) แล้วค่อยส่ง JSON จริงต่อท้าย
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(" "));
        } catch {
          // ปิดไปแล้วก็ข้าม
        }
      }, 10000);

      let result: Deck | { error: string };
      try {
        result = await buildResult();
      } catch (err) {
        console.error("[generate] error:", err);
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
        result = { error: `เรียก Claude ไม่สำเร็จ: ${message}` };
      }

      clearInterval(heartbeat);
      controller.enqueue(encoder.encode("\n" + JSON.stringify(result)));
      controller.close();
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
