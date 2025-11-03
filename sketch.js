// 將註解掉的 objs 陣列恢復
let objs = []; // 移除註解
let colors = ['#f71735', '#f7d002', '#1A53C0', '#232323'];
let cnv;
let drawSize, offsetX, offsetY;
// 標題文字變數
let titleOpacity = 0;


// 左側隱藏選單變數
let sidebarDiv;
let sidebarWidth = 300;
let sidebarX = -sidebarWidth;
let sidebarTargetX = -sidebarWidth;
// iframe overlay 變數
let overlayDiv;

// 新增測驗相關變數
let quizDiv = null;
let questionBank = [
    { q: '下列哪一個是 JavaScript 的資料型別？', choices: ['integer','string','tuple','matrix'], answer: 1 },
    { q: 'HTML 用來做什麼？', choices: ['排版與結構','資料庫管理','影像編輯','系統設定'], answer: 0 },
    { q: 'CSS 主要功能是？', choices: ['控制資料','設計樣式','執行邏輯','儲存檔案'], answer: 1 },
    { q: 'p5.js 是什麼？', choices: ['後端框架','繪圖與互動函式庫','文字編輯器','作業系統'], answer: 1 },
    { q: '哪個是等於運算子？', choices: ['=','==','->','::'], answer: 1 },
    { q: '哪個標記是 HTML 的超連結？', choices: ['<img>','<a>','<div>','<span>'], answer: 1 }
];
let quizQuestions = [];
let quizCurrentIndex = 0;
let userAnswers = [];
let quizScore = 0;


// 新增：用於結果動畫的全域變數
let resultObjects = [];
let resultMode = null;
function clearResultAnimation() {
    resultObjects = [];
    resultMode = null;
}

