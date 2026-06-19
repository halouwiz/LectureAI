"use client";

import { createContext, useContext, type CSSProperties } from "react";
import type { Sheet, Section, SlideColor, TableRow, IllustrationName } from "@/lib/schema";
import Illustration from "./Illustration";

const ImagesContext = createContext<Record<string, string>>({});

function SlideArt({ illustration, imagePrompt }: { illustration?: IllustrationName; imagePrompt?: string }) {
  const images = useContext(ImagesContext);
  if (illustration && illustration !== "none") {
    return (
      <span style={{ flex: "none", display: "inline-flex" }}>
        <Illustration name={illustration} />
      </span>
    );
  }
  const url = imagePrompt ? images[imagePrompt] : undefined;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={44} height={44} style={{ flex: "none", borderRadius: 10, objectFit: "contain" }} />;
  }
  return null;
}

type Palette = { card: string; chipBg: string; chipText: string; dot: string; text: string };

const COLORS: Record<SlideColor, Palette> = {
  blue: { card: "#E6F1FB", chipBg: "#B5D4F4", chipText: "#0C447C", dot: "#378ADD", text: "#27456b" },
  amber: { card: "#FAEEDA", chipBg: "#FAC775", chipText: "#854F0B", dot: "#EF9F27", text: "#6e470d" },
  green: { card: "#EAF3DE", chipBg: "#C0DD97", chipText: "#3B6D11", dot: "#639922", text: "#33600f" },
  purple: { card: "#EEEDFE", chipBg: "#CECBF6", chipText: "#3C3489", dot: "#7F77DD", text: "#352d77" },
  coral: { card: "#FAECE7", chipBg: "#F5C4B3", chipText: "#993C1D", dot: "#D85A30", text: "#8a4730" },
  red: { card: "#FCEBEB", chipBg: "#F4B6B6", chipText: "#A32D2D", dot: "#E24B4A", text: "#8a3a3a" },
  teal: { card: "#E1F5EE", chipBg: "#9FE1CB", chipText: "#0F6E56", dot: "#1D9E75", text: "#0f5a48" },
  blush: { card: "#FBE6EC", chipBg: "#F7C5D2", chipText: "#A53F5B", dot: "#D4537E", text: "#9c3f5a" },
};

const chip = (p: Palette): CSSProperties => ({
  display: "inline-flex",
  fontFamily: "'Itim', sans-serif",
  fontSize: 15.5,
  padding: "3px 12px",
  borderRadius: 999,
  background: p.chipBg,
  color: p.chipText,
  maxWidth: "100%",
  overflowWrap: "anywhere",
});

function Heading({ s }: { s: Section }) {
  const p = COLORS[s.color];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={chip(p)}>
        {s.heading}
        {s.headingEn ? ` · ${s.headingEn}` : ""}
      </span>
      <SlideArt illustration={s.illustration} imagePrompt={s.imagePrompt} />
    </div>
  );
}

// ภาพจริงจาก PDF (ครอปฝั่ง client มาเป็น data URL) — แสดงเต็มความกว้างการ์ด
function PdfFigure({ s }: { s: Section }) {
  if (!s.pdfFigureUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={s.pdfFigureUrl}
      alt=""
      style={{ display: "block", width: "100%", maxHeight: 210, objectFit: "contain", borderRadius: 12, marginTop: 9, background: "#fff", border: "1px solid #efd9e0" }}
    />
  );
}

function Points({ s }: { s: Section }) {
  const p = COLORS[s.color];
  return (
    <div style={{ color: p.text }}>
      {s.points.map((pt, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 15, lineHeight: 1.55, marginTop: 7, minWidth: 0 }}>
          <span style={{ flex: "none", width: 7, height: 7, borderRadius: "50%", marginTop: 8, background: p.dot }} />
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{pt}</span>
        </div>
      ))}
    </div>
  );
}

function Cards({ sections }: { sections: Section[] }) {
  // เรียงแนวตั้งเต็มความกว้าง อ่านง่ายกว่าอัดเป็นกรอบเล็ก 2 คอลัมน์
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map((s, i) => (
        <div key={i} style={{ background: COLORS[s.color].card, borderRadius: 16, padding: "13px 16px 14px" }}>
          <Heading s={s} />
          <Points s={s} />
          <PdfFigure s={s} />
        </div>
      ))}
    </div>
  );
}

