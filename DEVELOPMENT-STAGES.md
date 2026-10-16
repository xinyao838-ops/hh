# 参赛优化分阶段记录

基线：ad13167（已部署应用资源与该版本对应）。开发分支：dev/competition-2026。main 保持 ad13167，本轮不推送、不部署。原未跟踪 COMPETITION-DESIGN.md 和二维码未改动。各阶段在实施前已向用户给出文件级计划。

## 1. 功能缺陷

修改：src/features/collection/card.ts、capture.ts、rotation.ts、useCollection.ts、model.ts、src/state/WorkshopProvider.tsx；测试 collection.test.mjs、collection-reliability.test.mjs。

- 点击导出时先捕获器物，字体等待上限 1.5 秒；避免等字体期间器物变化、离开后读取已释放场景。
- pointercancel / lostpointercapture 不再触发惯性；停顿后松手不沿用旧速度，页面隐藏/失焦保存朝向。
- 提取存档后重启逻辑，新增第二次写入失败回归；失败不替换内存作品，重试不重复存档。
- 初轮 43 项测试通过。collection-browser 通过真实 PNG 字节/尺寸、06→07 同场景、刷新、三手机视口、模拟存储满和重启存档。
- 剩余：真机长按保存、下载落盘和真实存储压力；浏览器“已发起下载”不是相册保存证明。

## 2. 切割参数原型

新增：src/features/reveal/cutSection.ts、tests/cut-section.test.mjs。

- 明确当前切割位置仅影响动画；新增独立二维位置/角度材料取样原型，不修改 finalPattern 来源验证。
- 同参可重放、不同位置/角度产生不同指纹、拒绝无效参数与版本、不改源对象。
- 极限角度审计发现独立取样上下边界会倒置，改为同一层中心坐标取样，并新增 25 组位置/角度边界检查。
- 剩余：原型视觉主观验收、接入04的版本兼容；不宣称真实三维体切片。

## 3. 撤销与重做

修改/新增：src/features/marbling/history.ts、useMarbling.ts、src/pages/TwistPage.tsx、src/styles/twist.css、tests/history.test.mjs、tests/competition-browser.html。

- 整段拖动按 strokeId 撤销，辅助动作单步撤销；恢复统一 replay 模型，并同步保存有效操作日志。
- 旧 PNG / finalPattern / shapeDraft / kilnDraft 失效；重做后仍须重新完成03，生成新快照。
- 重做仅会话内，新动作清空分支；刷新保留当前有效日志，但不保留重做栈。
- 专项浏览器通过指纹往返、分支丢弃、刷新、390×844 / 375×812 / 430×932 无横向溢出；原 browser-input 验收通过全部旧手势、长按取消、层纹演进与三尺寸无裁切测试。
- 剩余：重做持久化需未来 schema 方案，未擅自加入；长日志撤销仍同步重放。

## 4. 容量与迁移方案

新增：src/state/storageAudit.ts、scripts/audit-storage.mjs、tests/storage-audit.test.mjs。

- 只读统计日志、派生轨迹、PNG、截面和原存储字符串；不能读取时报告 unavailable，不将其当作空数据。
- 6000 段合成状态约 2.59 MB UTF-16（无 PNG/截面），近现有 PNG 恢复上限可能再加约3 MB。实际浏览器计量与配额不同。
- 1080×1440 卡片为 Blob URL，不写入 localStorage；存档内重复配方和 PNG 是主要风险。
- 安全迁移提案见 COMPETITION-TECHNICAL.md；**未执行任何新迁移或清理**。

## 5. Three.js 恢复与性能审计

修改/新增：src/features/shaping/scene.ts、useVesselScene.ts、recovery.ts、tests/scene-recovery.test.mjs、scripts/benchmark-marbling.mjs；复用专项浏览器测试。

- 上下文丢失禁用控制器；恢复读取最新状态而非初次挂载快照。
- capture 拒绝失效渲染器，dispose 幂等且清除已释放纹理引用及场景对象。
- 浏览器通过 WEBGL_lose_context 模拟丢失/恢复，保存最新杯型、塑形进度、朝向与原来源键。
- 桌面 Node 6000 段日志重放约 656 ms，重复结果一致。不是移动端帧率结论。
- 本轮构建：主 JS 约287.5 kB / gzip93.8 kB，VesselPage 懒加载约563.5 kB / gzip143.2 kB，CSS约37.9 kB / gzip8.3 kB；Three.js 分包警告仍存在。
- 剩余：真机驱动恢复、长时间 GPU 压力、构造中途失败的完整资源故障注入、低配长日志 Worker/检查点方案。

## 6. 真实素材模块

新增/修改：src/config/heritage.ts、src/components/HeritageContent.tsx、src/pages/BrandWorksPlaceholderPage.tsx、src/styles/collection.css、tests/heritage.test.mjs。

- 数据化素材、来源、授权记录、事实核实与发布状态；未经确认不渲染。
- 当前配置为空，保留原占位。没有使用未核实素材，没有编造品牌工艺参数。
- 剩余：提供授权文件及对应企业确认文案后再配置；不能将配置标记视为实际授权证明。

## 7. 文档

修改 README.md；新增 COMPETITION-TECHNICAL.md、本文件。

- 移除06/07占位、下一阶段尚未开发、旧测试数等过时描述，删除不存在的文档引用。
- 写清既有核心实现、第三方库与 AI 辅助边界、参数原型限制、数据迁移草案、开发与发布分支关系。
- 未重新验证竞赛全部官方规则，尚不能据此认定参赛资格或奖项。

## 验证范围

独立 origin http://127.0.0.1:5174 ，不触碰用户5173活动作品。按顺序运行既有浏览器验收：03、04、05、06、07，以及新增专项。

这些回归覆盖关键流程段及衔接，部分使用准备好的中间配方，不等于一次真机手工从01到07连续制作。浏览器触摸是合成 Pointer Events，WebGL 恢复是扩展模拟。未取得真机记录。

本地证据截图位于 docs/competition-2026/（git 忽略的本地验收资料），不是生产资源。终验测试及构建结果见本次交付说明。

终验：52 项 Node 自动化测试全部通过；TypeScript/Vite 生产构建通过；check:production 通过；README 本地 Markdown 引用均存在。构建只保留 Three.js 懒加载包超过500 kB的体积警告。专项浏览器模拟恢复通过，控制台未记录 warn/error；既有03、04、05、06、07验收均取得通过记录。无真机结论。


## 终验发现并补修：低帧率烧制计时

作品页复跑两次在等待开窑时超时。审查发现 useKiln 将时间增量限制为每帧50ms、advanceKiln 又限制100ms，低帧率会拉长既定动画。新增修改：src/features/kiln/model.ts、useKiln.ts、tests/kiln.test.mjs。时间轴与旋转物理步长分离，单帧时间轴上限1秒，阶段间保留溢出时间，ready 不会自动开窑，visibilitychange 继续暂停后台并重置时间基准。

新增测试比较100次40ms和4次1000ms推进，验证阶段与观察时间一致。补修后52项自动化测试、构建和资源审计通过；collection-browser和kiln-browser再次整套通过，PNG已实际生成。日志保留补修前两次超时，不能将整个会话描述为从未报错。最终截图：docs/competition-2026/final-png-regression.png、final-kiln-regression.png。
