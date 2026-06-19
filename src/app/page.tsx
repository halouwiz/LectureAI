"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import type { RenderedPage } from "@/lib/pdfRender"; // type เท่านั้น (เลี่ยงโหลด pdfjs ตอน SSR)
import type { Deck } from "@/lib/schema";
import SlideRenderer from "@/components/SlideRenderer";
import { exportDeckToPdf, exportDeckToJpg } from "@/lib/export";

const LEVELS = ["ปี 1", "ปี 2", "ปี 3", "ปี 4"];

// ประวัติงานเก่า (History) เก็บใน localStorage — เฉพาะเครื่อง/บราวเซอร์นี้, เก็บล่าสุด 15 ชิ้น
const HISTORY_KEY = "lectureai_history";
const HISTORY_MAX = 15;
type HistoryEntry = { id: string; title: string; date: string; deck: Deck; images: Record<string, string> };

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-opus-4-8", label: "Opus 4.8" },
];

// Default ชั้นปีตามวันจริง (ผู้ใช้เลื่อนชั้นตามเวลา)
// ตอนนี้–เม.ย.2570 = ปี 2, เม.ย.2570–เม.ย.2571 = ปี 3, เม.ย.2571 เป็นต้นไป = ปี 4
function defaultLevelByDate(): string {
  const now = new Date();
  if (now < new Date("2027-04-01")) return "ปี 2";
  if (now < new Date("2028-04-01")) return "ปี 3";
  return "ปี 4";
}

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
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [theme, setTheme] = useState("");
  const [extra, setExtra] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]); // เก็บไฟล์ดิบ แล้วค่อยอัปขึ้น Blob ตอนกดสร้าง
  const [usePdfFigures, setUsePdfFigures] = useState(false); // ดึงรูปจริงจาก PDF มาใส่สไลด์
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [exporting, setExporting] = useState("");
  const [genImages, setGenImages] = useState<Record<string, string>>({});
  const [genLoading, setGenLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // โหลดประวัติงานเก่าตอนเปิดหน้า
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryEntry[]);
    } catch {
      // ประวัติเสียก็ข้ามไป
    }
  }, []);

  function saveToHistory(d: Deck, imgs: Record<string, string>) {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      title: d.deckTitle || "ไม่มีชื่อ",
      date: new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }),
      deck: d,
      images: imgs,
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, HISTORY_MAX);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // เต็มก็ไม่เป็นไร
      }
      return next;
    });
  }

  function loadFromHistory(entry: HistoryEntry) {
    setError("");
    setDeck(entry.deck);
    setGenImages(entry.images ?? {});
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteFromHistory(id: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ข้าม
      }
      return next;
    });
  }

  // ปุ่ม Clear: ล้างฟอร์ม+ผลลัพธ์ เพื่อเริ่มงานใหม่ (ไม่ลบประวัติงานเก่า)
  function handleClear() {
    setText("");
    setTheme("");
    setExtra("");
    setPdfFiles([]);
    setImages([]);
    setDeck(null);
    setGenImages({});
    setError("");
    setGenLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function fetchGenImages(d: Deck): Promise<Record<string, string>> {
    const set = new Set<string>();
    for (const s of d.sheets) {
      for (const sec of s.sections ?? []) if (sec.imagePrompt) set.add(sec.imagePrompt);
      for (const row of s.table?.rows ?? []) if (row.imagePrompt) set.add(row.imagePrompt);
      if (s.central?.imagePrompt) set.add(s.central.imagePrompt);
    }
    const prompts = [...set];
    if (prompts.length === 0) return {};
    setGenLoading(true);
    try {
      const r = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts }),
      });
      const data = await r.json();
      const imgs = (data.images ?? {}) as Record<string, string>;
      setGenImages(imgs);
      return imgs;
    } catch {
      // ภาพไม่ขึ้นก็ไม่เป็นไร สไลด์ยังใช้ได้
      return {};
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

  function onPickPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPdfFiles((prev) => [...prev, ...files]);
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
    if (!text.trim() && pdfFiles.length === 0 && images.length === 0) {
      setError("ใส่เนื้อหาอย่างน้อย 1 อย่าง (ข้อความ / PDF / รูปภาพ) นะคะ");
      return;
    }
    setLoading(true);
    try {
      // อัป PDF ขึ้น Vercel Blob ก่อน (ตรงจากบราวเซอร์ → ไม่ติดลิมิต body 4.5MB) แล้วส่งแค่ลิงก์
      let pdfUrls: string[] = [];
      let pageImages: string[] = [];
      let renderedPages: RenderedPage[] = [];
      if (pdfFiles.length > 0) {
        setUploading(true);
        try {
          pdfUrls = await Promise.all(
            pdfFiles.map(async (file) => {
              const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/pdf-upload" });
              return blob.url;
            }),
          );

          // ถ้าเปิด "ใช้ภาพจริงจาก PDF": เรนเดอร์หน้าในเบราว์เซอร์ + อัปรูปหน้าขึ้น Blob ให้ AI ดู
          if (usePdfFigures) {
            const { renderPdfPages } = await import("@/lib/pdfRender"); // โหลดเฉพาะฝั่ง client
            for (const file of pdfFiles) {
              const pages = await renderPdfPages(file, { maxPages: 20 });
              renderedPages = renderedPages.concat(pages);
            }
            pageImages = await Promise.all(
              renderedPages.map(async (pg, idx) => {
                const blob = await fetch(pg.dataUrl).then((r) => r.blob());
                const up = await upload(`page-${idx + 1}.jpg`, blob, { access: "public", handleUploadUrl: "/api/pdf-upload" });
                return up.url;
              }),
            );
          }
        } catch (e) {
          setError("อัปโหลด/เตรียมไฟล์ PDF ไม่สำเร็จ: " + (e instanceof Error ? e.message : "ลองใหม่อีกครั้ง"));
          setUploading(false);
          setLoading(false);
          return;
        }
        setUploading(false);
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          level,
          theme,
          extra,
          model,
          pdfUrls,
          pageImages,
          images: images.map((i) => ({ media_type: i.media_type, data: i.data })),
        }),
      });
      // ตัว response มี heartbeat (ช่องว่าง) นำหน้า แล้วตามด้วย JSON จริงท้ายสุด → อ่านทั้งก้อนแล้ว parse
      const raw = await res.text();
      let data: Deck | { error?: string };
      try {
        const start = raw.indexOf("{");
        data = JSON.parse(start >= 0 ? raw.slice(start) : raw.trim());
      } catch {
        setError("อ่านผลลัพธ์จากเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้งนะคะ");
        return;
      }
      if (!res.ok || (data as { error?: string }).error) {
        setError((data as { error?: string }).error ?? "เกิดข้อผิดพลาด");
      } else {
        const d = data as Deck;
        // ครอปภาพจริงจาก PDF ตามพิกัดที่ AI ชี้ → เติม pdfFigureUrl ให้แต่ละ section
        if (renderedPages.length > 0) {
          const { cropFromPage } = await import("@/lib/pdfRender");
          const byPage = new Map(renderedPages.map((p) => [p.page, p.canvas]));
          for (const sheet of d.sheets) {
            for (const sec of sheet.sections ?? []) {
              const fig = sec.pdfFigure;
              if (fig && byPage.has(fig.page)) {
                const cropped = cropFromPage(byPage.get(fig.page)!, fig.bbox);
                if (cropped) sec.pdfFigureUrl = cropped;
              }
            }
          }
        }
        setDeck(d);
        const imgs = await fetchGenImages(d);
        saveToHistory(d, imgs);
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

        {/* แถบเครื่องมือ: ดูงานเก่า */}
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="font-itim rounded-full border px-4 py-1.5 text-sm transition"
            style={{ borderColor: "#E4B7C4", color: "#C94F6D", background: "#fff" }}
          >
            📚 งานเก่า{history.length > 0 ? ` (${history.length})` : ""}
          </button>
        </div>

        {showHistory ? (
          <div className="mb-4 rounded-2xl border bg-white p-4" style={{ borderColor: "#F0D8DF" }}>
            <div className="font-itim mb-2 text-sm" style={{ color: "#C94F6D" }}>
              งานที่เคยสร้าง (Backup ในเครื่องนี้ • เก็บล่าสุด {HISTORY_MAX} ชิ้น)
            </div>
            {history.length === 0 ? (
              <p className="py-3 text-center text-sm" style={{ color: "#C18FA0" }}>
                ยังไม่มีงานเก่า — พอสร้างสรุปเสร็จจะถูกบันทึกไว้ตรงนี้อัตโนมัติ ✨
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
                    style={{ borderColor: "#F0D8DF", background: "#FFF9FB" }}
                  >
                    <button
                      onClick={() => loadFromHistory(h)}
                      className="min-w-0 flex-1 text-left"
                      title="กดเพื่อเปิดดู/ดาวน์โหลดอีกครั้ง"
                    >
                      <div className="font-itim truncate text-sm" style={{ color: "#A53F5B" }}>
                        {h.title}
                      </div>
                      <div className="text-xs" style={{ color: "#C18FA0" }}>
                        {h.date} • {h.deck.sheets?.length ?? 0} หน้า
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => loadFromHistory(h)}
                        className="font-itim rounded-full px-3 py-1 text-xs text-white"
                        style={{ background: "#D4537E" }}
                      >
                        เปิด
                      </button>
                      <button
                        onClick={() => deleteFromHistory(h.id)}
                        className="font-itim rounded-full border px-2 py-1 text-xs"
                        style={{ borderColor: "#E4B7C4", color: "#C94F6D", background: "#fff" }}
                        aria-label="ลบงานนี้"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

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
              <FileChips files={pdfFiles.map((f) => f.name)} onRemove={(i) => setPdfFiles((prev) => prev.filter((_, k) => k !== i))} />
              {pdfFiles.length > 0 ? (
                <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs" style={{ color: "#A86A7C" }}>
                  <input type="checkbox" checked={usePdfFigures} onChange={(e) => setUsePdfFigures(e.target.checked)} className="mt-0.5" />
                  <span>🖼️ ใช้ภาพจริงจาก PDF (เช่นภาพ anatomy) — แม่นกว่าแต่ช้า/ค่าใช้จ่ายเพิ่มนิดหน่อย</span>
                </label>
              ) : null}
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

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleClear}
              disabled={loading}
              className="font-itim rounded-full border px-5 py-2.5 text-sm transition disabled:opacity-60"
              style={{ borderColor: "#E4B7C4", color: "#C94F6D", background: "#fff" }}
            >
              🧹 เริ่มใหม่
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="font-itim rounded-full px-7 py-2.5 text-white transition disabled:opacity-60"
              style={{ background: "#D4537E" }}
            >
              {uploading ? "กำลังอัปโหลด..." : loading ? "กำลังสรุป..." : "สร้างสรุป ✨"}
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
            {uploading
              ? usePdfFigures
                ? "กำลังเตรียมรูปจาก PDF... 🖼️ (เรนเดอร์หน้า + อัปขึ้นคลาวด์)"
                : "กำลังอัปโหลดไฟล์ PDF ขึ้นคลาวด์... ☁️"
              : "กำลังให้ AI ย่อและจัดสไลด์... ⏳ (ไฟล์ใหญ่อาจใช้เวลาหลายนาที ใจเย็นๆ นะคะ)"}
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
