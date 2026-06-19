// รับ client upload ของไฟล์ PDF ตรงไปยัง Vercel Blob (ไม่ผ่าน serverless body ลิมิต 4.5MB)
// หน้าเว็บเรียก upload() จาก @vercel/blob/client โดยชี้ handleUploadUrl มาที่นี่
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  // client upload ต้องใช้ BLOB_READ_WRITE_TOKEN (OIDC ตัวเดียวไม่พอ) — บอกให้ชัดถ้ายังไม่ได้ตั้ง
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      {
        error:
          "ยังไม่ได้ตั้งค่า BLOB_READ_WRITE_TOKEN บน Vercel (จำเป็นสำหรับอัปไฟล์ใหญ่) — เพิ่ม Environment Variable นี้แล้ว redeploy นะคะ",
      },
      { status: 500 },
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf", "image/jpeg", "image/png"], // PDF + รูปหน้า PDF ที่เรนเดอร์
        addRandomSuffix: true,
        maximumSizeInBytes: 50 * 1024 * 1024, // รับไฟล์ใหญ่ได้ถึง 50MB
        // เก็บไว้ใน prefix เดียวกับรูป จะได้จัดการง่าย
        // (ลิงก์เป็น public เพื่อให้ /api/generate ดึงไปส่ง AI ได้)
      }),
      onUploadCompleted: async () => {
        // ไม่ต้องทำอะไรเพิ่ม — หน้าเว็บได้ url กลับไปเองแล้ว
      },
    });
    return Response.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ";
    return Response.json({ error: message }, { status: 400 });
  }
}
