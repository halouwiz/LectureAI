// โครงข้อมูล (JSON Schema) ที่บังคับให้ Claude ตอบกลับ + TypeScript types
// ใช้กับ output_config.format ของ Claude API

export type SlideColor =
  | "blush" | "blue" | "amber" | "green"
  | "purple" | "coral" | "red" | "teal";

export type IllustrationName =
  | "none" | "skin_layers" | "wound_clot" | "wound_inflammation"
  | "wound_granulation" | "wound_scar" | "virus" | "bacteria" | "fungus"
  | "parasite" | "thermometer" | "water_glass" | "mask" | "soap"
  | "knee" | "pill" | "bandage" | "shield" | "dumbbell" | "weight"
  // อวัยวะน่ารักๆ
  | "heart" | "lungs" | "brain" | "stomach" | "kidney" | "bone" | "tooth" | "intestine" | "eye"
  // อุปกรณ์การแพทย์
  | "syringe" | "capsule" | "stethoscope" | "iv_bag" | "medicine_bottle" | "blood_drop" | "gloves"
  // คน + ตกแต่ง
  | "nurse" | "person" | "flower" | "star" | "heart_deco" | "leaf";

// ภาพจริงจาก PDF: AI ระบุหน้า + กรอบ (normalize 0–1) ของรูปที่ช่วยให้เข้าใจ
export interface PdfFigure {
  page: number; // เลขหน้า (1-based) ตามที่แนบไป
  bbox: [number, number, number, number]; // [x0,y0,x1,y1] สัดส่วน 0–1 เทียบทั้งหน้า
}

export interface Section {
  heading: string;
  headingEn?: string;
  color: SlideColor;
  meta?: string;
  illustration?: IllustrationName;
  imagePrompt?: string;
  pdfFigure?: PdfFigure; // AI ชี้รูปจริงจาก PDF (ถ้ามี)
  pdfFigureUrl?: string; // เติมฝั่ง client หลังครอป (data URL) — ไม่ได้มาจาก AI
  points: string[];
}

export interface Central {
  label: string;
  labelEn?: string;
  note?: string;
  illustration?: IllustrationName;
  imagePrompt?: string;
}

export interface TableRow {
  label?: string;
  labelEn?: string;
  illustration?: IllustrationName;
  imagePrompt?: string;
  cells: string[];
  result?: "yes" | "no" | "na";
}

export interface SheetTable {
  columns: string[];
  rows: TableRow[];
}

export interface Callout {
  style: "warning" | "tip" | "info";
  text: string;
}

export interface Sheet {
  layout: "cards" | "timeline" | "mindmap" | "table";
  title: string;
  subtitle?: string;
  level?: string;
  accentColor: SlideColor;
  intro?: string;
  sections?: Section[];
  central?: Central;
  table?: SheetTable;
  callout?: Callout;
}

export interface Deck {
  deckTitle: string;
  sheets: Sheet[];
}

const colorEnum = ["blush", "blue", "amber", "green", "purple", "coral", "red", "teal"];

// JSON Schema (Structured Outputs) — ทุก object มี additionalProperties:false, ใช้ enum คุมค่า
export const slideSchema = {
  type: "object",
  additionalProperties: false,
  required: ["deckTitle", "sheets"],
  properties: {
    deckTitle: { type: "string" },
    sheets: { type: "array", items: { $ref: "#/$defs/sheet" } },
  },
  $defs: {
    sheet: {
      type: "object",
      additionalProperties: false,
      required: ["layout", "title", "accentColor"],
      properties: {
        layout: { type: "string", enum: ["cards", "timeline", "mindmap", "table"] },
        title: { type: "string" },
        subtitle: { type: "string" },
        level: { type: "string" },
        accentColor: { $ref: "#/$defs/color" },
        intro: { type: "string" },
        sections: { type: "array", items: { $ref: "#/$defs/section" } },
        central: { $ref: "#/$defs/central" },
        table: { $ref: "#/$defs/table" },
        callout: { $ref: "#/$defs/callout" },
      },
    },
    section: {
      type: "object",
      additionalProperties: false,
      required: ["heading", "color", "points"],
      properties: {
        heading: { type: "string" },
        headingEn: { type: "string" },
        color: { $ref: "#/$defs/color" },
        meta: { type: "string" },
        illustration: { $ref: "#/$defs/illustration" },
        imagePrompt: { type: "string" },
        points: { type: "array", items: { type: "string" } },
      },
    },
    central: {
      type: "object",
      additionalProperties: false,
      required: ["label"],
      properties: {
        label: { type: "string" },
        labelEn: { type: "string" },
        note: { type: "string" },
        illustration: { $ref: "#/$defs/illustration" },
        imagePrompt: { type: "string" },
      },
    },
    table: {
      type: "object",
      additionalProperties: false,
      required: ["columns", "rows"],
      properties: {
        columns: { type: "array", items: { type: "string" } },
        rows: { type: "array", items: { $ref: "#/$defs/row" } },
      },
    },
    row: {
      type: "object",
      additionalProperties: false,
      required: ["cells"],
      properties: {
        label: { type: "string" },
        labelEn: { type: "string" },
        illustration: { $ref: "#/$defs/illustration" },
        imagePrompt: { type: "string" },
        cells: { type: "array", items: { type: "string" } },
        result: { type: "string", enum: ["yes", "no", "na"] },
      },
    },
    callout: {
      type: "object",
      additionalProperties: false,
      required: ["style", "text"],
      properties: {
        style: { type: "string", enum: ["warning", "tip", "info"] },
        text: { type: "string" },
      },
    },
    color: { type: "string", enum: colorEnum },
    // illustration เป็น string ธรรมดา (ไม่ใส่ enum) เพื่อให้ grammar compilation เร็ว
    // — รายชื่อภาพที่ใช้ได้อยู่ใน system prompt, ตัวเรนเดอร์คืน null ถ้าชื่อไม่รู้จัก
    illustration: { type: "string" },
  },
} as const;
