# GlassMartin 报价生成器

手机优先的离线 PWA，用于生成 GlassMartin 香薰系统报价单，并导出 Excel 与 PDF。

## 本地使用

```bash
npm install
npm run dev
```

## 构建

```bash
npm test
npm run build
```

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `glassmartin-quote-pwa`。
2. 把本项目推送到仓库的 `main` 分支。
3. 进入仓库 `Settings -> Pages`。
4. 在 `Build and deployment` 里选择 `GitHub Actions`。
5. 等待 `Deploy GitHub Pages` 工作流完成。
6. 用手机打开 Pages 链接，并在浏览器菜单中选择“添加到主屏幕”。

发布后首次打开需要网络；安装到主屏幕后，应用会缓存资源，后续可离线使用。
