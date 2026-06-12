// สร้างภาพประกอบจาก imagePrompt ด้วย Fal.ai (Nano Banana 2) + OpenAI (GPT Image) สลับกัน
// แล้ว cache ลงดิสก์ (public/generated) เพื่อใช้ซ้ำฟรี + เป็น same-origin (export ได้)
import { fal } from "@fal-ai/client";
import OpenAI from "openai";
import { put, list } from "@vercel/blob";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

// สไตล์ที่เติมท้ายทุก prompt ให้ภาพเข้าชุดกัน
const STYLE_SUFFIX =
  ", flat cute pastel illustration, soft blush pink palette, clean and simple, minimal, kawaii vector style, plain white background, centered single subject";

const CACHE_DIR = path.join(process.cwd(), "public", "generated");
// บน Vercel ใช้ Blob storage (มี BLOB_READ_WRITE_TOKEN), บนเครื่อง dev ใช้ disk
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const BLOB_PREFIX = "lectureai/";

function hashPrompt(p: string): string {
  return crypto.createHash("sha1").update(p).digest("hex").slice(0, 16);
}

async function readCache(hash: string): Promise<string | null> {
  if (USE_BLOB) {
    try {
      const { blobs } = await list({ prefix: BLOB_PREFIX + hash, limit: 1 });
      return blobs[0]?.url ?? null;
    } catch {
      return null;
    }
  }
  try {
    await fs.access(path.join(CACHE_DIR, hash + ".png"));
    return `/generated/${hash}.png`;
  } catch {
    return null;
  }
}

async function writeCache(hash: string, buf: Buffer): Promise<string> {
  if (USE_BLOB) {
    const { url } = await put(`${BLOB_PREFIX}${hash}.png`, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
    });
    return url;
  }
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, hash + ".png"), buf);
  return `/generated/${hash}.png`;
}

async function genFal(prompt: string): Promise<Buffer> {
  fal.config({ credentials: process.env.FAL_KEY });
  const result = await fal.subscribe("fal-ai/nano-banana-2", {
    input: {
      prompt: prompt + STYLE_SUFFIX,
      resolution: "0.5K", // ประหยัดสุด (~$0.06)
      aspect_ratio: "1:1",
      output_format: "png",
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const url = (result as any)?.data?.images?.[0]?.url ?? (result as any)?.images?.[0]?.url;
  if (!url) throw new Error("Fal ไม่มี image url");
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

async function genOpenAI(prompt: string): Promise<Buffer> {
  const openai = new OpenAI();
  const r = await openai.images.generate({
    model: "gpt-image-1",
    prompt: prompt + STYLE_SUFFIX,
    size: "1024x1024",
    quality: "low", // ประหยัดสุด (~$0.011)
  });
  const b64 = r.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI ไม่มี b64_json");
  return Buffer.from(b64, "base64");
}

// ใช้ OpenAI ก่อน (ถูกกว่า ~5 เท่า) ถ้า fail หรือติด content flag ค่อยสลับไป Fal (Gemini ผ่อนปรนกว่า)
async function genWithFallback(prompt: string): Promise<Buffer> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasFal = !!process.env.FAL_KEY;
  if (hasOpenAI) {
    try {
      return await genOpenAI(prompt);
    } catch (e) {
      if (hasFal) {
        console.warn("OpenAI ล้มเหลว/ติด flag → สลับไป Fal:", prompt, e);
        return await genFal(prompt);
      }
      throw e;
    }
  }
  if (hasFal) return await genFal(prompt);
  throw new Error("ไม่มี provider สำหรับสร้างภาพ");
}

export async function generateImages(prompts: string[]): Promise<Record<string, string>> {
  const hasFal = !!process.env.FAL_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const out: Record<string, string> = {};
  if (!hasFal && !hasOpenAI) return out;

  const unique = [...new Set(prompts.map((p) => p.trim()).filter(Boolean))];

  await Promise.all(
    unique.map(async (prompt) => {
      const hash = hashPrompt(prompt);
      const cached = await readCache(hash);
      if (cached) {
        out[prompt] = cached;
        return;
      }
      try {
        const buf = await genWithFallback(prompt);
        out[prompt] = await writeCache(hash, buf);
      } catch (e) {
        console.error("สร้างภาพไม่สำเร็จ:", prompt, e);
        // ข้ามภาพนี้ไป สไลด์ยังเรนเดอร์ได้โดยไม่มีภาพ
      }
    }),
  );

  return out;
}
