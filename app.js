// ============================================
// 🎵 音乐播放器核心逻辑
// ============================================

let playlist = [];
let currentIndex = -1;
let isPlaying = false;

const audio = document.getElementById('audioPlayer');
const searchInput = document.getElementById('searchInput');
const songList = document.getElementById('songList');
const statusMsg = document.getElementById('statusMsg');
const playBtn = document.getElementById('playBtn');
const nowTitle = document.getElementById('nowTitle');
const nowArtist = document.getElementById('nowArtist');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');
const sourceSelect = document.getElementById('sourceSelect');
const proxySelect = document.getElementById('proxySelect');

// 初始化
function init() {
    // 填充音源选择
    CONFIG.audioSources.forEach((source, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.text = `音源: ${source.name}`;
        if (idx === CONFIG.currentSourceIndex) opt.selected = true;
        sourceSelect.appendChild(opt);
    });
    
    // 填充代理选择
    const noneOpt = document.createElement('option');
    noneOpt.value = -1;
    noneOpt.text = "代理: 不使用";
    if (CONFIG.currentProxyIndex === -1) noneOpt.selected = true;
    proxySelect.appendChild(noneOpt);
    
    CONFIG.corsProxies.forEach((proxy, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.text = `代理: ${proxy.name}`;
        if (CONFIG.currentProxyIndex === idx) opt.selected = true;
        proxySelect.appendChild(opt);
    });
    
    // 设置音量
    audio.volume = CONFIG.settings.defaultVolume / 100;
    volumeSlider.value = CONFIG.settings.defaultVolume;
    
    // 搜索框回车
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMusic();
    });
}

// 搜索音乐
async function searchMusic() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
        showStatus('请输入搜索关键词', 'error');
        return;
    }
    
    showStatus('搜索中...', 'loading');
    songList.innerHTML = '<div style="text-align:center;padding:20px;">搜索中...</div>';
    
    try {
        const source = CONFIG.audioSources[CONFIG.currentSourceIndex];
        
        if (source.isAggregate) {
            throw new Error('该音源暂不支持，请选择其他音源');
        } else {
            // 普通音源
            const url = buildSearchUrl(keyword);
            console.log('搜索URL:', url);
            
            // 添加请求头
            const headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            };
            
            const response = await fetch(url, { headers });
            const responseText = await response.text();
            console.log('原始返回:', responseText.substring(0, 500));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                throw new Error('返回的不是JSON数据，可能接口已失效');
            }
            
            playlist = parseSearchResults(data);
            renderPlaylist();
            
            if (playlist.length === 0) {
                showStatus('未找到相关歌曲，请尝试其他音源', 'error');
            } else {
                showStatus(`找到 ${playlist.length} 首歌曲`, '');
            }
        }
        
    } catch (error) {
        console.error('搜索失败:', error);
        showStatus(`搜索失败: ${error.message}`, 'error');
        songList.innerHTML = `<div style="text-align:center;padding:20px;color:#ffcccb;">搜索失败<br><small>${error.message}</small></div>`;
    }
}

