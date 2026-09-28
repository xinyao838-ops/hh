# 公网部署与固定二维码

## 当前连接

- 固定 GitHub 仓库：https://github.com/xinyao838-ops/hh
- 本地分支：`main`，跟踪 `origin/main`。
- Vercel 项目 `jiaoyiwen-h5` 已有可响应的站点，但用户实测 `https://jiaoyiwen-h5.vercel.app/` 在其国内手机网络打不开。它不能作为本项目已验收的答辩入口。
- 腾讯云 CloudBase 已创建环境 `jiaoyiwen-h5-d5ghz308o4ca98b5e`，通过 GitHub 仓库 `hh` 的 `main` 部署应用 `jiaoyiwen-h5`。用户报告首次部署成功。
- 当前应用地址：https://jiaoyiwen-h5-jiaoyiwen-h5-d5ghz308o4ca98b5e.webapps.tcloudbase.com/ 。已匿名检查首页、主 JS/CSS、图标和 Three.js 器物页面脚本，均返回 HTTP 200。尚待国内手机完整流程验收、默认域名使用限制核实，以及一次主分支更新自动发布验证；不要把 HTTP 200 当作完整交互验收。
- 尚未绑定自有域名。当前地址是应用独立子域名，后续必须复用同一环境与应用服务；不要改用共享环境域名的另一套部署方式。域名持续可用仍取决于环境有效期、配额和平台规则。
- 用户已确认上述腾讯云地址在国内手机 4G/5G 能打开首页并开始制作。完整流程与移动端 PNG 保存尚待验收。
- 当前二维码文件：项目根目录 `绞一纹-H5二维码.png`，直接编码上述应用 HTTPS 根地址，不经过控制台。`docs/local-access-qr.png` 是先前的局域网测试二维码，不能用于公网传播。
- `deployment/production.json` 记录固定仓库、生产分支、目标平台、托管环境及正式 URL。`hostingProvider` 是拟用平台；环境或域名为空时表示尚未完成。两个验证字段必须在实际验收后才能置为 true。

## 国内托管：当前下一步

1. 账号持有人打开 https://console.cloud.tencent.com/tcb ，注册或登录腾讯云并完成实名认证。不要把密码、验证码或身份证资料发进聊天。尚未确认套餐前不购买服务器或开通付费资源。
2. 核实账号可用的 CloudBase 静态托管套餐、费用与备案资源条件，再由用户确认开通中国大陆环境。正式自定义域名需要完成相应备案流程；不要承诺立即办好或默认免费。购买域名、实名与备案由账号持有人办理。
3. 在静态网站托管中使用 Git 仓库部署，授权访问固定仓库 `xinyao838-ops/hh`，生产分支选择 `main`。用户已完成仓库选择并报告首次部署成功，配置见下表。当前 GitHub Actions 只做验证，自动发布触发仍需单独验收。

| 配置 | 值 |
| --- | --- |
| 框架 | Vite / React |
| 根目录 | 仓库根目录 |
| Node.js | 24.x |
| 安装命令 | `npx --yes pnpm@11.25.0 install --frozen-lockfile` |
| 构建命令 | `npm run build`（该控制台字段拒绝 `&`；测试与产物审计由 GitHub Actions 另行执行） |
| 产物目录 | `dist` |
| 部署路径 | `/` |
| 首页 | `index.html` |

4. 开启该仓库主分支更新触发部署；用一次实际推送核对云端提交 SHA、构建成功状态与网页更新。若账号控制台不提供对应 Git 自动触发能力，再配置 CI，不把手动上传宣称为持续部署。
5. 将已备案的自有域名绑定到同一个应用根路径，按控制台给出的真实记录设置 DNS、配置 HTTPS。默认 `tcloudbaseapp.com` 域名只作测试，不作为正式二维码入口；不要复制控制台跳转链接。
6. 保持 `index.html` 短缓存或不缓存，带内容哈希的 `/assets/` 可长期缓存。Vercel/Netlify 配置不会自动作用于腾讯云，应在腾讯云控制台设置。当前为 hash 路由，刷新仍请求根目录；如需 history 路由，再配置 SPA fallback。
7. 检查匿名访问、资源加载、完整制作流程、纹卡导出与刷新。由用户用国内 4G/5G 和实际答辩场地 Wi-Fi 测试。通过后填写真实 `hostingProjectId`、`productionUrl`，再设置 `verifiedPublicProduction` 和 `verifiedMainlandMobile` 为 true，生成正式二维码。

此后仍只向同一个仓库的 `main` 推送，国内平台自动发布到同一个应用和域名。自有域名不变时，更新代码不需要重做二维码。若旧二维码已经编码 Vercel 域名，则第一次迁移必须更换二维码；不能将不属于自己的 `vercel.app` 域名绑定到腾讯云。

官方参考：[CloudBase 静态托管与构建配置](https://cloud.tencent.com/document/product/876/46900)、[Git 仓库部署与账号前置条件](https://docs.cloudbase.net/hosting/quick-start)、[React SPA 部署与域名](https://docs.cloudbase.net/recipes/add-hosting-react)。

## Vercel 备用配置（当前不作为国内正式入口）

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

完成上述国内平台 Git 绑定后，推送会触发构建，并在成功后更新**同一个应用的固定域名**。无需新建项目、无需重新生成二维码。核对平台部署记录中的提交 SHA 与成功状态；失败时先修复构建，再推送新提交。GitHub Actions 同时执行构建检查，本身不会发布。尚未完成平台绑定时，推送仅能更新仓库和运行验证。

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
- npm registry、GitHub 和所选托管平台是安装/构建/托管依赖；用户体验时只请求网站自己的域名。正式站点的移动网络可达性必须在实际使用地区验证。
- `brandProductUrl` 仍为空，不含未经企业确认的店铺链接。

## 固定正式二维码

只有固定正式 HTTPS URL 完成公开访问及国内手机实测后执行。需要填写 `hostingProvider`、`hostingProjectId`、`productionUrl`，并将两个验证字段设为 true：

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
