# 實境解謎輔助系統 — 漸進式擴充計畫

## Context

目前專案是一個 NPC 聊天介面，使用 Next.js 16 + Firebase Firestore，角色透過關鍵字規則回應玩家訊息。對話存在 server 記憶體中（重啟即消失），無組隊、物品、條件觸發等遊戲機制。

目標：擴充為完整的實境解謎輔助系統，支援組隊共享進度、物品收集與使用、條件式角色對話、以及蒐集型拼圖謎題。

---

## 依賴關係

```
Phase 0（Firestore 對話）
   ↓
Phase 1（組隊系統）
   ↓
Phase 2（物件系統）← 需要隊伍背包
   ↓
Phase 3（進階觸發）← 需要物件 + 隊伍狀態
   ↓
Phase 4（蒐集拼圖）← 需要物件 + 隊伍 + 可選搭配觸發
```

每個 Phase 完成後都是可獨立運作的功能增量。

---

## Phase 0：基礎 — 對話儲存遷移至 Firestore ✅ 已完成（branch: `phase/0-firestore-conversations`）

**目的**：將 in-memory 對話改為 Firestore 持久化，作為後續所有功能的基礎。

### Firestore Schema

```
conversations/{conversationId}
  characterId: string
  createdAt: Timestamp
  updatedAt: Timestamp

conversations/{conversationId}/messages/{messageId}
  role: 'user' | 'npc'
  type: 'TEXT' | 'IMAGE' | 'YOUTUBE'
  content: string
  avatarUrl?: string
  avatarX?: number
  avatarY?: number
  avatarScale?: number
  timestamp: Timestamp
```

使用 subcollection 儲存訊息（避免 1MB 文件限制，支援分頁）。

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/app/api/chat/store.ts` | 全面改寫：移除 in-memory Map，改為 async 函式 `createConversation`、`getConversation`、`addMessages`、`getMessages`，底層操作 Firestore |
| `src/app/api/chat/init/route.ts` | 改用 `createConversation()` 和 `addMessages()` |
| `src/app/api/chat/route.ts` | 改用 `getConversation()` 和 `addMessages()` |
| `src/app/api/chat/history/route.ts` | 改用 `getMessages()` |

### 驗證方式
- [x] 開始對話、傳送訊息、確認顯示正常
- [x] 重啟 dev server，重新載入頁面，確認對話紀錄仍在
- [x] 在 Firebase Console 確認 `conversations` collection 和 `messages` subcollection 有資料

> **注意**：Firestore 安全規則需允許 `conversations` collection 讀寫（server 端使用 client SDK）。

---

## Phase 1：組隊系統 🚧 進行中（branch: `phase/1-team-system`）

**目的**：玩家建立/加入隊伍（4 位數 ID），共享遊戲進度。

### Firestore Schema

```
teams/{teamCode}                    // 4位數代碼作為 document ID（O(1) 查詢）
  createdAt: Timestamp
  createdBy: string                 // anonymous auth UID
  members: string[]                 // UIDs
  taskProgress: Record<string, 'locked' | 'active' | 'completed'>

conversations/{conversationId}      // 新增欄位
  + teamCode: string | null
  + uid: string
```

### 新增檔案

| 檔案 | 說明 |
|------|------|
| `src/app/api/team/create/route.ts` | POST：產生隨機 4 位數碼（檢查碰撞），建立 team document |
| `src/app/api/team/join/route.ts` | POST：`{ teamCode, uid }` → 加入 members array |
| `src/app/api/team/status/route.ts` | GET：回傳 team 資料 |
| `src/app/team/page.tsx` | 「建立隊伍」按鈕 + 「加入隊伍」4 位數輸入框，顯示隊伍狀態 |
| `src/hooks/useTeam.ts` | 管理 teamCode（localStorage）、`createTeam()`、`joinTeam(code)`，使用 `onSnapshot` 即時同步 |
| `src/app/admin/teams/page.tsx` | Admin：列出所有隊伍 |
| `src/app/admin/teams/[code]/page.tsx` | Admin：隊伍詳情、重設/刪除 |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/types.ts` | 新增 `TeamDoc` interface |
| `src/libs/firebase.ts` | 確保 client 端自動 `signInAnonymously` 取得穩定 UID |
| `src/app/api/chat/init/route.ts` | 接受 `teamCode`、`uid`，存入 conversation document |
| `src/app/api/chat/store.ts` | conversation document 加入 `teamCode`、`uid` 欄位 |
| `src/app/page.tsx` | 加入隊伍入口、顯示 team code |
| `src/app/chat/[id]/page.tsx` | 從 localStorage 取 teamCode 傳入 init API |
| `src/app/admin/page.tsx` | 新增「Teams」連結 |

