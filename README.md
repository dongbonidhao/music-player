# 🎵 简易前端音乐播放器

一个配置灵活、可自动切换失效音源的前端音乐网站。

---

## 📁 文件结构

```
music-player/
├── index.html    # 主界面
├── config.js      # 配置文件（音源/代理）
├── app.js         # 核心逻辑
└── README.md      # 本说明
```

---

## 🚀 快速开始

1. 直接用浏览器打开 `index.html` 即可使用
2. 在搜索框输入歌曲/歌手名，点击"搜索"
3. 从列表点击任意歌曲即可播放

---

## ⚙️ 配置说明

### 1. 音源管理（config.js）

```javascript
audioSources: [
    {
        name: "API.NETEASE (公共)",  // 显示名称
        api: "https://api.injahow.cn/meting/",
        format: "json",
        keyRequired: false,
        buildUrl: (keyword) => `https://api.injahow.cn/meting/?type=search&id=${encodeURIComponent(keyword)}`
    }
    // 添加更多音源...
]
```

**如何添加新音源？**
在 `audioSources` 数组中添加新对象，最重要的是 `buildUrl` 函数，它根据关键词生成完整的搜索URL。

**切换当前音源：**
在网页右上角的下拉菜单选择，或修改 `CONFIG.currentSourceIndex` 的值。

---

### 2. 跨域代理（config.js）

如果音源返回"跨域错误"或搜索失败，说明该音源不支持CORS，需要代理。

```javascript
corsProxies: [
    { name: "Codetabs", url: "https://api.codetabs.com/v1/proxy?quest=" },
    { name: "CORS Anywhere", url: "https://cors-anywhere.herokuapp.com/" }
]
```

**如何使用代理？**
- 网页右上角下拉菜单选择需要的代理
- 或修改 `CONFIG.currentProxyIndex` 的值（-1表示不使用）

---

## 🔄 音源失效怎么办？

1. **自己找新接口**：
   - 搜索"音乐搜索 API"、"音乐解析接口"
   - 找一些开源的音乐项目（GitHub 上很多）
   - 注意：有些接口需要 key，有些不需要

2. **替换步骤**：
   - 用浏览器访问新接口，测试能否正常返回JSON
   - 在 `config.js` 中添加新音源对象
   - 修改 `buildUrl` 函数，使其能正确拼接搜索URL
   - 如果接口需要特殊参数（如 type=search、id=等），按实际调整

3. **如果返回格式不同**：
   修改 `app.js` 中的 `parseSearchResults` 函数，适配新接口的返回结构。

---

## 🎯 注意事项

- 本播放器为**纯前端**，所有请求都从浏览器发出，因此受CORS限制
- 使用代理时，注意代理服务器的稳定性（有些是免费服务，可能随时失效）
- 音源接口可能涉及版权问题，请遵守当地法律法规
- 建议仅用于个人学习和测试

---

## ⌨️ 快捷键

- `空格`：播放/暂停
- `←`：上一首
- `→`：下一首

---

## 📝 开发说明

如果需要对播放器进行定制：
- 修改 `index.html` 调整界面
- 修改 `config.js` 调整配置
- 修改 `app.js` 调整逻辑

所有配置都集中在 `config.js`，替换音源和代理只需编辑这个文件。

---

祝你使用愉快！🎶

---

## 🆕 **全豆要聚合音源 v9.3**

已预置在音源列表首位，特点：
- 聚合星海/溯音/念心/长青/汽水VIP等多线路
- 自动回退，支持高品质音质
- 使用前建议选择跨域代理（Codetabs 或 CORS Anywhere）
- 代理仅在播放时用于代理解密，搜索一般不需要
