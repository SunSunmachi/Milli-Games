/* ============================================
   Milli Games - メインスクリプト
   ============================================ */
"use strict";

// ============================================
// ゲームデータ
// ============================================
const games = [
  {
    id: 1,
    title: "爆弾回避マスター",
    description: "落下してくる爆弾を避けながらコインを集めるアクションゲーム。時間とともに難易度が上昇！",
    image: "https://picsum.photos/seed/bombdodge/400/250",
    points: 100,
    exp: "x1.2",
    tags: ["おすすめ"],
    link: "games/bomb-dodge.html"
  },
  {
    id: 2,
    title: "クリッカーヒーロー",
    description: "ひたすらタップしてハイスコアを狙え！コンボを繋げて倍率アップ。",
    image: "https://picsum.photos/seed/clickerhero/400/250",
    points: 50,
    exp: "x1.0",
    tags: ["おすすめ"],
    link: "games/clicker.html",
    comingSoon: false
  },
  {
    id: 3,
    title: "ファンタジークエスト",
    description: "広大な世界を冒険するRPG。仲間と共に魔王を倒せ！100時間を超える壮大な物語。",
    image: "https://picsum.photos/seed/fantasy/400/250",
    points: 200,
    exp: "x1.5",
    tags: ["おすすめ"],
    comingSoon: true
  },
  {
    id: 4,
    title: "スピードランナー",
    description: "疾走感抜群のランニングアクション。障害物をかわしながらどこまでも走り続けろ！",
    image: "https://picsum.photos/seed/speedrun/400/250",
    points: 80,
    exp: "x1.1",
    tags: ["新着"],
    comingSoon: true
  },
  {
    id: 5,
    title: "パズルワールド",
    description: "1000以上のステージに挑戦。頭をひねる魅惑のパズルゲームであなたの知力を試せ！",
    image: "https://picsum.photos/seed/puzzleworld/400/250",
    points: 150,
    exp: "x1.3",
    tags: ["新着"],
    comingSoon: true
  },
  {
    id: 6,
    title: "ドラゴンアドベンチャー",
    description: "伝説のドラゴンを育成して冒険に出よう！ドラゴンとの絆が世界を救う鍵だ。",
    image: "https://picsum.photos/seed/dragonadv/400/250",
    points: 180,
    exp: "x1.4",
    tags: ["おすすめ", "新着"],
    comingSoon: true
  },
  {
    id: 7,
    title: "スペースインベーダー",
    description: "宇宙から迫る侵略者を撃ち落とせ！レトロで新しいシューティング体験。",
    image: "https://picsum.photos/seed/spaceinv/400/250",
    points: 120,
    exp: "x1.2",
    tags: ["新着"],
    comingSoon: true
  }
];

// お知らせデータ
const newsData = [
  { date: "2026.07.10", text: "夏のキャンペーン開催中！最大50%OFF" },
  { date: "2026.07.08", text: "新作「クリッカーヒーロー」が登場！" },
  { date: "2026.07.05", text: "【メンテナンス】7/15 2:00-5:00 サーバーメンテナンス" },
  { date: "2026.07.01", text: "「爆弾回避マスター」がアップデート" }
];

// ============================================
// DOM参照（最小限）
// ============================================
const el = {
  track: document.getElementById("carousel-track"),
  container: document.getElementById("carousel-container"),
  indicators: document.getElementById("carousel-indicators"),
  prevBtn: document.getElementById("carousel-prev"),
  nextBtn: document.getElementById("carousel-next"),
  filterTabs: document.querySelectorAll(".filter-tab"),
  sideMenu: document.getElementById("side-menu"),
  menuOverlay: document.getElementById("menu-overlay"),
  menuBtn: document.getElementById("menu-btn"),
  closeMenuBtn: document.getElementById("close-menu"),
  volumeSlider: document.getElementById("volume-slider"),
  volumeLabel: document.getElementById("volume-label"),
  menuNewsList: document.getElementById("menu-news-list"),
};

