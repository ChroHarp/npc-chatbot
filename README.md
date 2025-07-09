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
