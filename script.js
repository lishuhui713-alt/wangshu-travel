const API_KEY = 'sk-25b224a6c4594e9b8f6dcc8123710a41'; // 你的 DeepSeek API Key
const API_URL = 'https://api.deepseek.com/chat/completions';
const MODEL_NAME = 'deepseek-chat';

// 🔴 --- 替换为你的 JSONBin 信息 ---
const BIN_ID = '69d8aeec36566621a899c707';
const JSONBIN_KEY = '$2a$10$B2LSMsj4c1zWHmKK5tTFBOtsM8W8i7aBeEGkDzMb3rhV/6D1sDaM6';
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
// ------------------------------------

const imageLibrary = {
    sea: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80', 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1080&q=80'],
    nature: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', 'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&w=1080&q=80'],
    city: ['https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1080&q=80', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1080&q=80'],
    ancient: ['https://images.unsplash.com/photo-1523589327685-61884dc40d7c?auto=format&fit=crop&w=1080&q=80', 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1080&q=80']
};

const starPositions = [
    { id: 'ningbo', top: 15, left: 15 },
    { id: 'shangrila', top: 25, left: 80 },
    { id: 'mangshi', top: 12, left: 65 },
    { id: 'xichang', top: 40, left: 8 },
    { id: 'quanzhou', top: 8, left: 45 },
    { id: 'fuzhou', top: 20, left: 92 },
    { id: 'huizhou', top: 32, left: 22 },
    { id: 'bazhong', top: 10, left: 58 }
];

let travelData = [];
window.currentGuideData = null;

// 初始为空，稍后从云端拉取
let visitedCities = [];
let customData = [];

// 🔴 1. 从云端读取大家的共享数据
async function loadDataFromCloud() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        const result = await response.json();
        if (result.record) {
            visitedCities = result.record.visitedCities || [];
            customData = result.record.customData || [];
        }
    } catch (error) {
        console.error("读取云端星图失败:", error);
    }
}

// 🔴 2. 将你的操作（点亮/新增）同步到云端
async function saveDataToCloud() {
    // 先在本地立即更新画面，让点击体验丝滑不卡顿
    showStars();
    if (window.currentGuideData && document.getElementById('modal').classList.contains('active')) {
        updateModalButtons(window.currentGuideData.id);
    }

    // 后台悄悄发送给云端
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify({ visitedCities, customData })
        });
        console.log("✨ 成功同步到公共星图");
    } catch (error) {
        console.error("同步到云端失败:", error);
    }
}

// 🔴 3. 网页打开时，先等云端数据拉取完再初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 拉取云端数据
    await loadDataFromCloud();

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            travelData = data;
            initSequence();
        })
        .catch(error => console.error('Error loading data:', error));

    const input = document.getElementById("aiInput");
    const btn = document.getElementById("searchBtn");

    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") { e.preventDefault(); searchDestination(); }
        });
    }
    if (btn) btn.addEventListener("click", searchDestination);
});

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            travelData = data;
            initSequence();
        })
        .catch(error => console.error('Error loading data:', error));

    const input = document.getElementById("aiInput");
    const btn = document.getElementById("searchBtn");

    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") { e.preventDefault(); searchDestination(); }
        });
    }
    if (btn) btn.addEventListener("click", searchDestination);
});

function initSequence() {
    setTimeout(() => {
        showStars();
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.style.opacity = '1';
            searchBox.style.pointerEvents = 'auto';
        }
    }, 5000);
}

function showStars() {
    const container = document.getElementById('starsContainer');
    container.innerHTML = '';

    starPositions.forEach((pos, index) => {
        const cityData = travelData.find(d => d.id === pos.id);
        if (!cityData) return;
        createStarElement(container, cityData, pos.top, pos.left, index * 0.2);
    });

    customData.forEach((cityData, index) => {
        if (!cityData.position) {
            cityData.position = { top: (Math.random() * 45 + 5).toFixed(2), left: (Math.random() * 80 + 10).toFixed(2) };
        }
        createStarElement(container, cityData, cityData.position.top, cityData.position.left, (starPositions.length + index) * 0.2);
    });
}

function createStarElement(container, data, top, left, delay) {
    const isVisited = visitedCities.includes(data.id);
    const starWrapper = document.createElement('div');
    starWrapper.className = `star-wrapper ${isVisited ? 'visited' : ''}`;
    starWrapper.id = `star-${data.id}`;
    starWrapper.style.top = top + '%';
    starWrapper.style.left = left + '%';
    starWrapper.style.transitionDelay = delay + 's';

    const displayName = isVisited ? `👣 ${data.city}` : data.city;

    starWrapper.innerHTML = `<div class="star"></div><div class="city-name">${displayName}</div>`;
    starWrapper.onclick = () => openGuide(data);
    container.appendChild(starWrapper);
    setTimeout(() => { starWrapper.style.opacity = 1; }, 100);
}

function getRandomImageByType(type) {
    if (!type || !imageLibrary[type]) type = 'nature';
    const images = imageLibrary[type];
    return images[Math.floor(Math.random() * images.length)];
}

