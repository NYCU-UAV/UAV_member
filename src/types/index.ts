export interface Task {
    title: string;
    deadline: string;
    group: string; // "電裝控制" | "結構設計" | "公關相關" | "教學相關"
    progress: number; // 0-100
    outcome?: 'Success' | 'Failed';
}

export interface ScoreRecord {
    id: string;
    date: string;
    change: number;
    reason: string;
    recorder?: string; // Information about who recorded it can be added later if needed
}

export interface Member {
    id: string;
    studentId?: string; // 學號
    name: string;
    // Personal Info
    phone?: string;
    email?: string;
    account?: string;
    group?: string; // "結構" | "電控" | "系工" | "公關"
    remarks?: string;

    // Task Info
    currentTask: Task;
    stats: {
        success: number;
        failed: number;
    };
    history: Task[];

    // Score Info
    score: number;
    scoreHistory: ScoreRecord[];
}

export interface AppData {
    members: Member[];
}
