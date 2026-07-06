import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // path.basename 防止檔名夾帶 ../ 路徑跳脫；再過濾 Windows 不允許的字元
        const safeName = path.basename(file.name).replace(/[\\/:*?"<>|\s]+/g, '-');
        const filename = `${Date.now()}-${safeName}`;
        const uploadDir = path.join(process.cwd(), 'data', 'uploads');

        // Ensure directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);

        // Return the API path to access this image
        return NextResponse.json({
            url: `/api/images/${filename}`,
            filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
