# GitHub Pages 验证版（已可用）

这个目录是纯前端版本，不依赖你家里电脑和 MySQL。

## 本地测试

在 `gh_pages_demo` 目录执行：

```powershell
python -m http.server 8091
```

打开：

```text
http://127.0.0.1:8091/
```

## 主要能力

1. 菜库保存在浏览器本地（LocalStorage）。
2. 购物车可下单，月售按本地历史订单累计。
3. 生成微信导入链接（URL 参数里带今日菜单）。
4. 对方打开链接后自动导入购物车。
5. 编辑模式支持批量保存。

## 部署到 GitHub Pages

1. 新建仓库（例如 `couple-menu-web`）。
2. 把 `gh_pages_demo` 目录里的文件上传到仓库根目录。
3. 打开仓库 `Settings -> Pages`。
4. Source 选 `Deploy from a branch`。
5. Branch 选 `main`，folder 选 `/root`，保存。
6. 等 1-3 分钟，拿到 `https://<你的用户名>.github.io/<仓库名>/`。

## 微信分享流程

1. 你点菜后点击“生成微信导入链接”。
2. 把生成的链接发微信。
3. 老婆点开链接，页面自动导入今天菜单。

