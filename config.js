// ============================================
// 🎵 音乐播放器配置文件
// =修改这里来切换音源和代理
// ============================================

const CONFIG = {
    // 当前使用的音源索引（从0开始）
    currentSourceIndex: 0,
    
    // 当前使用的跨域代理索引（-1 = 不使用代理）
    currentProxyIndex: -1,
    
    // ============================================
    // 🎼 音源列表
    // 格式: api (搜索接口), format (返回格式 json/xml), keyRequired (是否需要key)
    // ============================================
    audioSources: [
        {
            name: "全豆要聚合音源 v9.3 (暂不可用)",
            api: "https://api.vsaa.cn/api/music.qishui.vip",
            format: "json",
            keyRequired: false,
            isAggregate: true, // 聚合音源标志
            buildSearchUrl: (keyword) => `https://api.vsaa.cn/api/music.qishui.vip?act=search&keywords=${encodeURIComponent(keyword)}&page=1&pagesize=30&type=music`
        },
        {
            name: "星海音乐 (聚合)",
            api: "https://music-api.gdstudio.xyz/api.php",
            format: "json",
            keyRequired: false,
            buildUrl: (keyword) => `https://music-api.gdstudio.xyz/api.php?types=search&count=20&source=netease&name=${encodeURIComponent(keyword)}`
        },
        {
            name: "AutoMeting",
            api: "https://api.miwa.icu/api/netease/search",
            format: "json",
            keyRequired: false,
            buildUrl: (keyword) => `https://api.miwa.icu/api/netease/search?keywords=${encodeURIComponent(keyword)}&limit=20`
        },
        {
            name: "API.NETEASE (公共)",
            api: "https://api.injahow.cn/meting/",
            format: "json",
            keyRequired: false,
            buildUrl: (keyword) => `https://api.injahow.cn/meting/?type=search&id=${encodeURIComponent(keyword)}`
        },
        {
            name: "API.QQ (备用)",
            api: "https://api.uomg.com/api/audio.search",
            format: "json",
            keyRequired: false,
            buildUrl: (keyword) => `https://api.uomg.com/api/audio.search?query=${encodeURIComponent(keyword)}`
        }
    ],
    
    // ============================================
    // 🌐 跨域代理列表
    // 如果音源不支持CORS，需要代理
    // ============================================
    corsProxies: [
        {
            name: "Codetabs",
            url: "https://api.codetabs.com/v1/proxy?quest="
        },
        {
            name: "CORS Anywhere",
            url: "https://cors-anywhere.herokuapp.com/"
        }
    ],
    
    // ============================================
    // ⚙️ 播放器设置
    // ============================================
    settings: {
        defaultVolume: 80,
        autoPlay: false,
        showNotifications: true,
        maxSearchResults: 50
    }
};

// ============================================
// 🔧 辅助函数（不要修改）
// ============================================
function getCurrentSource() {
    return CONFIG.audioSources[CONFIG.currentSourceIndex];
}

function getCurrentProxy() {
    if (CONFIG.currentProxyIndex === -1) return null;
    return CONFIG.corsProxies[CONFIG.currentProxyIndex];
}

function buildSearchUrl(keyword) {
    const source = getCurrentSource();
    let url = source.buildUrl(keyword);
    
    const proxy = getCurrentProxy();
    if (proxy && source.keyRequired === false) {
        url = proxy.url + encodeURIComponent(url);
    }
    
    return url;
}

// 导出给app.js使用
window.CONFIG = CONFIG;
window.buildSearchUrl = buildSearchUrl;
