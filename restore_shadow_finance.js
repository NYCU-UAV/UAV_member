const fs = require('fs');
const currentPath = 'data.json';
const backupPath = '\\\\localhost\\C$\\@GMT-2026.03.21-09.57.53\\Users\\UAV\\Desktop\\UAV web\\data.json';

try {
    const currentData = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    currentData.finance = backupData.finance || [];
    currentData.reimbursementUnits = backupData.reimbursementUnits || [];
    currentData.incomeSources = backupData.incomeSources || [];
    currentData.auditLog = backupData.auditLog || [];

    fs.writeFileSync(currentPath, JSON.stringify(currentData, null, 2), 'utf8');
    
    // Also save it properly to our new finance backup file
    const financeBackup = {
        finance: currentData.finance,
        reimbursementUnits: currentData.reimbursementUnits,
        incomeSources: currentData.incomeSources,
        auditLog: currentData.auditLog
    };
    fs.writeFileSync('finance_inform.txt', JSON.stringify(financeBackup, null, 2), 'utf8');

    console.log('✅ Successfully restored finance data from Shadow Copy!');
    console.log('Finance records restored:', currentData.finance.length);
} catch (error) {
    console.error('Failed to restore:', error);
}