// ============================================
// 状態
// ============================================
const state = {
  currentIndex: 0,
  currentFilter: "すべて",
  isDragging: false,
  startX: 0,
  startY: 0,
  currentTranslate: 0,
  previousTranslate: 0,
  lastMoveX: 0,
  lastMoveTime: 0,
  velocity: 0,
  autoPlayTimer: null,
  isTransitioning: false,
  isPaused: false
};

// ============================================
// 表示するゲームを取得（フィルター）
// ============================================
function getFilteredGames() {
  if (state.currentFilter === "すべて") return games;
  return games.filter(function (g) {
    return g.tags.indexOf(state.currentFilter) !== -1;
  });
}

// ============================================
// カードHTMLを生成
// ============================================
function createCardHTML(game) {
  var btnHtml = game.link
    ? '<a href="' + game.link + '" class="card-btn">ゲームスタート</a>'
    : '<button class="card-btn coming-soon" disabled>準備中</button>';

  var badgeHtml = game.comingSoon
    ? '<div class="card-badge coming-soon-badge">準備中</div>'
    : "";

  var pointsHtml = game.comingSoon ? "???" : game.points + "pt";
  var expHtml = game.comingSoon ? "???" : "EXP " + game.exp;

  return (
    '<div class="game-card">' +
      '<div class="card-image">' +
        '<img src="' + game.image + '" alt="' + game.title + '" loading="lazy">' +
        '<div class="card-reflection"></div>' +
        badgeHtml +
      "</div>" +
      '<div class="card-body">' +
        '<h3 class="card-title">' + game.title + "</h3>" +
        '<p class="card-description">' + game.description + "</p>" +
      "</div>" +
      '<div class="card-footer">' +
        '<div class="card-stats">' +
          '<span class="card-points">' + pointsHtml + "</span>" +
          '<span class="card-exp">' + expHtml + "</span>" +
        "</div>" +
        btnHtml +
      "</div>" +
    "</div>"
  );
}

// ============================================
// カードを生成してトラックに追加
// ============================================
function generateCards() {
  var filtered = getFilteredGames();
  var html = "";

  for (var i = 0; i < filtered.length; i++) {
    html += createCardHTML(filtered[i]);
  }

  el.track.innerHTML = html;

  // 無限ループ用に最初と最後のカードをクローン
  var cards = el.track.children;
  if (cards.length > 1) {
    var firstClone = cards[0].cloneNode(true);
    var lastClone = cards[cards.length - 1].cloneNode(true);
    el.track.appendChild(firstClone);
    el.track.insertBefore(lastClone, cards[0]);
  }

  // カード枚数に応じて矢印の表示制御
  var total = filtered.length;
  if (total <= 1) {
    el.prevBtn.classList.remove("visible");
    el.nextBtn.classList.remove("visible");
    stopAutoPlay();
  } else {
    el.prevBtn.classList.add("visible");
    el.nextBtn.classList.add("visible");
  }
}

// ============================================
// カルーセルのサイズ情報を取得（CSSと同期）
// ============================================
function getCardSpecs() {
  var containerWidth = el.container.offsetWidth;
  var gap = 16;
  var w = window.innerWidth;
  var ratio;
  if (w < 768) ratio = 0.85;
  else if (w < 1024) ratio = 0.70;
  else if (w < 1280) ratio = 0.50;
  else ratio = 0.42;
  var cardWidth = containerWidth * ratio;
  return {
    containerWidth: containerWidth,
    cardWidth: cardWidth,
    gap: gap,
    cardOffset: cardWidth + gap
  };
}

// ============================================
// トラックのtransform値を取得
// ============================================
function getTranslateX() {
  var transform = window.getComputedStyle(el.track).transform;
  if (transform === "none") return 0;
  var match = transform.match(/matrix(?:3d)?\((.+)\)/);
  if (!match) return 0;
  var values = match[1].split(/,\s*/);
  var tx = values.length === 6 ? parseFloat(values[4]) : parseFloat(values[12]);
  return tx || 0;
}