function openGuide(data) {
    if (!data) return;
    window.currentGuideData = data;

    const modalContent = document.querySelector('.modal-content');
    if (data.image) {
        modalContent.style.backgroundImage = `url('${data.image}')`;
    } else {
        const imageUrl = getRandomImageByType(data.type || 'nature');
        modalContent.style.backgroundImage = `url('${imageUrl}')`;
        data.image = imageUrl;
    }

    modalContent.style.backgroundColor = 'rgba(2, 11, 26, 0.6)';
    const modalBody = document.getElementById('modalBody');
    const checkId = data.id || data.city;

    let html = `<div class="modal-inner-scroll">`;
    html += `<h2 class="modal-title">${data.title}</h2>`;
    html += `<div class="action-buttons" id="modalActionButtons"></div>`;

    html += `<div class="modal-tags">`;
    if (data.tags) data.tags.forEach(tag => { html += `<span>${tag}</span>`; });
    html += `</div>`;

    html += `<div class="modal-text">`;
    if (Array.isArray(data.content)) {
        data.content.forEach(p => { html += `<p>${p}</p>`; });
    } else {
        html += `<p>${data.content}</p>`;
    }
    html += `</div>`;

    if (data.tips && data.tips.length > 0) {
        html += `<div class="modal-tips"><h4>✨ 旅行小贴士</h4><ul>`;
        data.tips.forEach(tip => { html += `<li>${tip}</li>`; });
        html += `</ul></div>`;
    }
    html += `</div>`;

    modalBody.innerHTML = html;
    updateModalButtons(checkId);
    document.getElementById('modal').classList.add('active');
}

function updateModalButtons(id) {
    const btnContainer = document.getElementById('modalActionButtons');
    if (!btnContainer) return;

    const isNative = travelData.some(d => d.id === id);
    const isSaved = customData.some(d => d.id === id);
    const isVisited = visitedCities.includes(id);

    let html = '';
    if (!isNative) {
        const starBtnClass = isSaved ? 'action-btn star-btn active' : 'action-btn star-btn';
        const starBtnText = isSaved ? '🌟 已入星图' : '⭐ 收入星图';
        html += `<button id="starBtn" class="${starBtnClass}" onclick="toggleStar('${id}')">${starBtnText}</button>`;
    }

    const visitBtnClass = isVisited ? 'action-btn visit-btn visited' : 'action-btn visit-btn';
    const visitBtnText = isVisited ? '✨ 已曾踏足' : '👣 标记足迹';
    html += `<button id="visitBtn" class="${visitBtnClass}" onclick="toggleVisit('${id}')">${visitBtnText}</button>`;

    btnContainer.innerHTML = html;
}

window.toggleStar = function (id) {
    if (!window.currentGuideData) return;
    if (!window.currentGuideData.id) window.currentGuideData.id = id;

    const isSaved = customData.some(d => d.id === id);
    if (isSaved) {
        customData = customData.filter(d => d.id !== id);
    } else {
        customData.push(window.currentGuideData);
    }
    // 🔴 换成云端保存函数
    saveDataToCloud();
}

window.toggleVisit = function (id) {
    if (!window.currentGuideData) return;
    if (!window.currentGuideData.id) window.currentGuideData.id = id;
    const guideData = window.currentGuideData;
    const isNative = travelData.some(d => d.id === id);
    const isSaved = customData.some(d => d.id === id);

    if (visitedCities.includes(id)) {
        visitedCities = visitedCities.filter(cityId => cityId !== id);
    } else {
        visitedCities.push(id);
        if (!isNative && !isSaved && guideData) {
            customData.push(guideData);
        }
    }
    // 🔴 换成云端保存函数
    saveDataToCloud();
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }
document.getElementById('modal').onclick = (e) => { if (e.target.id === 'modal') closeModal(); }

async function searchDestination() {
    const input = document.getElementById('aiInput');
    const btn = document.getElementById('searchBtn');
    const city = input.value.trim();

    if (!city) return;

    input.disabled = true;
    const originalPlaceholder = input.placeholder;
    input.value = "星辰链接中...";
    const originalBtnContent = btn.innerHTML;
    btn.innerHTML = `<svg class="loading-spin" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>`;

    try {
        const existingData = [...travelData, ...customData].find(d => d.city === city || d.id === city);
        if (existingData) {
            openGuide(existingData);
            return;
        }

        const prompt = `
            请为"${city}"这个地方写一份旅游攻略。
            角色设定：你是一位热爱生活、文笔温柔的旅行博主。
            要求：
            1. 判断该地点最符合以下哪种类型：['sea', 'nature', 'city', 'ancient'] (只能选一个)。
            2. 严格返回纯 JSON 格式，不要包含 Markdown。
            
            JSON结构如下：
            {
                "id": "${city}",
                "city": "${city}",
                "type": "类型",
                "title": "标题",
                "tags": ["#标签1"],
                "content": ["段落1"],
                "tips": ["贴士1"]
            }
        `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({ model: MODEL_NAME, messages: [{ role: "user", content: prompt }], temperature: 0.8 })
        });

        const data = await response.json();
        let aiContent = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const guideData = JSON.parse(aiContent);
        if (!guideData.id) guideData.id = city;
        guideData.image = getRandomImageByType(guideData.type);

        openGuide(guideData);
    } catch (error) {
        console.error("AI Error:", error);
        alert("连接星辰失败：" + error.message);
    } finally {
        input.disabled = false;
        input.value = "";
        input.placeholder = originalPlaceholder;
        btn.innerHTML = originalBtnContent;
        input.focus();
    }
}