### 驗證方式
- [ ] 兩支手機：A 建立隊伍取得代碼，B 輸入代碼加入 → 雙方顯示為隊友
- [ ] B 加入時 A 即時看到成員數更新（Firestore real-time）
- [ ] 重新載入頁面，teamCode 從 localStorage 恢復
- [ ] Admin 頁面可列出與管理隊伍

> **Firestore 規則**：需在現有規則加上 `teams` collection：
> ```
> match /teams/{teamCode} {
>   allow read, write: if true;
> }
> ```

---

## Phase 2：物件系統

**目的**：Admin 定義物件，玩家在遊戲中收集/使用物件，隊伍共享背包。

### Firestore Schema

```
items/{itemId}
  name: string
  description?: string
  imageUrl?: string
  imageScale?: number
  imageX?: number
  imageY?: number
  category?: string
  stackable: boolean
  maxPerTeam?: number
  createdAt: Timestamp
  order?: number

teams/{teamCode}                    // 新增欄位
  + inventory: Record<string, number>   // itemId → 數量

teams/{teamCode}/inventoryLog/{logId}   // 操作紀錄
  itemId: string
  action: 'pickup' | 'use' | 'transfer_in' | 'transfer_out'
  quantity: number
  uid: string
  timestamp: Timestamp
  source?: string
```

設計決策：背包在隊伍層級（非個人），因為實境解謎中玩家同處一地。

### 新增檔案

| 檔案 | 說明 |
|------|------|
| `src/types/items.ts` | `ItemDoc` interface |
| `src/app/api/items/pickup/route.ts` | POST：加入物件到隊伍背包，寫入 log |
| `src/app/api/items/use/route.ts` | POST：使用（消耗）物件 |
| `src/app/api/items/list/route.ts` | GET：回傳隊伍背包內容 |
| `src/app/inventory/page.tsx` | 玩家背包頁面，物件卡片 grid，即時同步 |
| `src/hooks/useInventory.ts` | 即時監聽隊伍 inventory + item 定義 |
| `src/components/ItemCard.tsx` | 物件卡片元件（圖片、名稱、數量 badge） |
| `src/app/admin/items/page.tsx` | Admin：物件列表 + 新增 |
| `src/app/admin/items/[id]/page.tsx` | Admin：編輯物件（圖片上傳、屬性設定） |
| `src/app/admin/items/actions.ts` | CRUD：`createItem`、`updateItem`、`deleteItem` |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/types.ts` | 新增 `ItemDoc` |
| `src/app/page.tsx` | 加入「背包」按鈕（有隊伍時顯示） |
| `src/app/chat/[id]/page.tsx` | Header 加入背包指示器 |
| `src/app/admin/page.tsx` | 新增「Items」連結 |

### 驗證方式
- [ ] Admin 建立物件 → 確認列表顯示
- [ ] 玩家呼叫 pickup API → 背包頁面顯示物件
- [ ] 重複拾取 → 數量遞增
- [ ] 使用物件 → 數量遞減
- [ ] 同隊兩支手機即時同步背包

---

## Phase 3：進階聊天觸發系統

**目的**：角色規則可設定條件，根據時間、物品、任務狀態觸發不同回應。

### Schema 修改

```
CharacterDoc.rules[] 擴充：

Rule {
  keywords: string[]
  responses: ResponseItem[]
  type?: 'firstLogin' | 'default'
  + conditions?: {
      minElapsedMinutes?: number      // 對話經過 N 分鐘後才觸發
      maxElapsedMinutes?: number      // N 分鐘內才觸發
      requireItems?: string[]         // 隊伍必須擁有這些物品
      requireAnyItem?: string[]       // 擁有其中任一物品
      forbidItems?: string[]          // 不得擁有這些物品
      requireTaskComplete?: string[]  // 特定任務必須完成
    }
  + priority?: number                 // 數字越大優先度越高（預設 0）
}
```

### 新增檔案

| 檔案 | 說明 |
|------|------|
| `src/lib/ruleEngine.ts` | 規則引擎：`evaluateConditions(conditions, context) → boolean`、`findMatchingRule(rules, message, context) → Rule` |
| `src/components/RuleConditionEditor.tsx` | Admin 用：規則條件編輯器（時間、物品多選、任務多選、優先度） |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/types.ts` | 新增 `RuleCondition` interface，擴充 `Rule` |
| `src/app/api/chat/route.ts` | 核心改動：取得 conversation 的 `createdAt` 和 `teamCode` → 取得 team inventory/taskProgress → 用 `findMatchingRule()` 取代現有迴圈 → 依 priority 排序、逐一檢查 keyword + conditions |
| `src/app/api/chat/store.ts` | `getConversation()` 回傳 `createdAt` |
| `src/data/characters.ts` | 傳遞 `conditions` 和 `priority` 欄位 |
| `src/app/admin/characters/[id]/edit.client.tsx` | 每條規則加入可摺疊的「Conditions」區段（用 `RuleConditionEditor`），需額外訂閱 items collection |
| `src/app/admin/characters/actions.ts` | 序列化 conditions 和 priority |

