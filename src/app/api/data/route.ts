import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'data.json');

// 寫入佇列：讓同時抵達的寫入依序執行，
// 避免兩個請求同時「讀→合併→寫」互相蓋掉對方的資料
let writeQueue: Promise<unknown> = Promise.resolve();

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error: any) {
        // 檔案還不存在（第一次啟動）就回傳空資料，其他錯誤（如 JSON 壞掉）仍回 500
        if (error?.code === 'ENOENT') {
            return NextResponse.json({});
        }
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const task = writeQueue.then(async () => {
            // Safety merge: read existing data first, then merge on top.
            // 各頁面只 POST 自己負責的欄位，其餘欄位在這裡被保留。
            let existing: Record<string, any> = {};
            try {
                const fileContents = await fs.readFile(dataFilePath, 'utf8');
                existing = JSON.parse(fileContents);
            } catch {
                // If file doesn't exist yet, start fresh
            }

            const merged = { ...existing, ...body };
            await fs.writeFile(dataFilePath, JSON.stringify(merged, null, 2), 'utf8');

            // Backup finance info specifically to finance_inform.txt
            const backupData = {
                finance: merged.finance || [],
                reimbursementUnits: merged.reimbursementUnits || [],
                incomeSources: merged.incomeSources || [],
                auditLog: merged.auditLog || []
            };
            const backupFilePath = path.join(process.cwd(), 'finance_inform.txt');
            await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

            return merged;
        });
        // 佇列尾巴吞掉錯誤，避免一次失敗讓後續寫入永遠卡住
        writeQueue = task.catch(() => { });

        const merged = await task;
        return NextResponse.json({ success: true, data: merged });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