// ============================================
// カルーセルを更新
// ============================================
function updateCarousel(index, animate) {
  var filtered = getFilteredGames();
  if (filtered.length === 0) return;

  var cloneOffset = 1;
  var realIndex = index + cloneOffset;
  var specs = getCardSpecs();
  var translateX = (specs.containerWidth - specs.cardWidth) / 2 - realIndex * specs.cardOffset;

  if (!animate) {
    el.track.style.transition = "none";
  } else {
    el.track.style.transition = "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
  }

  el.track.style.transform = "translateX(" + translateX + "px)";
  state.currentTranslate = translateX;
  state.previousTranslate = translateX;

  // アクティブカードを設定
  var cards = el.track.querySelectorAll(".game-card");
  for (var i = 0; i < cards.length; i++) {
    if (i === realIndex) {
      cards[i].classList.add("active");
    } else {
      cards[i].classList.remove("active");
    }
  }

  updateIndicators(index);
  state.currentIndex = index;
}

// ============================================
// インジケーター（ドット）を更新
// ============================================
function updateIndicators(index) {
  var filtered = getFilteredGames();
  var html = "";
  for (var i = 0; i < filtered.length; i++) {
    html +=
      '<button class="carousel-dot' +
      (i === index ? " active" : "") +
      '" data-slide="' +
      i +
      '" aria-label="' +
      (i + 1) +
      "枚目\"></button>";
  }
  el.indicators.innerHTML = html;
}

// ============================================
// 無限ループ処理
// ============================================
function handleInfiniteLoop() {
  var filtered = getFilteredGames();
  if (filtered.length <= 1) return;

  var total = filtered.length;

  if (state.currentIndex < 0) {
    el.track.style.transition = "none";
    state.currentIndex = total - 1;
    updateCarousel(state.currentIndex, false);
  } else if (state.currentIndex >= total) {
    el.track.style.transition = "none";
    state.currentIndex = 0;
    updateCarousel(state.currentIndex, false);
  }

  // 強制再描画
  void el.track.offsetHeight;
}

// ============================================
// ナビゲーション
// ============================================
function goToPrev() {
  if (state.isTransitioning) return;
  state.isTransitioning = true;
  state.currentIndex--;
  updateCarousel(state.currentIndex, true);
  setTimeout(function () {
    handleInfiniteLoop();
    state.isTransitioning = false;
  }, 500);
}

function goToNext() {
  if (state.isTransitioning) return;
  state.isTransitioning = true;
  state.currentIndex++;
  updateCarousel(state.currentIndex, true);
  setTimeout(function () {
    handleInfiniteLoop();
    state.isTransitioning = false;
  }, 500);
}

function goToSlide(index) {
  if (state.isTransitioning) return;
  state.isTransitioning = true;
  state.currentIndex = index;
  updateCarousel(index, true);
  setTimeout(function () {
    state.isTransitioning = false;
  }, 500);
}

// ============================================
// 一番近いカードにスナップ
// ============================================
function snapToNearest() {
  var specs = getCardSpecs();
  var translate = getTranslateX();
  var filtered = getFilteredGames();
  var total = filtered.length;
  var cloneOffset = 1;

  var naturalCenter = (specs.containerWidth - specs.cardWidth) / 2;
  var rawPosition = (naturalCenter - translate) / specs.cardOffset;
  var nearestPosition = Math.round(rawPosition);
  var constrainedPos = Math.max(0, Math.min(nearestPosition, total + 1));

  var newTranslate = naturalCenter - constrainedPos * specs.cardOffset;

  el.track.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  el.track.style.transform = "translateX(" + newTranslate + "px)";
  state.currentTranslate = newTranslate;
  state.previousTranslate = newTranslate;

  // UI更新
  var realIndex = constrainedPos - cloneOffset;
  state.currentIndex = Math.max(0, Math.min(realIndex, total - 1));
  updateIndicators(state.currentIndex);

  // アクティブカード
  var cards = el.track.querySelectorAll(".game-card");
  for (var i = 0; i < cards.length; i++) {
    if (i === constrainedPos) {
      cards[i].classList.add("active");
    } else {
      cards[i].classList.remove("active");
    }
  }

  // アニメーション完了後
  setTimeout(function () {
    if (constrainedPos <= 0 || constrainedPos >= total + 1) {
      handleInfiniteLoop();
    }
  }, 400);

  // 自動再生（3秒後に再開）
  setTimeout(startAutoPlay, 3000);
}