function setup() {
    // 背景畫布全螢幕，但內容限制在置中的正方形區域
    cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    rectMode(CENTER);
    
    // 計算置中的正方形繪製區
    drawSize = min(width, height);
    offsetX = (width - drawSize) / 2;
    offsetY = (height - drawSize) / 2;
    
    // 初始化時加入一個形狀
    objs.push(new DynamicShape());


    // 建立左側隱藏選單（初始隱藏在畫面左側）
    const html = `
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:24px;padding:48px 24px;box-sizing:border-box;height:100vh;">
            <div class="menu-item" style="font-size:32px;color:#fff;cursor:pointer;">第一單元作品</div>
            <div class="menu-item" style="font-size:32px;color:#fff;cursor:pointer;">第一單元講義</div>
            <div class="menu-item" style="font-size:32px;color:#fff;cursor:pointer;">測驗系統</div>
            <div class="menu-item" style="font-size:32px;color:#fff;cursor:pointer;">回到首頁</div>
        </div>
    `;
    sidebarDiv = createDiv(html);
    sidebarDiv.style('position', 'fixed');
    sidebarDiv.style('top', '0px');
    sidebarDiv.style('left', sidebarX + 'px');
    sidebarDiv.style('width', sidebarWidth + 'px');
    sidebarDiv.style('height', '100vh');
    sidebarDiv.style('background', 'rgba(0,0,0,0.65)');
    sidebarDiv.style('padding', '0px');
    sidebarDiv.style('z-index', '9999');
    sidebarDiv.style('box-sizing', 'border-box');
    // 加入選單項目的點擊事件處理
    const items = sidebarDiv.elt.querySelectorAll('.menu-item');
    if (items && items.length > 0) {
        // 第一項：載入指定頁面到 iframe
        items[0].addEventListener('click', () => {
            openIframe('https://nitattt34-boop.github.io/2025.10.20/');
        });
        // 第二項：載入講義到 iframe
        items[1].addEventListener('click', () => {
            openIframe('https://hackmd.io/@NAy_WOqtQvSDsNi-Atugng/HyY6O70jlx');
        });
        // 第三項：開啟測驗系統
        items[2].addEventListener('click', () => {
            openQuiz();
        });
        // 第四項：回到主畫面
        items[3].addEventListener('click', () => {
            window.location.href = 'index.html'; // 改為導向主畫面
        });
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // 重新計算置中正方形區
    drawSize = min(width, height);
    offsetX = (width - drawSize) / 2;
    offsetY = (height - drawSize) / 2;
}


function draw() {
    background(255);
    
    // 使用倒序迭代並在同一迴圈內移除已死亡物件，避免陣列爆增與同步問題
    for (let i = objs.length - 1; i >= 0; i--) {
        try {
            objs[i].run();
        } catch (e) {
            // 若某個物件執行出錯，移除它以避免整個畫面卡死
            objs.splice(i, 1);
            continue;
        }
        if (objs[i].isDead) {
            objs.splice(i, 1);
        }
    }

    // 限制最大動態物件數量，避免無限制新增導致效能崩潰
    const MAX_OBJS = 150;
    if (frameCount % 20 === 0 && objs.length < MAX_OBJS) {
        let addNum = int(random(1, 5)); // 減少每次新增數量
        addNum = min(addNum, MAX_OBJS - objs.length);
        for (let i = 0; i < addNum; i++) {
            objs.push(new DynamicShape());
        }
    }

    // 繪製標題文字
    if (titleOpacity < 255) titleOpacity += 2; // 淡入效果
    push();
    textAlign(CENTER, CENTER);
    // 改成粗體並使用深灰色（#333 / 51），同時保留淡入透明度
    textSize(36);
    textStyle(BOLD);
    fill(51, titleOpacity);
    text('淡江教育科技學系', width/2, height/2 - 24);
    textSize(24);
    text('414730688-陳君慈', width/2, height/2 + 24);
    textStyle(NORMAL);
    pop();


    // 選單動畫
    if (mouseX >= 0 && mouseX <= 100) {
        sidebarTargetX = 0;
    } else {
        sidebarTargetX = -sidebarWidth;
    }
    sidebarX = lerp(sidebarX, sidebarTargetX, 0.12);
    if (sidebarDiv) sidebarDiv.style('left', sidebarX + 'px');


    // 若 quizDiv 存在，可繼續顯示互動或做視覺效果（此處用 titleOpacity 變化示意）
    if (quizDiv) {
        // 畫面右上顯示簡單提示
        push();
        textSize(14);
        fill(0, 120);
        textAlign(RIGHT, TOP);
        text('測驗進行中...', width - 12, 12);
        pop();
    }


    // 顯示並更新結果動畫物件（若有）
    for (let i = resultObjects.length - 1; i >= 0; i--) {
        const obj = resultObjects[i];
        try {
            if (obj && typeof obj.run === 'function') obj.run();
        } catch (e) {
            resultObjects.splice(i, 1);
            continue;
        }
        if (obj && obj.isDead) resultObjects.splice(i, 1);
    }
}


function easeInOutExpo(x) {
  return x === 0 ? 0 :
    x === 1 ? 1 :
    x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 :
    (2 - Math.pow(2, -20 * x + 10)) / 2;
}


class DynamicShape {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = random(width);
        this.y = random(height);
        this.fromX = this.x;
        this.fromY = this.y;
        this.targetX = random(width);
        this.targetY = random(height);
        this.size = random(20, 60);
        this.shapeType = int(random(4));
        this.clr = random(colors);
        this.lineSW = random(0.3, 2);
        this.animationType = int(random(3));
        this.reductionRatio = 1;
        this.actionPoints = int(random(30, 120));
        this.maxActionPoints = this.actionPoints;
        this.isDead = false;
        this.message = '';
        this.isResult = false;
    }

    run() {
        this.move();
        this.show();
    }

    move() {
        this.x = lerp(this.x, this.targetX, 0.01);
        this.y = lerp(this.y, this.targetY, 0.01);
        this.fromX = lerp(this.fromX, this.x, 0.02);
        this.fromY = lerp(this.fromY, this.y, 0.02);
        this.actionPoints--;
        
        if (this.animationType == 1 || this.animationType == 2) {
            this.reductionRatio = map(
                sin(frameCount * 0.1), -1, 1, 0.5, 1
            );
        }

        if (this.actionPoints <= 0) {
            this.isDead = true;
        }
    }

    show() {
        push();
        translate(this.x, this.y);
        if (this.animationType == 1) scale(1, this.reductionRatio);
        if (this.animationType == 2) scale(this.reductionRatio, 1);
        
        fill(this.clr);
        stroke(this.clr);
        strokeWeight(this.size * 0.05);
        
        if (this.shapeType == 0) {
            noStroke();
            circle(0, 0, this.size);
        } else if (this.shapeType == 1) {
            noFill();
            circle(0, 0, this.size);
        } else if (this.shapeType == 2) {
            noStroke();
            rect(0, 0, this.size, this.size);
        } else if (this.shapeType == 3) {
            noFill();
            rect(0, 0, this.size * 0.9, this.size * 0.9);
        }

        // 如果是結果動畫，顯示文字
        if (this.isResult && this.message) {
            push();
            textAlign(CENTER, CENTER);
            textSize(36);
            textStyle(BOLD);
            noStroke();
            fill(51, map(this.actionPoints, 0, this.maxActionPoints, 0, 255));
            text(this.message, width/2 - this.x, height/2 - this.y);
            pop();
        }
        
        pop();
        
        strokeWeight(this.lineSW);
        stroke(this.clr);
        line(this.x, this.y, this.fromX, this.fromY);
    }
}