function Timeline({ sections }: { sections: Section[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {sections.map((s, i) => {
        const p = COLORS[s.color];
        return (
          <div key={i}>
            <div style={{ background: p.card, borderRadius: 15, padding: "9px 12px", display: "flex", gap: 11, alignItems: "center" }}>
              <SlideArt illustration={s.illustration} imagePrompt={s.imagePrompt} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ ...chip(p), padding: "2px 9px" }}>
                    {i + 1}. {s.heading}
                    {s.headingEn ? ` · ${s.headingEn}` : ""}
                  </span>
                </div>
                {s.meta ? <div style={{ fontSize: 11.5, color: p.dot, margin: "3px 0 1px" }}>{s.meta}</div> : null}
                <Points s={s} />
                <PdfFigure s={s} />
              </div>
            </div>
            {i < sections.length - 1 ? (
              <div style={{ textAlign: "center", color: "#DC9DAE", fontSize: 16, lineHeight: 0.9 }}>↓</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function Mindmap({ sheet }: { sheet: Sheet }) {
  const sections = sheet.sections ?? [];
  const c = sheet.central;
  const cp = COLORS.blush;
  return (
    <div>
      {c ? (
        <div style={{ background: cp.chipBg, border: "2px solid #E892A6", borderRadius: 16, padding: "10px 12px", textAlign: "center", maxWidth: 220, margin: "0 auto 6px" }}>
          <div className="font-itim" style={{ fontSize: 20, color: cp.chipText, lineHeight: 1.1 }}>{c.label}</div>
          {c.labelEn ? <div style={{ fontSize: 11.5, color: "#B5607A", fontWeight: 500 }}>{c.labelEn}</div> : null}
          {c.note ? <div style={{ fontSize: 11, color: "#A86A7C", marginTop: 2 }}>{c.note}</div> : null}
        </div>
      ) : null}
      <div style={{ textAlign: "center", color: "#DC9DAE", fontSize: 16, lineHeight: 0.7, margin: "2px 0" }}>⋀</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
        {sections.map((s, i) => {
          const p = COLORS[s.color];
          return (
            <div key={i} style={{ background: p.card, border: `1.5px solid ${p.chipBg}`, borderRadius: 14, padding: "9px 11px" }}>
              <span style={{ ...chip(p), fontSize: 13 }}>
                {s.heading}
                {s.headingEn ? ` · ${s.headingEn}` : ""}
              </span>
              <div style={{ marginTop: 4 }}>
                {s.points.map((pt, j) => (
                  <span key={j} style={{ display: "inline-block", fontSize: 13.5, background: "#fff", border: `1.3px solid ${p.chipBg}`, color: p.chipText, borderRadius: 999, padding: "2px 9px", margin: "4px 4px 0 0" }}>
                    {pt}
                  </span>
                ))}
              </div>
              <PdfFigure s={s} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: NonNullable<TableRow["result"]> }) {
  const ok = result === "yes";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "'Itim', sans-serif", fontSize: 12, padding: "1px 8px", borderRadius: 999, marginRight: 5, background: ok ? "#C0DD97" : "#F4B6B6", color: ok ? "#2c5210" : "#8a2222" }}>
      {ok ? "✓" : "✗"}
    </span>
  );
}

function TableView({ sheet }: { sheet: Sheet }) {
  const t = sheet.table;
  if (!t) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px" }}>
      <tbody>
        <tr style={{ fontFamily: "'Itim', sans-serif", color: "#A53F5B", fontSize: 13 }}>
          {t.columns.map((col, i) => (
            <td key={i} style={{ padding: "0 9px 0" }}>{col}</td>
          ))}
        </tr>
        {t.rows.map((row, ri) => {
          const tint = row.result === "yes" ? "#EAF3DE" : row.result ? "#FBE9ED" : "#fff";
          const lastIdx = row.cells.length - 1;
          return (
            <tr key={ri} style={{ background: tint }}>
              <td style={{ padding: "8px 9px", borderRadius: "11px 0 0 11px", verticalAlign: "middle" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <SlideArt illustration={row.illustration} imagePrompt={row.imagePrompt} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{row.label}</div>
                    {row.labelEn ? <div style={{ fontSize: 11, color: "#9b7a86" }}>{row.labelEn}</div> : null}
                  </div>
                </div>
              </td>
              {row.cells.map((cell, ci) => (
                <td
                  key={ci}
                  style={{ padding: "8px 9px", fontSize: 12.5, color: "#6a4a55", verticalAlign: "middle", borderRadius: ci === lastIdx ? "0 11px 11px 0" : undefined }}
                >
                  {ci === lastIdx && row.result ? <ResultBadge result={row.result} /> : null}
                  {cell}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CalloutBox({ style, text }: { style: "warning" | "tip" | "info"; text: string }) {
  const theme = {
    warning: { bg: "#FBE1E6", border: "#E8A1B2", color: "#9c3f5a", label: "ระวัง!" },
    tip: { bg: "#FBF3DE", border: "#EBD49A", color: "#7a5a1a", label: "เคล็ดลับ" },
    info: { bg: "#E6F1FB", border: "#A9CBEC", color: "#27456b", label: "หมายเหตุ" },
  }[style];
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: theme.bg, border: `1.5px solid ${theme.border}`, borderRadius: 13, padding: "10px 13px", marginTop: 12 }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.color }}>
        <span className="font-itim" style={{ color: theme.color }}>{theme.label} </span>
        {text}
      </div>
    </div>
  );
}

export default function SlideRenderer({ sheet, images = {} }: { sheet: Sheet; images?: Record<string, string> }) {
  const accent = COLORS[sheet.accentColor] ?? COLORS.blush;
  const sections = sheet.sections ?? [];

  return (
    <ImagesContext.Provider value={images}>
    {/* กรอบกว้างเท่า iPad แต่ "สูงยืดได้ตามเนื้อหา" (minHeight 3:4) เน้นอ่านง่าย ไม่ย่อตัวหนังสือ */}
    <div
      className="lecture-slide"
      style={{
        width: "min(480px, 92vw)",
        minHeight: "calc(min(480px, 92vw) * 4 / 3)",
        margin: "0 auto",
        position: "relative",
        boxSizing: "border-box",
        backgroundColor: "#FFF6FA",
        backgroundImage:
          "linear-gradient(#F8E6EC 1px, transparent 1px), linear-gradient(90deg,#F8E6EC 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        border: "1.5px solid #F4DCE3",
        borderRadius: 18,
      }}
    >
      <div
        style={{
          fontFamily: "'Mali', sans-serif",
          color: "#6a4a55",
          padding: "18px 18px 20px",
        }}
      >
      {/* แถบหัวข้อมีพื้นหลังสี (accentColor) */}
      <div style={{ background: accent.chipBg, borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="font-itim" style={{ fontSize: 25, lineHeight: 1.1, color: accent.chipText }}>{sheet.title}</div>
          {sheet.subtitle ? <div style={{ fontSize: 12.5, marginTop: 1, color: accent.chipText, opacity: 0.85 }}>{sheet.subtitle}</div> : null}
        </div>
        {sheet.level ? (
          <span style={{ ...chip(COLORS.blush), flex: "none", background: "#fff", color: "#A53F5B" }}>{sheet.level}</span>
        ) : null}
      </div>

      <div>
        {sheet.intro ? <div style={{ fontSize: 14, color: "#9b7a86", marginBottom: 12 }}>{sheet.intro}</div> : null}

        {sheet.layout === "cards" ? <Cards sections={sections} /> : null}
        {sheet.layout === "timeline" ? <Timeline sections={sections} /> : null}
        {sheet.layout === "mindmap" ? <Mindmap sheet={sheet} /> : null}
        {sheet.layout === "table" ? <TableView sheet={sheet} /> : null}

        {sheet.callout ? <CalloutBox style={sheet.callout.style} text={sheet.callout.text} /> : null}
      </div>

      <div className="font-itim" style={{ textAlign: "center", fontSize: 11.5, color: "#C18FA0", marginTop: 10 }}>
        เอกสารสรุปเพื่อทบทวนบทเรียน · ตรวจสอบกับตำราและอาจารย์เสมอ
      </div>
      </div>
    </div>
    </ImagesContext.Provider>
  );
}
