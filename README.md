This is a Next.js project bootstrapped with create-next-app.  
這是一個使用 `create-next-app` 快速建立的 Next.js 專案。

---

## Getting Started / 快速開始

Run the development server to start the application.  
啟動開發伺服器以開始應用程式。

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open your browser at [http://localhost:3000](http://localhost:3000) to view the app.  
在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000) 來查看應用程式。

---

## Database Setup / 資料庫設定

1. Create a new project in Firebase and enable Firestore Database.  
   在 Firebase 控制台建立一個專案並啟用 Firestore Database。
2. Add a `.env.local` file in the project root with your Firebase config:  
   在專案根目錄新增 `.env.local` 並填入你的 Firebase 設定：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Install dependencies and start the development server.  
安裝相依套件並啟動開發伺服器。

```bash
npm install
npm run dev
```

---

## Admin Characters Page / 管理端角色頁面

Visit `/admin/characters` to manage NPC roles: add new characters, upload avatars, and edit conversation rules.  
前往 `/admin/characters` 管理 NPC 角色：新增角色、上傳角色立繪，並編輯對話規則。

Edit `app/page.tsx` and the page will auto-update.  
修改 `app/page.tsx`，頁面會即時重載。

---

## Learn More / 深入學習

To learn more about Next.js, see:  
了解更多 Next.js 資訊，請參考：

* Next.js Documentation ([https://nextjs.org/docs](https://nextjs.org/docs))
* Learn Next.js ([https://nextjs.org/learn](https://nextjs.org/learn))
* Next.js GitHub ([https://github.com/vercel/next.js](https://github.com/vercel/next.js))

---

## Deploy on Vercel / 部署至 Vercel

Deploy easily with Vercel by connecting your GitHub repository.  
將專案連接至 Vercel，即可輕鬆部署。

For more details, see the Next.js deployment docs:  
更多部署細節，請參考 Next.js 部署文件：
[https://nextjs.org/docs/app/building-your-application/deploying](https://nextjs.org/docs/app/building-your-application/deploying)

---
# NPC ChatBot 專案—超簡易新手指南

> 這份文件專寫給第一次接觸 **GitHub** 和 **Firebase** 的朋友。跟著步驟做，你就能在自己的電腦跑出 NPC 聊天機器人，最後還能放到網路讓你布置自己的實境遊戲npc！
>這是我用chatgpt codex協同開發一個網路服務，如果使用上有問題，也建議你將指南丟進chatgpt來尋求協助
---

## 0. 你需要準備什麼？

| 工具                   | 下載連結                                                           | 用途               |
| -------------------- | -------------------------------------------------------------- | ---------------- |
| **Git**              | [https://git-scm.com](https://git-scm.com)                     | 把程式碼抓回本地、同步到雲端   |
| **Node.js (18 版以上)** | [https://nodejs.org](https://nodejs.org)                       | 執行 JavaScript 程式 |
| **VS Code (可選)**     | [https://code.visualstudio.com](https://code.visualstudio.com) | 程式編輯器            |
| **Google 帳號**        | —                                                              | 用來登入 Firebase    |

> 建議先安裝完畢，然後在終端機（Terminal）輸入以下指令：
>
> ```bash
> git --version
> node -v
> ```
>
> 顯示版本號代表安裝成功。

---

## 1. 把專案下載到電腦

1. 打開「命令提示字元」或「PowerShell」(Windows)／「終端機」(macOS)。
2. 選一個資料夾，例如 `D:\WebProjects`。
3. 執行：

   ```bash
   git clone https://github.com/ChroHarp/npc-chatbot.git
   cd npc-chatbot
   ```

   專案就會被複製到本地，並切換到該資料夾。

---

## 2. 安裝相依套件

執行：

```bash
npm install   # 若用 pnpm 則執行 pnpm install
```

> 這步驟需要 1\~2 分鐘，視網速而定。

---

## 3. 建立 Firebase 專案（雲端資料庫）

1. 前往 Firebase 控制台 → **Add Project**。
2. 輸入專案名稱（例如 npc-chatbot-demo）→ 同意規則 → **Continue**。
3. 不啟用 Google Analytics → **Create project**。
4. 左側點 **Firestore Database** → **Create database** → **Start in production**。
5. 左側點 **Storage** → **Get started**。

### 拿到專案設定值

1. 點右上齒輪 → **Project settings** → **General** 分頁。
2. 往下「Your apps」→ 點 `</>` 新增 Web App。
3. 取個名稱 → **Register** → 複製以下項目：

   * apiKey
   * authDomain
   * projectId
   * storageBucket
   * appId

---

## 4. 建立 `.env.local` 設定檔

在專案根目錄新增 `.env.local`，並貼上：

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=你的 apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的 authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的 projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的 storageBucket
NEXT_PUBLIC_FIREBASE_APP_ID=你的 appId
```

> **注意**：此檔僅存在本機，不要上傳至 GitHub。

---

## 5. 本地啟動專案

執行：

```bash
npm run dev    # 或 pnpm dev
```

在瀏覽器開啟 `http://localhost:3000`，若看到畫面即表示成功。

* 管理介面：`http://localhost:3000/admin/characters` 可新增角色、上傳立繪。

---

## 6. 推送程式到 GitHub

若已用 `git clone`，遠端已設定完成。修改後執行：

```bash
git add .
git commit -m "feat: 新增 NPC 功能"
git push
```

> 這樣就能將修改同步到 GitHub 倉庫。

---

## 7. 部署到 Vercel（放到網路上）

1. 前往 [https://vercel.com](https://vercel.com) → **New Project** → 選擇 `npc-chatbot` 倉庫。

2. 在 **Environment Variables** 中，依照 `.env.local` 的 Key/Value 設定於 **Production** & **Preview**。

3. 點 **Deploy**，部署完成後會顯示專屬網址，如：

   ```text
   https://npc-chatbot.vercel.app
   ```

4. 打開即能全平台訪問。

---

## 8. 常見錯誤 FAQ

| 錯誤訊息                 | 可能原因           | 解法                                                           |
| -------------------- | -------------- | ------------------------------------------------------------ |
| auth/invalid-api-key | Vercel 未設定環境變數 | 至 Vercel 專案 Settings → Environment Variables，填寫金鑰            |
| storage/unauthorized | Storage 規則過於嚴格 | Firebase Console → Storage → Rules，開發期先 `allow read, write;` |
| 端口被佔用                | 3000 被其他程式使用   | `npm run dev -- -p 3001` 或 關閉佔用程式                            |

---

完成！若有任何問題，歡迎在 GitHub 倉庫開 Issue，或貼錯誤訊息來討論。祝開發順利！