// 建立並顯示 iframe overlay（70vw × 85vh），含關閉鈕
function openIframe(url) {
    // 如果已有 overlay，先移除
    if (overlayDiv) {
        overlayDiv.remove();
        overlayDiv = null;
    }
    // overlay container，置中顯示
    overlayDiv = createDiv('');
    overlayDiv.style('position', 'fixed');
    overlayDiv.style('left', '50%');
    overlayDiv.style('top', '50%');
    overlayDiv.style('transform', 'translate(-50%,-50%)');
    overlayDiv.style('width', '70vw');
    overlayDiv.style('height', '85vh');
    overlayDiv.style('z-index', '10001');
    overlayDiv.style('background', '#ffffff');
    overlayDiv.style('box-shadow', '0 12px 40px rgba(0,0,0,0.5)');
    overlayDiv.style('border-radius', '6px');
    overlayDiv.style('overflow', 'hidden');


    // 內部 HTML：關閉鈕 + iframe
    overlayDiv.html(`
        <div style="position:absolute;right:10px;top:10px;z-index:10002;">
            <button id="close-iframe" style="font-size:16px;padding:8px 12px;cursor:pointer;">關閉</button>
        </div>
        <iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>
    `);


    // 關閉按鈕事件
    const btn = overlayDiv.elt.querySelector('#close-iframe');
    if (btn) {
        btn.addEventListener('click', () => {
            if (overlayDiv) {
                overlayDiv.remove();
                overlayDiv = null;
            }
        });
    }
    // 點擊 overlay 背景以外也可以關閉（選擇性，可視需求移除）
    // 這裡不額外綁全域點擊以避免誤關閉 iframe 內點擊
}


/* -------------------------
   測驗系統：CSV 匯出、隨機抽三題、互動 UI、成績與回饋
   ------------------------- */

// 產生 CSV 並下載（UTF-8 BOM 以支援中文）
function exportQuestionCSV() {
    let lines = [];
    // 欄位：題目, 選項A, 選項B, 選項C, 選項D, 正答索引
    lines.push(['question','choiceA','choiceB','choiceC','choiceD','answerIndex'].join(','));
    for (let it of questionBank) {
        // 確保有 4 個選項，若不足填空
        let c = it.choices.slice(0,4);
        while (c.length < 4) c.push('');
        // escape commas / quotes minimal by wrapping in quotes
        let row = [
            `"${it.q.replace(/"/g,'""')}"`,
            `"${c[0].replace(/"/g,'""')}"`,
            `"${c[1].replace(/"/g,'""')}"`,
            `"${c[2].replace(/"/g,'""')}"`,
            `"${c[3].replace(/"/g,'""')}"`,
            it.answer
        ].join(',');
        lines.push(row);
    }
    let csvContent = '\uFEFF' + lines.join('\n'); // BOM
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = createA(url, 'download');
    a.attribute('download', 'question_bank.csv');
    a.hide();
    a.elt.click();
    URL.revokeObjectURL(url);
    a.remove();
}

