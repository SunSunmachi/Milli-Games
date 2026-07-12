/* ============================================
   リズムゲーム メインエンジン
   YouTube連携 + 譜面再生 + tap/hold/flick判定
   ============================================ */
(function () {
  "use strict";

  // ============================================
  // 曲リスト
  // ============================================
  var SONGS = [
    { id: "princess_viral", title: "Princess Viral", artist: "音ノ乃のの", bpm: 134 }
  ];

  // ============================================
  // 定数
  // ============================================
  var LANE_COUNT = 4;
  var LANE_COLORS = ["#E74C3C", "#3498DB", "#2ECC71", "#F1C40F"];
  var LANE_KEYS = ["KeyD", "KeyF", "KeyJ", "KeyK"];
  var JUDGE_Y_RATIO = 0.80;
  var SCROLL_AHEAD = 2.0;
  var PERFECT_RANGE = 0.040;
  var GREAT_RANGE = 0.080;
  var GOOD_RANGE = 0.120;
  var MISS_THRESHOLD = 0.200;
  var SCORE_PERFECT = 300;
  var SCORE_GREAT = 200;
  var SCORE_GOOD = 100;
  var HOLD_BONUS = 100;
  var FLICK_BONUS = 50;

  // ============================================
  // DOM参照
  // ============================================
  var canvas = document.getElementById("game-canvas");
  var ctx = canvas.getContext("2d");
  var boardWrapper = document.getElementById("board-wrapper");
  var elScore = document.getElementById("score");
  var elBest = document.getElementById("best-score");
  var elCombo = document.getElementById("combo");
  var elJudge = document.getElementById("judge");
  var elAccuracy = document.getElementById("accuracy");
  var elFinalScore = document.getElementById("final-score");
  var elResultJudges = document.getElementById("result-judges");
  var elFinalAccuracy = document.getElementById("final-accuracy");
  var elBestResult = document.getElementById("best-result");
  var elSongSelectOverlay = document.getElementById("overlay-song-select");
  var elStartOverlay = document.getElementById("overlay-start");
  var elResultOverlay = document.getElementById("overlay-result");
  var elBtnStart = document.getElementById("btn-start");
  var elBtnRetry = document.getElementById("btn-retry");
  var elBtnBackSelect = document.getElementById("btn-back-select");
  var elBtnBackSelectResult = document.getElementById("btn-back-select-result");
  var elStatusText = document.getElementById("video-status");
  var laneButtons = document.querySelectorAll(".lane-btn");
  var elOffsetSlider = document.getElementById("offset-slider");
  var elOffsetValue = document.getElementById("offset-value");
  var elOffsetDisplay = document.getElementById("offset-display");
  var elOffsetHud = document.getElementById("offset-hud");
  var elTestSound = document.getElementById("btn-test-sound");
  var diffBtns = document.querySelectorAll(".diff-btn");
  var elSongList = document.getElementById("song-list");
  var elSongTitle = document.getElementById("song-title");
  var elSettingsSongTitle = document.getElementById("settings-song-title");
  var elSettingsSongArtist = document.getElementById("settings-song-artist");
  var elResultSongTitle = document.getElementById("result-song-title");
  var elResultDifficulty = document.getElementById("result-difficulty");

  // ============================================
  // 状態
  // ============================================
  var cw = 0, ch = 0, lw = 0, judgeY = 0, dpr = 1;
  var score = 0, bestScore = 0, combo = 0, maxCombo = 0;
  var totalNotes = 0, judgedNotes = 0, accuracyTotal = 0, accuracyMax = 0;
  var counts = { perfect: 0, great: 0, good: 0, miss: 0 };
  var running = false, started = false, chartTime = 0;
  var player = null, playerReady = false, animId = null;
  var activeNotes = [], effects = [], judgeTexts = [];
  var laneFlash = [0, 0, 0, 0];
  var laneHeld = [false, false, false, false];
  var holdActive = [null, null, null, null];
  var chart = null, noteIdx = 0;
  var flickTracker = [null, null, null, null];
  var fadeOutActive = false, fadeOutStart = 0;
  var FADE_DURATION = 3.0;
  var selectedSongId = null;
  var offsetToastTimer = 0;

  // ============================================
  // 設定（ユーザーが変更可能）
  // ============================================
  var config = {
    difficulty: "normal",
    userOffset: 0
  };

  function updateJudgment() {
    switch (config.difficulty) {
      case "easy":
        PERFECT_RANGE = 0.060; GREAT_RANGE = 0.120; GOOD_RANGE = 0.180; MISS_THRESHOLD = 0.260;
        break;
      case "hard":
        PERFECT_RANGE = 0.025; GREAT_RANGE = 0.050; GOOD_RANGE = 0.090; MISS_THRESHOLD = 0.160;
        break;
      default:
        PERFECT_RANGE = 0.040; GREAT_RANGE = 0.080; GOOD_RANGE = 0.120; MISS_THRESHOLD = 0.200;
    }
  }

  // ============================================
  // YouTube API
  // ============================================
  window.onYouTubeIframeAPIReady = function () {
    var vid = (typeof CHARTS !== "undefined" && selectedSongId && CHARTS[selectedSongId])
      ? CHARTS[selectedSongId].videoId : "MF4Yw8IS6og";
    createPlayer(vid);
  };

  function createPlayer(vid) {
    if (player) {
      try { player.destroy(); } catch (e) {}
      player = null;
      playerReady = false;
    }
    player = new YT.Player("player", {
      height: "100%",
      width: "100%",
      videoId: vid,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: function () {
          playerReady = true;
          elStatusText.textContent = "再生準備完了";
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED && running && !fadeOutActive) {
            endGame();
          }
        },
        onError: function () {
          elStatusText.textContent = "動画の読み込みに失敗しました";
        }
      }
    });
  }

  (function loadYT() {
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    var first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(tag, first);
  })();

  // ============================================
  // Canvas初期化
  // ============================================
  function initCanvas() {
    dpr = window.devicePixelRatio || 1;
    var rect = boardWrapper.getBoundingClientRect();
    var btnsEl = document.getElementById("lane-buttons");
    var btnsH = btnsEl ? btnsEl.offsetHeight : 48;

    cw = rect.width;
    ch = Math.max(1, rect.height - btnsH);

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    lw = cw / LANE_COUNT;
    judgeY = ch * JUDGE_Y_RATIO;
  }

  // ============================================
  // スコア管理（曲ごと）
  // ============================================
  function bestKey(songId, diff) {
    return "rhythmBest_" + songId + "_" + diff;
  }

  function loadBest() {
    if (!selectedSongId) { elBest.textContent = "0"; return; }
    var key = bestKey(selectedSongId, config.difficulty);
    var v = localStorage.getItem(key);
    bestScore = v ? parseInt(v, 10) : 0;
    elBest.textContent = bestScore;
  }

  function saveBest() {
    if (!selectedSongId) return;
    if (score > bestScore) {
      bestScore = score;
      var key = bestKey(selectedSongId, config.difficulty);
      localStorage.setItem(key, bestScore);
      elBest.textContent = bestScore;
    }
  }

  // ============================================
  // 設定の読み込み/保存
  // ============================================
  function loadConfig() {
    var savedDiff = localStorage.getItem("rhythmDifficulty");
    if (savedDiff) {
      config.difficulty = savedDiff;
      diffBtns.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-diff") === savedDiff);
      });
    }
    updateJudgment();

    var savedOffset = localStorage.getItem("rhythmOffset");
    if (savedOffset !== null) {
      config.userOffset = parseInt(savedOffset, 10);
      elOffsetSlider.value = config.userOffset;
      var label = (config.userOffset >= 0 ? "+" : "") + config.userOffset + "ms";
      elOffsetValue.textContent = label;
    }
  }

  function updateHUD() {
    elScore.textContent = score;
    elCombo.textContent = combo;
    var total = counts.perfect + counts.great + counts.good + counts.miss;
    var acc = total > 0
      ? Math.round((counts.perfect * 3 + counts.great * 2 + counts.good) / (total * 3) * 100)
      : 100;
    elAccuracy.textContent = acc + "%";
  }

  // ============================================
  // ノーツ管理
  // ============================================
  function spawnNotes() {
    while (noteIdx < chart.notes.length) {
      var n = chart.notes[noteIdx];
      if (n.t - chartTime > SCROLL_AHEAD + 0.5) break;
      activeNotes.push({
        t: n.t, l: n.l, type: n.type, d: n.d || 0,
        hit: false, judged: false, held: false, holdProgress: 0
      });
      noteIdx++;
    }
  }

  function cleanupNotes() {
    for (var i = activeNotes.length - 1; i >= 0; i--) {
      var n = activeNotes[i];
      if (n.judged && n.type !== "hold") {
        activeNotes.splice(i, 1);
      } else if (n.judged && n.type === "hold" && n.holdProgress >= 1) {
        activeNotes.splice(i, 1);
      }
    }
  }

  // ============================================
  // 判定
  // ============================================
  function judgeNote(note, diff) {
    var absDiff = Math.abs(diff);
    var judgeText = "", judgeColor = "", points = 0;

    if (absDiff <= PERFECT_RANGE) {
      judgeText = "PERFECT"; judgeColor = "#F1C40F"; points = SCORE_PERFECT; counts.perfect++;
    } else if (absDiff <= GREAT_RANGE) {
      judgeText = "GREAT"; judgeColor = "#2ECC71"; points = SCORE_GREAT; counts.great++;
    } else if (absDiff <= GOOD_RANGE) {
      judgeText = "GOOD"; judgeColor = "#3498DB"; points = SCORE_GOOD; counts.good++;
    } else {
      return;
    }

    note.hit = true; note.judged = true; judgedNotes++;

    if (points > 0) {
      if (note.type === "flick") points += FLICK_BONUS;
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      points += Math.floor(combo * 5);
    }

    accuracyTotal += points > 0 ? (absDiff <= PERFECT_RANGE ? 3 : absDiff <= GREAT_RANGE ? 2 : 1) : 0;
    accuracyMax += 3;

    score += points;
    updateHUD();

    elJudge.textContent = judgeText;
    elJudge.style.color = judgeColor;

    var nx = note.l * lw + lw / 2;
    spawnHitEffect(nx, judgeY, judgeColor);
    spawnJudgeText(judgeText, judgeColor, cw / 2, judgeY - 30, combo);
  }

  function autoMiss(note) {
    note.judged = true; judgedNotes++; combo = 0; counts.miss++;
    updateHUD();
    elJudge.textContent = "MISS"; elJudge.style.color = "#E74C3C";
    spawnJudgeText("MISS", "#E74C3C", cw / 2, judgeY - 30, 0);
  }

  // ============================================
  // エフェクト
  // ============================================
  function spawnHitEffect(x, y, color) {
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 4;
      effects.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color: color, r: 2 + Math.random() * 3 });
    }
  }

  function spawnJudgeText(text, color, x, y, comboCount) {
    judgeTexts.push({ text: text, color: color, x: x, y: y, life: 1, combo: comboCount });
  }

  // ============================================
  // 更新
  // ============================================
  function update() {
    if (!running) return;

    try {
      if (player && player.getCurrentTime) {
        chartTime = player.getCurrentTime() - (chart.offset || 0) + (config.userOffset / 1000);
      }
    } catch (e) {}

    spawnNotes();
    cleanupNotes();

    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.judged) continue;
      var diff = n.t - chartTime;
      if (diff < -MISS_THRESHOLD) autoMiss(n);
    }

    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.type !== "hold" || !n.hit || n.holdProgress >= 1) continue;
      if (laneHeld[n.l]) {
        n.holdProgress = Math.min(1, (chartTime - n.t) / n.d);
        if (n.holdProgress >= 1) {
          score += HOLD_BONUS; updateHUD();
          spawnJudgeText("HOLD OK", "#2ECC71", cw / 2, judgeY - 55, 0);
          holdActive[n.l] = null;
        }
      }
    }

    for (var i = effects.length - 1; i >= 0; i--) {
      var e = effects[i];
      e.x += e.vx; e.y += e.vy; e.life -= 0.04;
      if (e.life <= 0) effects.splice(i, 1);
    }

    for (var i = judgeTexts.length - 1; i >= 0; i--) {
      var jt = judgeTexts[i];
      jt.y -= 0.8; jt.life -= 0.02;
      if (jt.life <= 0) judgeTexts.splice(i, 1);
    }

    for (var i = 0; i < LANE_COUNT; i++) {
      if (laneFlash[i] > 0) { laneFlash[i] *= 0.92; if (laneFlash[i] < 0.01) laneFlash[i] = 0; }
    }

    if (!fadeOutActive) {
      var duration = (chart && chart.duration) ? chart.duration : 109;
      var lastNoteTime = chart.notes.length > 0 ? chart.notes[chart.notes.length - 1].t : 0;
      if (chartTime >= duration || (chartTime > lastNoteTime + 2 && judgedNotes >= totalNotes)) {
        startFadeOut();
      }
    }

    if (fadeOutActive) {
      var fadeElapsed = chartTime - fadeOutStart;
      var fadeProgress = Math.min(1, fadeElapsed / FADE_DURATION);
      try { player.setVolume(Math.round((1 - fadeProgress) * 100)); } catch (e) {}
      var videoFade = document.getElementById("video-fade-overlay");
      if (videoFade) videoFade.style.opacity = fadeProgress;
      if (fadeProgress >= 1) {
        fadeOutActive = false; running = false;
        try { player.pauseVideo(); } catch (e) {}
        endGame(); return;
      }
    }
  }

  // ============================================
  // 描画
  // ============================================
  function draw() {
    ctx.clearRect(0, 0, cw, ch);

    // 背景
    var grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "#0d001a");
    grad.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // レーン背景色
    for (var i = 0; i < LANE_COUNT; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.005)";
      ctx.fillRect(i * lw, 0, lw, ch);
    }

    // レーン線
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= LANE_COUNT; i++) {
      ctx.beginPath(); ctx.moveTo(i * lw, 0); ctx.lineTo(i * lw, ch); ctx.stroke();
    }

    // レーンフラッシュ
    for (var i = 0; i < LANE_COUNT; i++) {
      if (laneFlash[i] > 0) {
        ctx.fillStyle = "rgba(" + hexToRgb(LANE_COLORS[i]) + "," + (laneFlash[i] * 0.15) + ")";
        ctx.fillRect(i * lw, 0, lw, ch);
      }
    }

    // 判定ライン
    ctx.beginPath(); ctx.moveTo(0, judgeY); ctx.lineTo(cw, judgeY);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, judgeY); ctx.lineTo(cw, judgeY);
    ctx.strokeStyle = "rgba(187,134,252,0.2)"; ctx.lineWidth = 6; ctx.stroke();

    // 判定ライングロー
    var glowGrad = ctx.createLinearGradient(0, judgeY - 8, 0, judgeY + 8);
    glowGrad.addColorStop(0, "rgba(187,134,252,0)");
    glowGrad.addColorStop(0.5, "rgba(187,134,252,0.08)");
    glowGrad.addColorStop(1, "rgba(187,134,252,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, judgeY - 8, cw, 16);

    // ビートパルス
    if (running && chart) {
      var bpm = chart.bpm || 134;
      var beatMs = 60000 / bpm;
      var elapsed = chartTime * 1000;
      var beatPhase = (elapsed % beatMs) / beatMs;
      var pulse = Math.max(0, 1 - beatPhase * 4);
      if (pulse > 0) {
        ctx.fillStyle = "rgba(187,134,252," + (pulse * 0.04) + ")";
        ctx.fillRect(0, 0, cw, ch);
      }
    }

    // ノーツ描画（ピル型）
    var noteW = lw * 0.72;
    var noteH = ch * 0.04;
    var noteR = noteH / 2;

    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.judged && n.type !== "hold") continue;
      if (n.type === "hold" && n.holdProgress >= 1) continue;

      var diff = n.t - chartTime;
      var ny = judgeY - (diff / SCROLL_AHEAD) * judgeY;
      if (ny < -noteH * 2 || ny > ch + noteH * 2) continue;

      var nx = n.l * lw + lw / 2;
      var color = LANE_COLORS[n.l];

      // ホールドノーツのテール
      if (n.type === "hold") {
        var tailEnd = judgeY - ((n.t + n.d) - chartTime) / SCROLL_AHEAD * judgeY;
        var tailTop = Math.min(ny, tailEnd);
        var tailBottom = Math.max(ny, tailEnd);
        if (tailBottom > 0 && tailTop < ch) {
          var tailGrad = ctx.createLinearGradient(0, tailTop, 0, tailBottom);
          if (n.hit) {
            tailGrad.addColorStop(0, "rgba(187,134,252,0.6)");
            tailGrad.addColorStop(1, "rgba(187,134,252,0.2)");
          } else {
            tailGrad.addColorStop(0, "rgba(255,255,255,0.15)");
            tailGrad.addColorStop(1, "rgba(255,255,255,0.04)");
          }
          ctx.fillStyle = tailGrad;
          ctx.beginPath();
          roundRect(ctx, nx - noteW * 0.3, Math.max(0, tailTop), noteW * 0.6, Math.min(ch, tailBottom) - Math.max(0, tailTop), noteR * 0.3);
          ctx.fill();
        }
      }

      ctx.save();

      // グロー
      if (!n.judged || (n.type === "hold" && n.hit)) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 + 6 * (ny < judgeY ? (judgeY - ny) / judgeY : 0);
      }

      // ピル本体
      ctx.beginPath();
      roundRect(ctx, nx - noteW / 2, ny - noteH / 2, noteW, noteH, noteR);
      var nGrad = ctx.createLinearGradient(0, ny - noteH / 2, 0, ny + noteH / 2);
      nGrad.addColorStop(0, lighten(color, 50));
      nGrad.addColorStop(0.4, color);
      nGrad.addColorStop(1, darken(color, 30));
      ctx.fillStyle = nGrad;
      ctx.fill();

      ctx.shadowBlur = 0;

      // トップの光沢ライン
      ctx.beginPath();
      roundRect(ctx, nx - noteW / 2 + 4, ny - noteH / 2 + 2, noteW - 8, noteH * 0.3, noteR * 0.3);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fill();

      // フリック矢印
      if (n.type === "flick") {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "bold " + Math.round(noteH * 0.7) + "px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("▶", nx, ny + 1);
      } else if (n.type === "hold") {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "bold " + Math.round(noteH * 0.55) + "px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("▼", nx - 1, ny + 1);
      }

      ctx.restore();
    }

    // エフェクト
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      ctx.globalAlpha = e.life;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * e.life, 0, Math.PI * 2);
      ctx.fillStyle = e.color; ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 判定テキスト
    ctx.textAlign = "center";
    for (var i = 0; i < judgeTexts.length; i++) {
      var jt = judgeTexts[i];
      ctx.globalAlpha = jt.life;
      ctx.font = "bold " + (jt.combo > 1 ? 20 : 16) + "px sans-serif";
      ctx.fillStyle = jt.color;
      ctx.fillText(jt.text, jt.x, jt.y);
      if (jt.combo > 1) {
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText(jt.combo + " COMBO", jt.x, jt.y + 22);
      }
    }
    ctx.globalAlpha = 1;

    // フェードアウトオーバーレイ
    if (fadeOutActive) {
      var fadeElapsed = chartTime - fadeOutStart;
      var fadeProgress = Math.min(1, fadeElapsed / FADE_DURATION);
      ctx.fillStyle = "rgba(0,0,0," + fadeProgress + ")";
      ctx.fillRect(0, 0, cw, ch);
    }

    // プログレスバー
    if (running && chart && chart.notes.length > 0) {
      var lastNote = chart.notes[chart.notes.length - 1].t;
      var progress = Math.min(chartTime / lastNote, 1);
      if (progress >= 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(0, 0, cw, 3);
        ctx.fillStyle = "#bb86fc";
        ctx.fillRect(0, 0, cw * progress, 3);
      }
    }

    // オフセットトースト（プレイ中に表示）
    if (offsetToastTimer > 0) {
      offsetToastTimer--;
      ctx.fillStyle = "rgba(187,134,252,0.85)";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      var label = "OFFSET " + (config.userOffset >= 0 ? "+" : "") + config.userOffset + "ms";
      ctx.fillText(label, cw / 2, 24);
    }
  }

  // ============================================
  // 描画ヘルパー
  // ============================================
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return r + "," + g + "," + b;
  }

  function lighten(hex, amt) {
    var r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amt);
    var g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amt);
    var b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amt);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function darken(hex, amt) {
    var r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amt);
    var g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amt);
    var b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amt);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ============================================
  // ヒット処理
  // ============================================
  function hitLane(lane) {
    if (!running) return;

    laneFlash[lane] = 1;
    laneHeld[lane] = true;
    flickTracker[lane] = { x: 0, t: performance.now() };

    var closest = null, closestDist = Infinity;
    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.l !== lane || n.judged) continue;
      var diff = Math.abs(n.t - chartTime);
      if (diff < closestDist) { closestDist = diff; closest = n; }
    }

    if (!closest || closestDist > GOOD_RANGE + 0.02) return;

    if (closest.type === "flick") { judgeNote(closest, closest.t - chartTime); return; }
    if (closest.type === "hold") {
      judgeNote(closest, closest.t - chartTime);
      if (closest.judged) holdActive[lane] = { note: closest };
      return;
    }
    judgeNote(closest, closest.t - chartTime);
  }

  function releaseLane(lane) {
    if (!running) return;
    laneHeld[lane] = false;

    if (holdActive[lane]) {
      var h = holdActive[lane], n = h.note;
      if (n && n.hit && n.holdProgress < 1) {
        var completion = n.holdProgress;
        if (completion > 0.8) {
          score += HOLD_BONUS; updateHUD();
          spawnJudgeText("HOLD OK", "#2ECC71", cw / 2, judgeY - 55, 0);
        } else {
          spawnJudgeText("HOLD BREAK", "#E74C3C", cw / 2, judgeY - 55, 0);
        }
        n.holdProgress = 1;
      }
      holdActive[lane] = null;
    }

    if (flickTracker[lane]) {
      var elapsed = performance.now() - flickTracker[lane].t;
      if (elapsed > 200) { flickTracker[lane] = null; return; }
      flickTracker[lane] = null;
    }
  }

  // ============================================
  // キーボード入力
  // ============================================
  document.addEventListener("keydown", function (e) {
    var idx = LANE_KEYS.indexOf(e.code);
    if (idx !== -1) { e.preventDefault(); hitLane(idx); }

    // プレイ中のオフセット調整
    if (running) {
      var step = e.shiftKey ? 50 : 10;
      if (e.code === "BracketLeft" || e.code === "Minus") {
        e.preventDefault();
        config.userOffset = Math.max(-300, config.userOffset - step);
        elOffsetSlider.value = config.userOffset;
        var label = (config.userOffset >= 0 ? "+" : "") + config.userOffset + "ms";
        elOffsetValue.textContent = label;
        elOffsetDisplay.textContent = label;
        localStorage.setItem("rhythmOffset", config.userOffset);
        offsetToastTimer = 60;
      }
      if (e.code === "BracketRight" || e.code === "Equal") {
        e.preventDefault();
        config.userOffset = Math.min(300, config.userOffset + step);
        elOffsetSlider.value = config.userOffset;
        var label = (config.userOffset >= 0 ? "+" : "") + config.userOffset + "ms";
        elOffsetValue.textContent = label;
        elOffsetDisplay.textContent = label;
        localStorage.setItem("rhythmOffset", config.userOffset);
        offsetToastTimer = 60;
      }
    }
  });

  document.addEventListener("keyup", function (e) {
    var idx = LANE_KEYS.indexOf(e.code);
    if (idx !== -1) releaseLane(idx);
  });

  // ============================================
  // レーンボタン入力（タッチ/マウス）
  // ============================================
  for (var i = 0; i < laneButtons.length; i++) {
    (function (btn) {
      var lane = parseInt(btn.getAttribute("data-lane"), 10);
      btn.addEventListener("pointerdown", function (e) { e.preventDefault(); btn.classList.add("pressed"); hitLane(lane); });
      btn.addEventListener("pointerup", function (e) { e.preventDefault(); btn.classList.remove("pressed"); releaseLane(lane); });
      btn.addEventListener("pointerleave", function (e) { btn.classList.remove("pressed"); releaseLane(lane); });
      btn.addEventListener("pointercancel", function (e) { btn.classList.remove("pressed"); releaseLane(lane); });
    })(laneButtons[i]);
  }

  // ============================================
  // ゲームループ
  // ============================================
  function gameLoop() {
    if (!running && !started) return;
    update();
    draw();
    animId = requestAnimationFrame(gameLoop);
  }

  // ============================================
  // フェードアウト
  // ============================================
  function startFadeOut() { fadeOutActive = true; fadeOutStart = chartTime; }

  // ============================================
  // テスト音
  // ============================================
  function playTestSound() {
    try {
      var actx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.connect(gain); gain.connect(actx.destination);
      osc.frequency.value = 880; osc.type = "sine";
      gain.gain.setValueAtTime(0.2, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.1);
      osc.start(actx.currentTime); osc.stop(actx.currentTime + 0.1);
    } catch (e) {}
  }

  // ============================================
  // 曲選択
  // ============================================
  function showSongSelect() {
    elSongSelectOverlay.classList.add("active");
    elStartOverlay.classList.remove("active");
    elResultOverlay.classList.remove("active");
  }

  function selectSong(songId) {
    selectedSongId = songId;
    var song = null;
    for (var i = 0; i < SONGS.length; i++) {
      if (SONGS[i].id === songId) { song = SONGS[i]; break; }
    }
    if (!song) return;

    elSongTitle.textContent = song.title + " / " + song.artist;
    elSettingsSongTitle.textContent = song.title;
    elSettingsSongArtist.textContent = song.artist;

    // この曲の難しい度別ベストスコアを表示
    loadBest();

    elSongSelectOverlay.classList.remove("active");
    elStartOverlay.classList.add("active");
    elResultOverlay.classList.remove("active");

    // YouTubeプレーヤーを切り替え
    if (typeof CHARTS !== "undefined" && CHARTS[songId]) {
      var chartData = CHARTS[songId];
      if (typeof YT !== "undefined" && YT.Player) {
        createPlayer(chartData.videoId);
      } else {
        // API未ロード - onYouTubeIframeAPIReadyで処理済み or 後で処理
      }
    }
  }

  function buildSongList() {
    var html = "";
    for (var i = 0; i < SONGS.length; i++) {
      var s = SONGS[i];
      var chartData = (typeof CHARTS !== "undefined" && CHARTS[s.id]) ? CHARTS[s.id] : null;
      var noteCount = chartData ? chartData.notes.length : "?";
      html +=
        '<button class="song-card" data-song="' + s.id + '">' +
        '<span class="song-title">' + s.title + '</span>' +
        '<span class="song-artist">' + s.artist + '</span>' +
        '<span class="song-meta">BPM ' + s.bpm + ' &middot; ' + noteCount + 'ノーツ</span>' +
        '</button>';
    }
    elSongList.innerHTML = html;

    // クリックイベント
    var cards = elSongList.querySelectorAll(".song-card");
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener("click", function () {
          selectSong(card.getAttribute("data-song"));
        });
      })(cards[i]);
    }
  }

  // ============================================
  // ゲーム制御
  // ============================================
  function startGame() {
    if (!player || !playerReady) {
      elStatusText.textContent = "YouTubeプレーヤー準備中... しばらくお待ちください";
      // ボタンを点滅させて視覚的なフィードバック
      elBtnStart.style.opacity = "0.5";
      setTimeout(function () { elBtnStart.style.opacity = "1"; }, 300);
      return;
    }

    if (!selectedSongId || typeof CHARTS === "undefined" || !CHARTS[selectedSongId]) {
      elStatusText.textContent = "譜面データの読み込みに失敗しました";
      return;
    }

    initCanvas();

    offsetToastTimer = 0;
    score = 0; combo = 0; maxCombo = 0;
    noteIdx = 0; judgedNotes = 0; accuracyTotal = 0; accuracyMax = 0;
    counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    activeNotes = []; effects = []; judgeTexts = [];
    laneFlash = [0, 0, 0, 0]; laneHeld = [false, false, false, false];
    holdActive = [null, null, null, null]; flickTracker = [null, null, null, null];
    chartTime = 0;
    fadeOutActive = false;

    chart = CHARTS[selectedSongId];
    totalNotes = chart.notes.length;

    updateHUD();
    elScore.textContent = "0"; elCombo.textContent = "0";
    elJudge.textContent = "-"; elJudge.style.color = "#fff";
    elAccuracy.textContent = "100%";
    elOffsetHud.style.display = "";

    elStartOverlay.classList.remove("active");
    elResultOverlay.classList.remove("active");

    running = true; started = true;

    try { player.seekTo(0); player.playVideo(); } catch (e) {}

    if (animId) cancelAnimationFrame(animId);
    gameLoop();
  }

  function endGame() {
    running = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    try { player.pauseVideo(); } catch (e) {}
    saveBest();

    elOffsetHud.style.display = "none";
    elFinalScore.textContent = score;

    var diffLabel = config.difficulty.toUpperCase();
    elResultSongTitle.textContent = chart ? chart.title || "" : "";
    elResultDifficulty.textContent = diffLabel;

    elResultJudges.innerHTML =
      "PERFECT: " + counts.perfect + "<br>" +
      "GREAT: " + counts.great + "<br>" +
      "GOOD: " + counts.good + "<br>" +
      "MISS: " + counts.miss + "<br>" +
      "MAX COMBO: " + maxCombo;

    var total = counts.perfect + counts.great + counts.good + counts.miss;
    var acc = total > 0
      ? Math.round((counts.perfect * 3 + counts.great * 2 + counts.good) / (total * 3) * 100)
      : 0;

    elFinalAccuracy.textContent = "ACCURACY: " + acc + "%";

    if (score >= bestScore && score > 0) {
      elBestResult.textContent = "NEW BEST!";
    } else {
      elBestResult.textContent = "ベスト: " + bestScore;
    }

    elResultOverlay.classList.add("active");
  }

  // ============================================
  // イベント登録
  // ============================================
  // 曲選択リスト生成
  buildSongList();

  // 難易度ボタン
  for (var i = 0; i < diffBtns.length; i++) {
    (function (btn) {
      btn.addEventListener("click", function () {
        diffBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        config.difficulty = btn.getAttribute("data-diff");
        updateJudgment();
        localStorage.setItem("rhythmDifficulty", config.difficulty);
        loadBest();
        elResultDifficulty.textContent = config.difficulty.toUpperCase();
      });
    })(diffBtns[i]);
  }

  // オフセットスライダー
  elOffsetSlider.addEventListener("input", function () {
    config.userOffset = parseInt(elOffsetSlider.value, 10);
    var label = (config.userOffset >= 0 ? "+" : "") + config.userOffset + "ms";
    elOffsetValue.textContent = label;
    elOffsetDisplay.textContent = label;
    localStorage.setItem("rhythmOffset", config.userOffset);
  });

  // テスト音
  elTestSound.addEventListener("click", playTestSound);

  // スタート
  elBtnStart.addEventListener("click", startGame);

  // リトライ
  elBtnRetry.addEventListener("click", startGame);

  // 曲選択に戻る
  elBtnBackSelect.addEventListener("click", function () {
    elStartOverlay.classList.remove("active");
    showSongSelect();
  });
  elBtnBackSelectResult.addEventListener("click", function () {
    elResultOverlay.classList.remove("active");
    showSongSelect();
  });

  window.addEventListener("resize", function () {
    if (!running) { initCanvas(); draw(); }
  });

  // ============================================
  // 初期化
  // ============================================
  loadBest();
  loadConfig();
  initCanvas();

  // 初期描画
  (function () {
    initCanvas();
    var grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "#0d001a");
    grad.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("曲を選択してください", cw / 2, ch / 2);
  })();

})();
