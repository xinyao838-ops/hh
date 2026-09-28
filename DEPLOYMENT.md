# 公网部署与固定二维码

## 当前连接

- 固定 GitHub 仓库：https://github.com/xinyao838-ops/hh
- 本地分支：`main`，跟踪 `origin/main`。
- Vercel Git 绑定、生产项目与正式域名：**待 Vercel 登录授权后确认**。
- 正式二维码：**尚未生成**。`docs/local-access-qr.png` 是先前的局域网测试二维码，不能用于答辩或公网传播。
- 项目源代码以 `deployment/production.json` 记录固定仓库、生产分支、确认后的 Vercel 项目与 Production URL。空值表示未完成，不能当作部署成功。

## 首次绑定 Vercel（只做一次）

1. 登录 https://vercel.com ，选择 **Add New → Project**，导入 GitHub 的 **xinyao838-ops/hh**。若要求授权 GitHub App，请由账号持有人授权访问这个仓库。
2. Framework 选择 **Vite**；Root Directory 使用仓库根目录；Node.js 使用 **24.x**。仓库内 `vercel.json` 已配置安装命令、构建命令、`dist` 输出目录与 SPA fallback。
3. 在项目的 Git / Environments 设置中核对 **Production Branch = main**，确认连接的仓库仍是 `xinyao838-ops/hh`。
4. 首次构建后，在 **Settings → Domains** 中选取绑定在此项目上的固定 Production 域名，例如平台实际分配的 `https://项目名.vercel.app`。不要复制某次 Deployment 的含构建编号地址，也不要选 Preview / 分支预览地址。
5. 确认生产部署会自动分配项目域名，且访问正式地址时不要求 Vercel 登录。评委需要匿名公开访问；若当前项目启用了生产访问保护，请由账号持有人确认并调整生产访问设置。
6. 用未登录的手机浏览器访问，完成制作、纹卡导出与刷新。确认后把真实项目名和固定 Production URL 写入 `deployment/production.json`，将 `verifiedPublicProduction` 设为 `true`。

若使用 CLI，可运行 `npx vercel login`；本环境也支持 `pnpm dlx vercel login`。登录和 GitHub App 授权由用户完成，代码不保存 token。**仅执行 CLI 部署不等于配置 Git 持续部署，仍需核对项目已绑定上述仓库。**

## 以后如何更新（不更换网址、不重做二维码）

在当前项目目录中：

```sh
git switch main
git pull --ff-only origin main
npx --yes pnpm@11.25.0 install --frozen-lockfile
npm run test
npm run build
npm run check:production
git add .
git commit -m "更新绞一纹体验"
git push origin main
```

提交前查看 `git diff --cached`，只包含本次要发布的内容。若 Codex 已经完成提交，只需执行 `git push origin main`。如果在其他分支开发，将变更合并到 `main` 并推送。

Vercel 的 Git 集成会自动构建该提交，并在成功后更新**同一个生产项目的固定域名**。无需新建项目、无需每次运行 `vercel --prod`、无需重新生成二维码。去 Vercel Deployments 核对最新提交为 **Production / Ready**；失败时先修复构建，再推送新提交。GitHub Actions 同时执行构建检查，但不会创建第二套部署。

`git push` 需要 GitHub 的本机登录/凭据。当前 Codex 的 GitHub 连接器授权不等于本机 Git 已登录；若终端要求 GitHub 登录，由用户通过 Git Credential Manager、GitHub CLI 或 GitHub Desktop 完成，不把令牌写进命令或源码。

## 构建可重复性

