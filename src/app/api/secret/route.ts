import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const secretPath = path.join(process.cwd(), 'secret.txt');
        if (!fs.existsSync(secretPath)) {
            return NextResponse.json({ error: 'Secret file not found' }, { status: 404 });
        }
        const encoded = fs.readFileSync(secretPath, 'utf-8').trim();
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        return NextResponse.json({ secret: decoded });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read secret' }, { status: 500 });
    }
}
