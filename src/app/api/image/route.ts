import { generateImages } from "@/lib/imagegen";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro รองรับสูงสุด 300 วิ

export async function POST(request: Request) {
  let body: { prompts?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ images: {} });
  }

  const prompts = Array.isArray(body.prompts)
    ? body.prompts.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    : [];

  if (prompts.length === 0) return Response.json({ images: {} });

  try {
    const { images, errors } = await generateImages(prompts);
    return Response.json({ images, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "image error";
    return Response.json({ images: {}, error: message }, { status: 200 });
  }
}