- 安装以 `pnpm-lock.yaml` 为唯一锁文件，固定 pnpm **11.25.0**；不要混用另一份 package-lock。
- `npm run build` 执行 TypeScript 编译检查和 Vite 生产构建，输出 `dist/`。没有 npm 的 Codex 便携环境可使用 `pnpm dlx npm run build` 调用 npm；普通电脑安装 Node.js 24 LTS 后可直接使用 npm。
- Vercel 构建命令为 `npm run test && npm run build && npm run check:production`，测试或资源审计失败时不发布该版本。
- `scripts/check-production.mjs` 检查入口资源、本地地址误入产物、开发客户端泄漏和开发文件混入 `dist`。
- 本地 `npm run preview -- --port 4173` 仅供预览，不是公网生产服务。

## 路由、资源与运行依赖

- 使用自有 **hash 路由**，不是 React Router。地址如 `/#/clay`、`/#/collection`，刷新时服务器仍请求 `/`。制作状态不足时，应用返回应完成的前一步，不会伪造结果。
- Vite `base: '/'` 用于各平台的域名根目录；静态资源打包为 `/assets/...`。Vercel 和 Netlify 已配 index.html fallback；Cloudflare Pages 没有顶层 404.html 时默认支持 SPA fallback。若以后改用子目录托管，需要同步修改 base。
- React、Three.js 及其环境光逻辑随构建自托管；Canvas 纹样、颗粒、阴影、环境贴图均程序化生成。没有运行时第三方 CDN、远程模型、外链字体或素材下载。
- 字体使用系统中文字体，不同手机字形可能略有差异；不依赖 Google Fonts。
- 纹卡使用现有 Three.js 场景和本机 Canvas，输出 1080×1440 PNG。显示真实图片以便手机长按保存；微信/iOS 保存行为仍需实际手机验收。
- 作品、体验编号、制作过程与 `myPatterns` 保存在**当前域名、当前浏览器**的 localStorage；从 localhost 切换公网域名不会迁移旧作品，换手机也不会同步。更新代码不会主动清空同域名作品。
- npm registry、GitHub、Vercel 是安装/构建/托管依赖；用户体验时只请求网站自己的域名。正式站点的移动网络可达性必须在实际使用地区验证。
- `brandProductUrl` 仍为空，不含未经企业确认的店铺链接。

## 固定正式二维码

只有真实 Production URL 验证通过后执行：

```sh
python -m pip install -r scripts/qr-requirements.txt
python scripts/generate_qr.py
```

输出：项目根目录 **`绞一纹-H5二维码.png`**。纯黑白、至少 2048 像素、四周六个模块白边，不叠加 Logo；适合 PPT 和打印。脚本只读取 `deployment/production.json`，未确认生产地址时拒绝生成，防止误用局域网地址或 Preview 地址。

只要生产域名不变，二维码永久指向该入口；普通代码更新不运行二维码生成步骤。不要删除/重建生产项目、删除已印刷的域名绑定或把旧域名改到 Preview 分支。若域名迁移，应保留旧域名指向新站点。

## Netlify / Cloudflare Pages 兼容

| 平台 | 仓库 / 分支 | 安装及构建 | 输出 |
| --- | --- | --- | --- |
| Vercel | 同一仓库 / main | `vercel.json` 已配置 | dist |
| Netlify | 同一仓库 / main | `netlify.toml` 已配置，Node 24，pnpm 11.25.0 | dist |
| Cloudflare Pages | 同一仓库 / main | Node 24；安装 `pnpm install --frozen-lockfile`；构建 `npm run test && npm run build && npm run check:production`，必要时在 Build 设置固定 PNPM_VERSION=11.25.0 | dist |

也可将已构建的 `dist` 上传到上述静态平台。不需要数据库、服务器函数或新的页面实现。更换托管平台时若要保持既有二维码不变，需继续维护旧域名转向，或一开始就使用自己控制的自定义域名。

## 官方说明

- [Vercel Vite 与 SPA 配置](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Git 集成与生产分支](https://vercel.com/docs/git)
- [生产分支与项目域名](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch)
- [Vercel CLI 登录](https://vercel.com/docs/cli/login)
- [Netlify SPA](https://docs.netlify.com/build/configure-builds/javascript-spas/)
- [Cloudflare Pages SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/)