// 開啟測驗 UI（抽取 3 題）
function openQuiz() {
    // 若已有 quizDiv 則先移除
    if (quizDiv) {
        quizDiv.remove();
        quizDiv = null;
    }
    // 隨機選 3 題（若題庫少於 3 則全部）
    startQuiz();

    quizDiv = createDiv('');
    quizDiv.style('position', 'fixed');
    quizDiv.style('left', '50%');
    quizDiv.style('top', '50%');
    quizDiv.style('transform', 'translate(-50%,-50%)');
    quizDiv.style('width', '520px');
    quizDiv.style('max-width', '90vw');
    quizDiv.style('background', '#ffffff');
    quizDiv.style('z-index', '10002');
    quizDiv.style('padding', '18px');
    quizDiv.style('box-shadow', '0 12px 36px rgba(0,0,0,0.35)');
    quizDiv.style('border-radius', '8px');
    quizDiv.style('font-family', 'sans-serif');

    // 移除右下角關閉按鈕
    quizDiv.html(`
        <div id="quiz-content" style="display:flex;flex-direction:column;gap:12px;"></div>
    `);

    renderQuizQuestion();
}

// 建立 quizQuestions 與初始狀態
function startQuiz() {
    let indices = [];
    let total = questionBank.length;
    let pick = 6; // 固定抽 6 題
    while (indices.length < pick) {
        let r = int(random(0, total));
        if (!indices.includes(r)) indices.push(r);
    }
    quizQuestions = indices.map(i => questionBank[i]);
    quizCurrentIndex = 0;
    userAnswers = [];
    quizScore = 0;
}