// 解析不同音源的搜索结果
function parseSearchResults(data) {
    const sourceName = CONFIG.audioSources[CONFIG.currentSourceIndex].name;
    let songs = [];
    
    try {
        // 音源: 星海音乐 (music-api.gdstudio.xyz)
        if (sourceName.includes('星海') || sourceName.includes('music-api.gdstudio')) {
            // 星海返回直接是数组 [{...}]
            const songList = Array.isArray(data) ? data : (data?.data?.songs || data?.songs || []);
            console.log('星海原始数据:', songList);
            songs = songList.map((item, index) => ({
                id: item.id || index,
                title: item.name || item.songName || '未知标题',
                artist: item.artist?.name || item.artist || item.singer || '未知歌手',
                album: item.album?.name || '',
                url: '',
                _xinghai_source: item.source || 'netease',
                _xinghai_songId: item.id || item.url_id || item.songmid || '',
                duration: item.duration || item.length || 0,
                cover: item.cover || item.album?.picUrl || item.pic || ''
            }));
            console.log('星海解析后:', songs);
            songs = songs.filter(s => s._xinghai_songId);
            console.log('星海最终数量:', songs.length);
        }
        // 音源: AutoMeting (api.miwa.icu)
        else if (sourceName.includes('AutoMeting') || sourceName.includes('miwa.icu')) {
            const songList = data?.result?.songs || data?.songs || [];
            songs = songList.map((item, index) => ({
                id: item.id || index,
                title: item.name || '未知标题',
                artist: item.artists?.map(a => a.name).join(' / ') || item.artist || '未知歌手',
                album: item.album?.name || '',
                url: item.url || '',
                duration: item.duration || 0,
                cover: item.album?.picUrl || item.cover || ''
            })).filter(s => s.url);
        }
        // 音源: API.NETEASE (Meting格式)
        else if (sourceName.includes('NETEASE') || sourceName.includes('Meting')) {
            songs = data.map((item, index) => ({
                id: index,
                title: item.name || '未知标题',
                artist: item.artist || '未知歌手',
                album: item.album || '',
                url: item.url || '',
                duration: item.duration || 0,
                cover: item.pic || ''
            })).filter(s => s.url);
        }
        // 音源: API.QQ (UOMG格式)
        else if (sourceName.includes('QQ') || sourceName.includes('UOMG')) {
            songs = (data.result || data.data || []).map((item, index) => ({
                id: index,
                title: item.name || item.title || '未知标题',
                artist: item.singer || item.artist || '未知歌手',
                album: item.albumname || '',
                url: item.play_url || item.url || '',
                duration: item.duration || 0,
                cover: item.img || item.cover || ''
            })).filter(s => s.url);
        }
        else {
            console.warn('未知音源格式:', sourceName, data);
            songs = [];
        }
    } catch (e) {
        console.error('解析搜索结果失败:', e);
        songs = [];
    }
    
    return songs;
}

