import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { MAX_UPLOAD_SIZE, validateImageMagicBytes, generateRandomFilename } from "@/lib/fileValidation";

import { verifyWriteAccess } from "@/lib/sandbox/guard";
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (session?.user?.tenantId) {
      await verifyWriteAccess(session.user.tenantId);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Please add keys to .env." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "cortexfit";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: `File exceeds maximum size of ${MAX_UPLOAD_SIZE / 1024 / 1024}MB` }, { status: 400 });
    }

    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate Magic Bytes
    const { valid, mime } = validateImageMagicBytes(buffer);
    if (!valid) {
      return NextResponse.json({ error: "Invalid file content. Only real images are allowed." }, { status: 400 });
    }

    const randomName = generateRandomFilename(file.name);

    // Upload using upload_stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder, resource_type: "image", public_id: randomName.split(".")[0], format: mime?.split("/")[1] },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
    });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
