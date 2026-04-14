import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'data.json');

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // ✅ Safety merge: read existing data first, then merge on top.
        // This prevents any single page from accidentally wiping out fields
        // it doesn't know about (e.g. Dashboard overwriting finance data).
        let existing: Record<string, any> = {};
        try {
            const fileContents = await fs.readFile(dataFilePath, 'utf8');
            existing = JSON.parse(fileContents);
        } catch {
            // If file doesn't exist yet, start fresh
        }

        const merged = { ...existing, ...body };
        await fs.writeFile(dataFilePath, JSON.stringify(merged, null, 2), 'utf8');

        // ✅ Backup finance info specifically to finance_inform.txt
        const backupData = {
            finance: merged.finance || [],
            reimbursementUnits: merged.reimbursementUnits || [],
            incomeSources: merged.incomeSources || [],
            auditLog: merged.auditLog || []
        };
        const backupFilePath = path.join(process.cwd(), 'finance_inform.txt');
        await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

        return NextResponse.json({ success: true, data: merged });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
