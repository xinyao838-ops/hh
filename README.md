# 绞一纹 · 金谷轩数字绞胎工坊

React + TypeScript + Vite 移动端数字手作体验。已实现 01 入坊 → 02 择泥 → 03 绞胎 → 04 开纹 → 05 塑器 → 06 入窑 → 07 我的这一纹，包括 1080×1440 PNG 纹卡。

当前参赛优化在 `dev/competition-2026`，基于已部署版本 `ad13167`，不直接修改 `main`。目标为 2026 年第十四届全国大学生数字媒体科技作品及创意竞赛；报名类别、规则与提交材料仍需以官方通知核验。

## 本地运行与验证

使用 Node.js 24.x、pnpm 11.25.0，与 package.json / lockfile 保持一致。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
pnpm run check:production
```

本地访问 http://localhost:5173/ 。`pnpm preview` 预览 dist。静态站使用域名根路径和 hash 路由，无后端服务。

自动化测试以 Node 内置测试运行器执行。浏览器验收页会创建测试记录，**仅在独立端口运行**，不要在正在制作作品的同一 origin 中运行：

```sh
pnpm dev --host 127.0.0.1 --port 5174 --strictPort
```

- `/tests/browser-input.html`：03 手势、渐生色层、返回与刷新。
- `/tests/reveal-browser.html`：02→03→04、切割取消、动画、来源校验、刷新与返回。
- `/tests/shaping-browser.html`：05 连续塑形、三器型、取消与恢复。
- `/tests/kiln-browser.html`：06 入窑、烧制、开窑与观察。
- `/tests/collection-browser.html`：06→07 场景复用、PNG、存储满和重启；运行后点击“还原测试前存储”。
- `/tests/competition-browser.html`：撤销重做、缓存一致性、模拟 WebGL 上下文丢失与恢复。

手机视口及合成 Pointer Events 不是真机测试。真实 iOS、Android、微信保存、设备返回手势和长时间 GPU 运行仍待验收。

## 数据与实现

- `features/marbling/engine.ts`：57 列材料截面、手势驱动色层形变、固定种子、有序操作日志重放，算法版本 4 保持不变。
- `features/marbling/history.ts`：连续拖动按 strokeId 成组撤销，辅助动作按步撤销。重做栈仅在当前 03 页会话内；刷新或离开页面会清空重做栈，已生效日志仍保存。新动作清空重做分支。
- `features/reveal/pattern.ts`：核对 PNG 元信息、操作日志与派生手势，重建同源 finalPattern；不是随机替换纹样，也不是密码学防伪。
- `features/reveal/cutSection.ts`：位置/角度二维取样实验，不接入正式开纹结果。正式 04 的切割位置目前仍只影响动画。
- `features/shaping/scene.ts`：程序化旋转体、同源纹样 UV、烧成材质插值。05–07 共享 Scene/Camera/Mesh；Three.js 经 VesselPage 懒加载。
- `features/collection/`：体验编号、成品旋转、独立排版 PNG、先存档后重启。
- `state/`：共享状态和原有 schemaVersion 2；无新数据迁移。
- `config/heritage.ts`：真实素材配置入口。授权信息、来源及事实核实未齐备时不显示素材，当前为空。

`vesselType` 已实际使用；shapeDraft / kilnDraft 保存塑器及烧制状态。更换泥料或改变操作会使不匹配的 PNG、finalPattern、器物和烧制记录失效，须重新完成相应步骤。

## 存储与导出

活动作品使用 localStorage 键 `jiaoyiwen.workshop.v1`；存档键 `myPatterns`。作品仅在当前域名/浏览器保存，不跨设备同步。配额不足时本轮内存状态仍保留，但刷新可能恢复到最后成功保存点，应先导出纹卡。

纹卡生成先同步截取现有器物，再等待字体（上限 1.5 秒）。PNG 为 1080×1440，下载链接和长按图片同时提供。浏览器点击下载不等于已保存到手机相册。

只读审计及桌面基准：

```sh
node scripts/audit-storage.mjs
node scripts/benchmark-marbling.mjs
```

这两个脚本使用合成数据，不读取或迁移用户浏览器数据。容量与迁移建议见 [竞赛技术说明](COMPETITION-TECHNICAL.md)。

## 品牌、素材与原创边界

泥色是数字视觉占位，不声称为金谷轩真实生产泥料；未填写企业未确认的温度、时长、历史或商城链接。纯文字“金谷轩”不是重绘官方 Logo。真实素材需要在配置中记录来源、授权与核实状态，图片/视频自托管到 public/media 后才能配置发布。

原创实现范围与局限见 [COMPETITION-TECHNICAL.md](COMPETITION-TECHNICAL.md)；本轮分阶段修改和验证见 [DEVELOPMENT-STAGES.md](DEVELOPMENT-STAGES.md)。

## 生产部署

固定仓库：https://github.com/xinyao838-ops/hh ，生产分支 `main`。本开发分支未推送、未合并、未发布。

既有腾讯云入口：https://jiaoyiwen-h5-jiaoyiwen-h5-d5ghz308o4ca98b5e.webapps.tcloudbase.com/ 。固定二维码不随普通版本更新重建。生产配置、发布步骤和平台限制见 [DEPLOYMENT.md](DEPLOYMENT.md)。

验证并审查开发分支后，再按发布流程合并 main。不要因本地开发直接向 main 提交。Vercel / Netlify 配置仍保留，国内可达性以用户网络实测为准。
