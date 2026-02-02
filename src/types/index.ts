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

export interface FinancialRecord {
    id: string;
    date: string;
    item: string;
    type: 'income' | 'expense' | 'loan';
    amount: number;
    balance: number;
    unit?: string;
    payer?: string;
    recipient?: string;
    source?: string;
    // Loan specific
    loanType?: 'borrow' | 'lend';
    counterparty?: string;
    loanStatus?: 'pending' | 'settled';
    // New complex expense logic
    expenseCategory?: 1 | 2 | 3 | 4;
    reimbursementAmount?: number;
    isMagic?: boolean;
    reimbursementStatus?: 'none' | 'pending' | 'received';
    repaymentStatus?: 'none' | 'pending' | 'completed';
    // Invoice specific
    invoiceType?: 'physical' | 'digital';
    invoiceDate?: string;
    invoiceNumber?: string;
    // Old status for backward compatibility (optional but keeping for now)
    status?: 'none' | 'pending' | 'received' | 'completed';
    remarks?: string;
}

export interface ReimbursementUnit {
    name: string;
    limit: number;
}

export interface AuditEntry {
    id: string;
    timestamp: string;
    action: 'create' | 'update' | 'delete' | 'status_change';
    targetId: string;
    targetName: string;
    details: string;
}

export interface AppData {
    // Member & Task system
    members: Member[];

    // Finance system
    finance: FinancialRecord[];
    reimbursementUnits?: ReimbursementUnit[];
    incomeSources?: string[];
    auditLog?: AuditEntry[];

    // Inventory system
    inventory?: any[];
    locations?: any[];
    mapImage?: string;

    // Home page settings
    gmail?: string;
    clubAccount?: string;
}