// 获取星海音乐的真实播放地址
async function getXinghaiUrl(song, quality = '128k') {
    const source = CONFIG.audioSources[CONFIG.currentSourceIndex];
    const baseUrl = source.api;
    
    const platform = song._xinghai_source || 'netease';
    const songId = song._xinghai_songId;
    
    const qualityMap = { '128k': '128', '320k': '320', 'flac': '999' };
    const apiQuality = qualityMap[quality] || '128';
    
    // 构建星海API URL (音乐GD Studio格式)
    const url = `${baseUrl}?types=url&source=${platform}&id=${encodeURIComponent(songId)}&br=${apiQuality}`;
    console.log('星海获取URL:', url);
    
    // 星海需要特殊请求头
    const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`星海API返回 HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log('星海返回:', result);
    
    // 星海成功时直接返回 {url: '...'}，失败时可能有 msg 字段
    if (result && result.url) {
        return result.url;
    } else {
        throw new Error(result?.msg || '星海返回无效数据');
    }
}

// 播放指定歌曲
async function playSong(index) {
    if (index < 0 || index >= playlist.length) return;
    
    currentIndex = index;
    const song = playlist[index];
    
    nowTitle.textContent = song.title;
    nowArtist.textContent = song.artist;
    
    let audioUrl = song.url;
    const sourceName = CONFIG.audioSources[CONFIG.currentSourceIndex].name;
    
    // 星海音源：如果url为空，需二次请求
    if ((sourceName.includes('星海') || sourceName.includes('music-api.gdstudio')) && !audioUrl) {
        showStatus('正在获取播放地址...', 'loading');
        try {
            audioUrl = await getXinghaiUrl(song, '128k');
            song.url = audioUrl;
        } catch (e) {
            console.error('获取星海URL失败:', e);
            showStatus(`获取播放地址失败: ${e.message}`, 'error');
            return;
        }
    }
    
    audio.src = audioUrl;
    audio.load();
    
    audio.play().then(() => {
        isPlaying = true;
        updatePlayButton();
        renderPlaylist();
        showStatus(`正在播放: ${song.title} - ${song.artist}`, '');
    }).catch(err => {
        console.error('播放失败:', err);
        showStatus('播放失败，音源可能失效', 'error');
    });
}

// 渲染播放列表
function renderPlaylist() {
    songList.innerHTML = '';
    document.getElementById('songCount').textContent = `${playlist.length} 首歌曲`;
    
    if (playlist.length === 0) {
        songList.innerHTML = '<div style="text-align:center;padding:20px;opacity:0.7;">暂无歌曲</div>';
        return;
    }
    
    playlist.forEach((song, idx) => {
        const item = document.createElement('div');
        item.className = `song-item ${idx === currentIndex ? 'active' : ''}`;
        item.onclick = () => playSong(idx);
        
        const duration = formatTime(song.duration);
        
        item.innerHTML = `
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="song-duration">${duration}</div>
        `;
        
        songList.appendChild(item);
    });
}

// 播放/暂停
function togglePlay() {
    if (currentIndex === -1) {
        if (playlist.length > 0) {
            playSong(0);
        } else {
            showStatus('请先搜索歌曲', 'error');
        }
        return;
    }
    
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
    } else {
        audio.play();
        isPlaying = true;
    }
    updatePlayButton();
}

// 上一首
function prevSong() {
    if (currentIndex > 0) {
        playSong(currentIndex - 1);
    } else {
        showStatus('已经是第一首了', '');
    }
}

// 下一首
function nextSong() {
    if (currentIndex < playlist.length - 1) {
        playSong(currentIndex + 1);
    } else {
        showStatus('已经是最后一首了', '');
    }
}

// 更新进度条
function updateProgress() {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    }
}

// 拖动进度条
function seek(event) {
    if (!audio.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

// 设置音量
function setVolume(value) {
    audio.volume = value / 100;
}

// 切换音源
function switchSource() {
    CONFIG.currentSourceIndex = parseInt(sourceSelect.value);
    showStatus(`已切换到音源: ${CONFIG.audioSources[CONFIG.currentSourceIndex].name}`, '');
    
    if (searchInput.value.trim()) {
        setTimeout(() => searchMusic(), 500);
    }
}

// 切换代理
function switchProxy() {
    CONFIG.currentProxyIndex = parseInt(proxySelect.value);
    const proxyName = CONFIG.currentProxyIndex === -1 ? '不使用' : CONFIG.corsProxies[CONFIG.currentProxyIndex].name;
    showStatus(`已切换到代理: ${proxyName}`, '');
}

// 测试连接
async function testConnections() {
    showStatus('正在测试连接...', 'loading');
    
    const source = CONFIG.audioSources[CONFIG.currentSourceIndex];
    
    if (source.isAggregate) {
        showStatus('该音源暂不支持测试', 'error');
        return;
    }
    
    const testUrl = source.buildUrl('测试');
    
    try {
        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        const response = await fetch(testUrl, { headers });
        if (response.ok) {
            showStatus(`✅ 音源连接成功: ${source.name}`, '');
        } else {
            showStatus(`❌ 音源响应异常: ${response.status}`, 'error');
        }
    } catch (error) {
        showStatus(`❌ 音源连接失败: ${error.message}`, 'error');
    }
}

// 显示状态消息
function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = 'status-msg';
    if (type) statusMsg.classList.add(type);
    
    if (type !== 'loading' && type !== 'error') {
        setTimeout(() => statusMsg.textContent = '', 3000);
    }
}

// 格式化时间
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 更新播放按钮
function updatePlayButton() {
    playBtn.textContent = isPlaying ? '⏸' : '▶';
}

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowLeft':
            prevSong();
            break;
        case 'ArrowRight':
            nextSong();
            break;
    }
});

// 初始化
init();
