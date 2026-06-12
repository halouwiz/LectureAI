"use client";

import { useState } from "react";
import type { Deck } from "@/lib/schema";
import SlideRenderer from "@/components/SlideRenderer";
import { exportDeckToPdf, exportDeckToJpg } from "@/lib/export";

const LEVELS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

const MODELS = [
  { id: "claude-opus-4-8", label: "Opus 4.8" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
];

// Default ชั้นปีตามวันจริง (ผู้ใช้เลื่อนชั้นตามเวลา)
// ตอนนี้–เม.ย.2570 = ปี 2, เม.ย.2570–เม.ย.2571 = ปี 3, เม.ย.2571 เป็นต้นไป = ปี 4
function defaultLevelByDate(): string {
  const now = new Date();
  if (now < new Date("2027-04-01")) return "ปี 2";
  if (now < new Date("2028-04-01")) return "ปี 3";
  return "ปี 4";
}

type PdfFile = { name: string; data: string };
type ImageFile = { name: string; media_type: string; data: string };

function fileToBase64(file: File): Promise<{ name: string; media_type: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ name: file.name, media_type: file.type, data: result.split(",")[1] ?? "" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState(defaultLevelByDate);
  const [model, setModel] = useState("claude-opus-4-8");
  const [theme, setTheme] = useState("");
  const [extra, setExtra] = useState("");
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [exporting, setExporting] = useState("");
  const [genImages, setGenImages] = useState<Record<string, string>>({});
  const [genLoading, setGenLoading] = useState(false);

  async function fetchGenImages(d: Deck) {
    const set = new Set<string>();
    for (const s of d.sheets) {
      for (const sec of s.sections ?? []) if (sec.imagePrompt) set.add(sec.imagePrompt);
      for (const row of s.table?.rows ?? []) if (row.imagePrompt) set.add(row.imagePrompt);
      if (s.central?.imagePrompt) set.add(s.central.imagePrompt);
    }
    const prompts = [...set];
    if (prompts.length === 0) return;
    setGenLoading(true);
    try {
      const r = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      const data = await r.json();
      if (data.images) setGenImages(data.images);
    } catch {
      // ภาพไม่ขึ้นก็ไม่เป็นไร สไลด์ยังใช้ได้
    } finally {
      setGenLoading(false);
    }
  }

  async function handleExport(kind: "pdf" | "jpg") {
    if (!deck || exporting) return;
    setError("");
    setExporting(kind);
    try {
      if (kind === "pdf") await exportDeckToPdf(deck.deckTitle);
      else await exportDeckToJpg(deck.deckTitle);
    } catch (e) {
      setError("สร้างไฟล์ไม่สำเร็จ: " + (e instanceof Error ? e.message : "ลองใหม่อีกครั้ง"));
    } finally {
      setExporting("");
    }
  }

  async function onPickPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const read = await Promise.all(files.map(fileToBase64));
    setPdfs((prev) => [...prev, ...read.map((r) => ({ name: r.name, data: r.data }))]);
    e.target.value = "";
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const read = await Promise.all(files.map(fileToBase64));
    setImages((prev) => [...prev, ...read]);
    e.target.value = "";
  }

  async function handleGenerate() {
    setError("");
    setDeck(null);
    setGenImages({});
    if (!text.trim() && pdfs.length === 0 && images.length === 0) {
      setError("ใส่เนื้อหาอย่างน้อย 1 อย่าง (ข้อความ / PDF / รูปภาพ) นะคะ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          level,
          theme,
          extra,
          model,
          pdfs: pdfs.map((p) => ({ data: p.data })),
          images: images.map((i) => ({ media_type: i.media_type, data: i.data })),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "เกิดข้อผิดพลาด");
      else {
        const d = data as Deck;
        setDeck(d);
        fetchGenImages(d);
      }
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { borderColor: "#F0D8DF", color: "#5a4a52" };
  const labelStyle = { color: "#C94F6D" };

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "#FFF5F8" }}>
      <div className="mx-auto max-w-[600px]">
        <header className="mb-6 text-center">
          <h1 className="font-itim text-4xl" style={{ color: "#C94F6D" }}>
            LectureAI
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#AE8290" }}>
            วางเลคเชอร์ → ได้สไลด์สรุปน่ารักๆ อ่านง่ายบน iPad
          </p>
        </header>

        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#F0D8DF" }}>
          {/* ช่องอินพุต 3 แบบ */}
          <div className="font-itim mb-1 text-sm" style={labelStyle}>1. ข้อความ (วาง/พิมพ์)</div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="วางเนื้อหาจากเลคเชอร์/สไลด์อาจารย์ตรงนี้..."
            rows={6}
            className="w-full resize-y rounded-xl border p-3 text-sm outline-none"
            style={inputStyle}
          />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="font-itim mb-1 text-sm" style={labelStyle}>2. ไฟล์ PDF</div>
              <input type="file" accept="application/pdf" multiple onChange={onPickPdfs} className="w-full text-xs" />
              <FileChips files={pdfs.map((p) => p.name)} onRemove={(i) => setPdfs((prev) => prev.filter((_, k) => k !== i))} />
            </div>
            <div>
              <div className="font-itim mb-1 text-sm" style={labelStyle}>3. รูปภาพ (แคปหน้าจอ)</div>
              <input type="file" accept="image/*" multiple onChange={onPickImages} className="w-full text-xs" />
              <FileChips files={images.map((i) => i.name)} onRemove={(i) => setImages((prev) => prev.filter((_, k) => k !== i))} />
            </div>
          </div>

          {/* ตัวเลือกเพิ่มเติม */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="font-itim mb-1 text-sm" style={labelStyle}>🎨 ธีมสีที่อยากได้</div>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="เช่น ฟ้าพาสเทล, เขียวมิ้นต์, ชมพูหวาน"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <div className="font-itim mb-1 text-sm" style={labelStyle}>📚 ชั้นปี</div>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="font-itim mb-1 text-sm" style={labelStyle}>🤖 โมเดล Claude (เปลี่ยนตามขนาดงาน)</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <div className="font-itim mb-1 text-sm" style={labelStyle}>✏️ ความต้องการเพิ่มเติม (สั่ง AI)</div>
            <input
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="เช่น เน้นคำศัพท์ที่ออกสอบ, ใส่ตัวอย่างเยอะๆ, สรุปสั้นๆ"
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="font-itim rounded-full px-7 py-2.5 text-white transition disabled:opacity-60"
              style={{ background: "#D4537E" }}
            >
              {loading ? "กำลังสรุป..." : "สร้างสรุป ✨"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border p-3 text-sm" style={{ background: "#FCEBEB", borderColor: "#F4B6B6", color: "#A32D2D" }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-center text-sm" style={{ color: "#C18FA0" }}>
            กำลังให้ AI ย่อและจัดสไลด์... ⏳ (อาจใช้เวลาสักครู่)
          </p>
        ) : null}

        {deck ? (
          <section className="mt-8">
            <h2 className="font-itim mb-3 text-center text-xl" style={{ color: "#C94F6D" }}>
              {deck.deckTitle}
            </h2>
            <div className="mb-5 flex justify-center gap-3">
              <button
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
                className="font-itim rounded-full border px-5 py-2 text-sm transition disabled:opacity-60"
                style={{ borderColor: "#D4537E", color: "#C94F6D", background: "#fff" }}
              >
                {exporting === "pdf" ? "กำลังสร้าง..." : "⬇️ ดาวน์โหลด PDF (ทุกหน้า)"}
              </button>
              <button
                onClick={() => handleExport("jpg")}
                disabled={!!exporting}
                className="font-itim rounded-full border px-5 py-2 text-sm transition disabled:opacity-60"
                style={{ borderColor: "#D4537E", color: "#C94F6D", background: "#fff" }}
              >
                {exporting === "jpg" ? "กำลังสร้าง..." : "⬇️ ดาวน์โหลด JPG (ภาพยาว)"}
              </button>
            </div>
            {genLoading ? (
              <p className="mb-4 text-center text-sm" style={{ color: "#C18FA0" }}>
                🎨 กำลังวาดภาพประกอบด้วย AI... (สไลด์ใช้ได้เลย ภาพจะค่อยๆ ขึ้น)
              </p>
            ) : null}
            <div className="flex flex-col gap-8">
              {deck.sheets.map((sheet, i) => (
                <SlideRenderer key={i} sheet={sheet} images={genImages} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function FileChips({ files, onRemove }: { files: string[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {files.map((name, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs" style={{ background: "#FBE6EC", color: "#A53F5B" }}>
          {name.length > 18 ? name.slice(0, 16) + "…" : name}
          <button onClick={() => onRemove(i)} className="font-bold" aria-label="ลบ">×</button>
        </span>
      ))}
    </div>
  );
}