// 顯示當前題目到 quizDiv
function renderQuizQuestion() {
    if (!quizDiv) return;
    const content = quizDiv.elt.querySelector('#quiz-content');
    if (!content) return;

    // 如果已完成所有題目，顯示結果
    if (quizCurrentIndex >= quizQuestions.length) {
        // 計算分數
        quizScore = 0;
        for (let i = 0; i < quizQuestions.length; i++) {
            if (userAnswers[i] === quizQuestions[i].answer) quizScore++;
        }

        // 根據分數給予回饋
        let feedback = '';
        if (quizScore === quizQuestions.length) {
            feedback = '非常好！全部答對，繼續保持！';
        } else if (quizScore >= quizQuestions.length - 1) {
            feedback = '不錯，再接再厲！';
        } else if (quizScore > 0) {
            feedback = '部分正確，建議再複習相關內容。';
        } else {
            feedback = '需要加強，請多練習基礎概念。';
        }

        // 修改顯示結果的 HTML
        content.innerHTML = `
            <div style="font-size:20px;font-weight:600;">測驗完成</div>
            <div>共 ${quizQuestions.length} 題，正確 ${quizScore} 題</div>
            <div style="margin-top:8px;padding:10px;background:#f4f4f4;border-radius:6px;">
                回饋：${feedback}
            </div>
            <div id="detail-area" style="margin-top:12px;"></div>
            <div style="display:flex;justify-content:center;margin-top:16px;">
                <button id="close-final" style="padding:8px 24px;cursor:pointer;font-size:16px;background:#4a90e2;color:white;border:none;border-radius:4px;">關閉</button>
            </div>
        `;

        // 顯示每題的答題詳情
        const detail = content.querySelector('#detail-area');
        let html = '<ol style="padding-left:18px;">';
        for (let i = 0; i < quizQuestions.length; i++) {
            const q = quizQuestions[i];
            const userAns = userAnswers[i];
            const isCorrect = userAns === q.answer;
            
            html += `
                <li style="margin-bottom:12px;">
                    <div style="font-weight:600;">${q.q}</div>
                    <div style="color:${isCorrect ? '#2e7d32' : '#c62828'}">
                        你的答案：${q.choices[userAns]} 
                        ${isCorrect ? '✓' : '✗'}
                    </div>
                    <div style="color:#1976d2">
                        正確答案：${q.choices[q.answer]}
                    </div>
                </li>
            `;
        }
        html += '</ol>';
        detail.innerHTML = html;

        // 只綁定關閉按鈕
        const closeBtn = content.querySelector('#close-final');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (quizDiv) { 
                    quizDiv.remove(); 
                    quizDiv = null;
                }
                // 移除結果動畫但不動到主畫面內容
                clearResultAnimation();
            });
        }

        // 顯示動畫效果
        showResultAnimation(quizScore);
        return;
    }

    // 顯示當前題目
    const q = quizQuestions[quizCurrentIndex];
    let choicesHtml = '';
    for (let i = 0; i < q.choices.length; i++) {
        choicesHtml += `
            <button class="choice-btn" data-idx="${i}" 
                style="display:block;width:100%;text-align:left;padding:10px;
                border-radius:6px;border:1px solid #ddd;background:#fff;
                cursor:pointer;margin-top:6px;">
                ${String.fromCharCode(65+i)}. ${q.choices[i]}
            </button>
        `;
    }

    content.innerHTML = `
        <div style="font-size:18px;font-weight:600;">
            題目 ${quizCurrentIndex+1} / ${quizQuestions.length}
        </div>
        <div style="margin-top:8px;">${q.q}</div>
        <div style="margin-top:8px;">${choicesHtml}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
            <div style="color:#666;font-size:14px;">
                ${quizCurrentIndex < quizQuestions.length-1 ? '請繼續作答下一題' : '最後一題'}
            </div>
            <button id="restart-quiz" style="padding:8px 12px;cursor:pointer;">重新測驗</button>
        </div>
    `;

    // 綁定選項按鈕
    const btns = content.querySelectorAll('.choice-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            userAnswers[quizCurrentIndex] = idx;
            quizCurrentIndex++;
            renderQuizQuestion();
        });
    });

    // 綁定重新測驗按鈕
    const restartBtn = content.querySelector('#restart-quiz');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            startQuiz();
            renderQuizQuestion();
        });
    }
}


// 顯示結果時的視覺互動：依成績建立不同的動畫物件
function showResultAnimation(score) {
    // 不影響主畫面內容，僅在畫布上加上動畫物件
    clearResultAnimation();

    let total = max(1, quizQuestions.length);
    let percent = Math.round((score / total) * 100);

    if (score === total) {
        // 完全正確：金黃煙火 + 置中文字
        for (let i = 0; i < 8; i++) {
            let fx = new Firework(width * 0.25 + random() * width * 0.5, height * 0.2 + random() * height * 0.6, color('#FFD700'));
            resultObjects.push(fx);
        }
        resultObjects.push(new MessageBanner('太棒了！完美表現！', '#b8860b'));
    } else if (score >= 2 && score <= 5) {
        // 中等：小動物鼓勵畫面（多隻小動物） + 置中文字
        let count = 3;
        for (let i = 0; i < count; i++) {
            let ax = new AnimalCheer(width * (0.25 + i * 0.25), height * 0.65, '加油！', i);
            resultObjects.push(ax);
        }
        resultObjects.push(new MessageBanner('表現不錯，繼續努力！', '#2e7d32'));
    } else {
        // 全錯：紅色警報 + 置中文字
        resultObjects.push(new RedAlarm());
        resultObjects.push(new MessageBanner('需要加強，請再練習！', '#c62828'));
    }
}

