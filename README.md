# NYCU UAV 社團管理系統

這是一套基於 Next.js 開發的社團綜合管理系統，整合了社員任務追蹤、財務管理及財產清冊等功能。

## 專案結構與檔案說明

本專案主要程式碼位於 `src` 資料夾中，以下為各檔案與目錄的詳細介紹：

### 1. 核心設定與資料 (Root)

- **`data.json`**: 本系統的核心資料庫。所有的社員資料、財務紀錄、財產清冊、操作歷程等都以此 JSON 格式儲存。
- **`package.json`**: 專案設定檔，定義了使用的套件依賴 (如 React, Next.js, TailwindCSS 等) 與啟動腳本。
- **`secret.txt`**: (若存在) 儲存管理員密碼的檔案，用於後端 API 驗證。

### 2. 應用程式路由 (`src/app`)

Next.js 使用 App Router 架構，每個資料夾代表一個網址路徑。

- **`page.tsx`**: **首頁 (Landing Page)**。整合了各個子系統的入口卡片 (社員系統、財務系統、財產清冊、成員資料)，是使用者進入系統的第一個畫面。
- **`layout.tsx`**: 全域版型設定。定義了網頁的基礎 HTML 結構、字型與全域樣式載入。
- **`globals.css`**: 全域樣式表。包含 Tailwind CSS 的設定與自定義的 CSS 變數 (如顏色主題、動畫特效)。

#### 子頁面路由
- **`dashboard/page.tsx`**: 社員任務儀表板頁面。
- **`finance/page.tsx`**: 財務管理系統頁面。
- **`inventory/page.tsx`**: 財產清冊系統頁面。
- **`member-info/page.tsx`**: 成員基本資料管理頁面。

#### API 路由 (`src/app/api`)
提供前端與後端資料互動的接口。
- **`data/route.ts`**: 負責讀取與寫入 `data.json`，是資料存取的核心 API。
- **`secret/route.ts`**: 處理管理員密碼驗證的 API。
- **`upload/route.ts`**: 處理財產圖片上傳功能的 API。
- **`images/[...path]/route.ts`**: 提供上傳圖片的存取與顯示功能。

### 3. 前端元件 (`src/components`)

這裡包含了系統中可重複使用的介面模組。

- **`Dashboard.tsx`**: **社員任務儀表板**。顯示所有成員的當前任務、進度條與狀態，支援拖拉排序與快速編輯。
- **`FinanceTable.tsx`**: **財務管理表格**。功能強大的記帳系統，包含收支記錄、報帳單位管理、債務追蹤、圖表統計與資料清除功能。
- **`MemberInfoTable.tsx`**: **成員資料表**。條列式顯示成員的學號、聯絡方式、組別等詳細資訊，並提供編輯與刪除功能。
- **`TaskModal.tsx`**: **任務編輯視窗**。用於新增或修改成員的任務內容、截止日期與進度。
- **`ScoreModal.tsx`**: **積分管理視窗**。用於查看與調整成員的貢獻積分及歷史紀錄。
- **`AddMemberModal.tsx`**: **新增成員視窗**。提供表單介面以錄入新成員資料。
- **`InstructionModal.tsx`**: **說明視窗**。顯示系統操作說明或提示訊息。

#### 財產清冊元件 (`src/components/Inventory`)
- **`InventoryDashboard.tsx`**: **財產清冊主控台**。整合了物品列表、搜尋篩選、借用狀態管理與地圖/位置檢視功能。
- **`AddPropertyModal.tsx`**: 新增財產項目的表單視窗。
- **`LocationSelector.tsx`**: 財產存放位置的選擇器介面。
- **`InventoryMap.tsx`**: 顯示財產存放位置的視覺化地圖組件。

### 4. 工具與定義 (`src/lib` & `src/types`)

- **`lib/utils.ts`**: 通用工具函式庫 (主要用於 CSS class 合併)。
- **`types/index.ts`**: TypeScript 型別定義檔。定義了系統中使用的資料結構介面，如 `Member` (成員), `FinancialRecord` (帳目), `InventoryItem` (財產) 等，確保程式碼的類型安全。

## 系統特色

- **資料持久化**: 所有更動即時寫入 `data.json`，無需額外資料庫設定。
- **權限保護**: 敏感操作 (如財務修改、資料清除) 需通過密碼驗證。
- **響應式設計**: 介面適配電腦與手機操作。
- **安全性**: 內建防呆機制與資料備份/還原邏輯 (如成員名單保護)，防止誤刪重要資料。