### 驗證方式
- [ ] 建立同一 keyword 的兩條規則：無條件（priority 0）、需要特定物品（priority 10）。無物品時觸發低優先，拾取物品後觸發高優先
- [ ] 時間觸發：設定 5 分鐘後才觸發的規則，確認時間內/時間外回應不同
- [ ] 向下相容：既有無條件規則仍正常運作

---

## Phase 4：蒐集型拼圖謎題

**目的**：玩家收集多個物品，在格子上正確擺放以解謎。

### Firestore Schema

```
puzzles/{puzzleId}
  name: string
  description?: string
  gridWidth: number
  gridHeight: number
  requiredItems: string[]
  solution: Record<string, { row: number, col: number }>  // itemId → 正確位置
  rewardItemIds?: string[]          // 解謎獎勵物品
  rewardTaskComplete?: string       // 解謎完成的任務
  imageUrl?: string                 // 格子背景圖
  createdAt: Timestamp

teams/{teamCode}                    // 新增欄位
  + puzzleState: Record<string, {
      placements: Record<string, { row: number, col: number }>
      solved: boolean
      solvedAt?: Timestamp
    }>
```

### 新增檔案

| 檔案 | 說明 |
|------|------|
| `src/types/puzzles.ts` | `PuzzleDoc`、`PuzzlePlacement`、`PuzzleState` |
| `src/app/api/puzzles/[id]/route.ts` | GET：回傳謎題定義（不含答案）。POST：驗證擺放是否正確、發放獎勵 |
| `src/app/api/puzzles/[id]/place/route.ts` | POST：放置物品到格子（從背包消耗） |
| `src/app/api/puzzles/[id]/remove/route.ts` | POST：移除物品回背包 |
| `src/app/puzzle/[id]/page.tsx` | 玩家拼圖頁面：格子 + 可拖曳物品 + 「確認」按鈕 |
| `src/hooks/usePuzzle.ts` | 即時監聽 team puzzleState，`placeItem`、`removeItem`、`checkSolution` |
| `src/components/PuzzleGrid.tsx` | 格子元件（drop zone） |
| `src/components/PuzzlePiece.tsx` | 可拖曳物品元件 |
| `src/app/admin/puzzles/page.tsx` | Admin：謎題列表 |
| `src/app/admin/puzzles/[id]/page.tsx` | Admin：謎題編輯器（格子大小、物品選擇、視覺化設定答案、獎勵設定） |
| `src/app/admin/puzzles/actions.ts` | CRUD |

### 修改檔案

| 檔案 | 變更 |
|------|------|
| `src/types.ts` | 新增 `PuzzleDoc` |
| `src/app/page.tsx` 或 `src/app/inventory/page.tsx` | 加入進行中謎題入口 |
| `src/app/admin/page.tsx` | 新增「Puzzles」連結 |

### 驗證方式
- [ ] Admin 建立 2x2 謎題（4 個物品 + 正確位置）
- [ ] 玩家擁有 4 個物品，進入拼圖頁面，拖放物品
- [ ] 錯誤排列 → 驗證失敗
- [ ] 正確排列 → 驗證成功、發放獎勵物品、標記任務完成
- [ ] 同隊隊友即時看到拼圖狀態更新
- [ ] 放置物品時從背包消耗，移除時歸還

---

## 關鍵架構決策

1. **隊伍層級背包**（非個人）：實境解謎玩家同處一地，簡化設計
2. **Server-side 規則引擎**：條件判斷在 API route 執行，防止客戶端竄改
3. **Messages 用 subcollection**：避免 1MB 文件限制，支援分頁
4. **4 位數代碼作 document ID**：直接查詢 O(1)，10,000 組對實境解謎足夠
5. **沿用現有 admin 模式**：page.tsx + list.client.tsx + edit.client.tsx + actions.ts
