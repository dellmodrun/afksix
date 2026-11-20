# BlockMind 本地整站

这是 `https://blockmind.fun/` 公共前端的本地快照，包含主页、Skills、Proof、Ledger、页面资源、视频、字体、图标以及抓取时可公开访问的 API 数据。

## 启动

双击 `start.bat`，或在本目录运行：

```powershell
npm start
```

浏览器打开 `http://127.0.0.1:4173/`。

## 页面

- `/`：完整主页及所有首页区块
- `/skills`：技能库
- `/proof`：证明与调用记录
- `/ledger`：费用账本

## 说明

- 本项目无需安装依赖，Node.js 18+ 即可运行。
- 公开页面和当前公开数据已保存在 `public/`，断网仍可浏览快照内容。
- 原站的实时游戏流、WebSocket 推送和链上变化属于服务器端能力，不可能随前端离线复制；本地版使用抓取时的公开状态、调用记录和账本快照。
- `mirror-report.json` 记录抓取时间、文件数量和源站未提供的可选资源。