// ============================================
// 慣性スクロール
// ============================================
function applyInertia() {
  var friction = 0.95;
  var v = state.velocity;
  var translate = getTranslateX();
  var frameCount = 0;

  function step() {
    v *= friction;
    translate += v * 16;
    frameCount++;

    if (Math.abs(v) < 0.5 || frameCount > 60) {
      el.track.style.transition = "none";
      el.track.style.transform = "translateX(" + translate + "px)";
      state.currentTranslate = translate;
      snapToNearest();
      return;
    }

    el.track.style.transition = "none";
    el.track.style.transform = "translateX(" + translate + "px)";
    state.currentTranslate = translate;

    requestAnimationFrame(step);
  }

  step();
}

// ============================================
// ドラッグ操作
// ============================================
function handleDragStart(clientX, clientY) {
  if (state.isTransitioning) return;
  state.isDragging = true;
  state.isPaused = true;
  stopAutoPlay();
  el.track.classList.add("dragging");

  state.startX = clientX;
  state.startY = clientY;
  state.lastMoveX = clientX;
  state.lastMoveTime = Date.now();
  state.velocity = 0;
  state.previousTranslate = getTranslateX();

  el.track.style.transition = "none";
}

function handleDragMove(clientX) {
  if (!state.isDragging) return;

  var deltaX = clientX - state.startX;
  var newTranslate = state.previousTranslate + deltaX;

  // 速度計算
  var now = Date.now();
  var dt = now - state.lastMoveTime;
  if (dt > 0) {
    state.velocity = (clientX - state.lastMoveX) / dt;
  }
  state.lastMoveX = clientX;
  state.lastMoveTime = now;

  state.currentTranslate = newTranslate;
  el.track.style.transform = "translateX(" + newTranslate + "px)";
}

function handleDragEnd() {
  if (!state.isDragging) return;
  state.isDragging = false;
  state.isPaused = false;
  el.track.classList.remove("dragging");

  if (Math.abs(state.velocity) > 0.3) {
    applyInertia();
  } else {
    snapToNearest();
  }
}

// ============================================
// 自動再生
// ============================================
function startAutoPlay() {
  stopAutoPlay();
  if (getFilteredGames().length <= 1) return;
  if (state.isPaused) return;

  state.autoPlayTimer = setInterval(function () {
    if (!state.isDragging && !state.isPaused) {
      state.currentIndex++;
      updateCarousel(state.currentIndex, true);
      setTimeout(function () {
        handleInfiniteLoop();
      }, 500);
    }
  }, 4000);
}

function stopAutoPlay() {
  if (state.autoPlayTimer) {
    clearInterval(state.autoPlayTimer);
    state.autoPlayTimer = null;
  }
}