// Firework 與粒子
class Firework {
    constructor(x, y, clr) {
        this.p = createVector(x, y);
        this.particles = [];
        this.isDead = false;
        for (let i = 0; i < 30; i++) {
            this.particles.push(new FireworkParticle(this.p.x, this.p.y, clr));
        }
    }
    run() {
        let alive = 0;
        for (let p of this.particles) {
            p.update();
            p.display();
            if (!p.isDead) alive++;
        }
        if (alive === 0) this.isDead = true;
    }
}

class FireworkParticle {
    constructor(x, y, clr) {
        this.pos = createVector(x, y);
        let angle = random(TWO_PI);
        let mag = random(1.5, 6);
        this.vel = p5.Vector.fromAngle(angle).mult(mag);
        this.acc = createVector(0, 0.02);
        this.life = 255;
        this.size = random(3, 8);
        this.baseColor = clr;
        this.isDead = false;
    }
    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.life -= 4;
        if (this.life <= 0) this.isDead = true;
    }
    display() {
        push();
        noStroke();
        let alpha = constrain(this.life, 0, 255);
        fill(red(this.baseColor), green(this.baseColor), blue(this.baseColor), alpha);
        ellipse(this.pos.x, this.pos.y, this.size);
        pop();
    }
}

// 小動物鼓勵（簡單向量圖）
class AnimalCheer {
    constructor(x, y, text, idx = 0) {
        this.x = x;
        this.y = y;
        this.t = text || '加油';
        this.offset = random(0, 1000) + idx * 10;
        this.isDead = false; // 持續顯示，直到 clearResultAnimation()
    }
    run() {
        // 簡單上下擺動
        let bob = sin((frameCount + this.offset) * 0.06) * 6;
        push();
        translate(this.x, this.y + bob);
        // 身體
        noStroke();
        fill('#F6CBA5');
        ellipse(0, -6, 48, 42); // head
        fill('#7B3F00');
        ellipse(0, 18, 64, 40); // body
        // 眼睛
        fill(0);
        ellipse(-10, -8, 6, 6);
        ellipse(10, -8, 6, 6);
        // 鼻子
        fill('#E07A5F');
        triangle(0, -2, -4, 4, 4, 4);
        // 加油棒（右手）
        stroke('#ff4d4d');
        strokeWeight(6);
        line(18, 6, 38, -6);
        noStroke();
        // 文字下方
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(12);
        stroke(0, 60);
        strokeWeight(0.5);
        fill('#000');
        text(this.t, 0, 40);
        pop();
    }
}

// 紅色警報
class RedAlarm {
    constructor() {
        this.isDead = false; // 持續顯示，直到 clearResultAnimation()
        this.flash = 0;
    }
    run() {
        this.flash = (sin(frameCount * 0.3) + 1) * 0.5;
        // 右上角紅色警報視覺
        push();
        let w = 160, h = 80;
        translate(width - w - 20, 20);
        noStroke();
        fill(255, 80, 80, 200 * (0.6 + 0.4 * this.flash));
        rect(0, 0, w, h, 8);
        // 鈴聲圖示
        fill(255);
        triangle(18, 22, 34, 22, 26, 10);
        // 文字
        textAlign(LEFT, CENTER);
        textSize(14);
        fill(255);
        text('警報！\n全部不正確', 50, 22);
        pop();
    }
}

// 置中訊息橫幅（持續顯示）
class MessageBanner {
    constructor(msg, colorHex) {
        this.msg = msg || '';
        this.col = colorHex || '#333';
        this.isDead = false;
        this.alpha = 0;
    }
    run() {
        // 漸入
        this.alpha = lerp(this.alpha, 220, 0.08);
        push();
        rectMode(CENTER);
        textAlign(CENTER, CENTER);
        fill(255, this.alpha * 0.95);
        noStroke();
        rect(width/2, height*0.18, min(width - 80, 680), 64, 10);
        fill(this.col, this.alpha);
        textSize(26);
        textStyle(BOLD);
        text(this.msg, width/2, height*0.18);
        pop();
    }
}

