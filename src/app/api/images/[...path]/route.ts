import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: { path: string[] } }
) {
    try {
        const filename = path.basename(params.path[0]);
        const filePath = path.join(process.cwd(), 'data', 'uploads', filename);

        // Security check: ensure the file is actually inside the uploads folder
        const resolvedPath = path.resolve(filePath);
        const uploadsDir = path.resolve(path.join(process.cwd(), 'data', 'uploads'));

        if (!resolvedPath.startsWith(uploadsDir + path.sep)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const fileBuffer = await fs.readFile(filePath);

        // Determine content type based on extension
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.heic' || ext === '.heif') contentType = 'image/heic';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('Not Found', { status: 404 });
    }
}