// ============================================
// メニュー開閉
// ============================================
function openMenu() {
  el.sideMenu.classList.add("open");
  el.menuOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  el.sideMenu.classList.remove("open");
  el.menuOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

// ============================================
// 音量設定
// ============================================
function setupVolume() {
  // 保存された音量を復元
  var saved = localStorage.getItem("milli-volume");
  if (saved !== null) {
    el.volumeSlider.value = saved;
    el.volumeLabel.textContent = saved + "%";
  }

  el.volumeSlider.addEventListener("input", function () {
    var val = el.volumeSlider.value;
    el.volumeLabel.textContent = val + "%";
    localStorage.setItem("milli-volume", val);
  });
}

// ============================================
// サイドパネル・メニュー内容を生成
// ============================================
function generateSideContent() {
  // サイドパネルのお知らせ
  var newsPanel = document.querySelector("#news-panel .panel-content");
  if (newsPanel) {
    var html = "";
    for (var i = 0; i < newsData.length; i++) {
      html +=
        '<div class="news-item">' +
        '<span class="news-date">' + newsData[i].date + "</span>" +
        '<span class="news-text">' + newsData[i].text + "</span>" +
        "</div>";
    }
    newsPanel.innerHTML = html;
  }

  // メニューのお知らせ
  if (el.menuNewsList) {
    var html = "";
    for (var i = 0; i < newsData.length; i++) {
      html += "<li>" + newsData[i].text + "</li>";
    }
    el.menuNewsList.innerHTML = html;
  }

  // ランキング
  var rankingPanel = document.querySelector("#ranking-panel .panel-content");
  if (rankingPanel) {
    var sorted = games.slice().sort(function (a, b) {
      return b.points - a.points;
    });
    var html = "<ol>";
    for (var i = 0; i < Math.min(5, sorted.length); i++) {
      html += "<li>" + sorted[i].title + " - " + sorted[i].points + "pt</li>";
    }
    html += "</ol>";
    rankingPanel.innerHTML = html;
  }

  // 最近追加
  var recentPanel = document.querySelector("#recent-panel .panel-content");
  if (recentPanel) {
    var recent = games.filter(function (g) {
      return g.tags.indexOf("新着") !== -1;
    });
    var html = "";
    for (var i = 0; i < recent.length; i++) {
      html +=
        '<div class="recent-item">' +
        '<span class="recent-title">' + recent[i].title + "</span>" +
        '<span class="recent-tag">新着</span>' +
        "</div>";
    }
    recentPanel.innerHTML = html;
  }
}

// ============================================
// イベント登録
// ============================================

// タッチイベント（カルーセル）
el.track.addEventListener("touchstart", function (e) {
  state.startY = e.touches[0].clientY;
  handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

el.track.addEventListener("touchmove", function (e) {
  var deltaY = Math.abs(e.touches[0].clientY - state.startY);
  var deltaX = Math.abs(e.touches[0].clientX - state.startX);
  if (deltaX > deltaY) {
    e.preventDefault();
    handleDragMove(e.touches[0].clientX);
  }
}, { passive: false });

el.track.addEventListener("touchend", function () {
  handleDragEnd();
});

// マウスイベント（カルーセル）
el.track.addEventListener("mousedown", function (e) {
  handleDragStart(e.clientX, e.clientY);
  e.preventDefault();
});

document.addEventListener("mousemove", function (e) {
  handleDragMove(e.clientX);
});

document.addEventListener("mouseup", function () {
  handleDragEnd();
});

// カルーセル上でマウスリーブ時にドラッグ解除
document.addEventListener("mouseleave", function () {
  if (state.isDragging) {
    handleDragEnd();
  }
});

// 矢印ボタン
el.prevBtn.addEventListener("click", goToPrev);
el.nextBtn.addEventListener("click", goToNext);

// インジケーター（ドット）
el.indicators.addEventListener("click", function (e) {
  var dot = e.target.closest(".carousel-dot");
  if (dot) {
    var index = parseInt(dot.getAttribute("data-slide"));
    goToSlide(index);
  }
});

// フィルタータブ
for (var i = 0; i < el.filterTabs.length; i++) {
  el.filterTabs[i].addEventListener("click", function () {
    var filter = this.getAttribute("data-filter");
    if (filter === state.currentFilter) return;

    // アクティブ切り替え
    for (var j = 0; j < el.filterTabs.length; j++) {
      el.filterTabs[j].classList.remove("active");
    }
    this.classList.add("active");

    state.currentFilter = filter;
    state.currentIndex = 0;
    state.isPaused = false;
    state.isDragging = false;
    state.isTransitioning = false;
    el.track.classList.remove("dragging");
    stopAutoPlay();
    generateCards();
    updateCarousel(0, false);
    startAutoPlay();
  });
}

// メニュー
el.menuBtn.addEventListener("click", openMenu);
el.closeMenuBtn.addEventListener("click", closeMenu);
el.menuOverlay.addEventListener("click", closeMenu);

// ESCキーでメニューを閉じる
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (el.sideMenu.classList.contains("open")) {
      closeMenu();
    }
  }
});

// 音量設定
setupVolume();

// サイドパネル内容生成
generateSideContent();

// ============================================
// リサイズ対応
// ============================================
var resizeTimer = null;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    updateCarousel(state.currentIndex, false);
  }, 150);
});

// ============================================
// 初期化
// ============================================
(function init() {
  generateCards();
  updateCarousel(0, false);
  startAutoPlay();
})();
