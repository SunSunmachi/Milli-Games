/* ============================================
   リズムゲーム メインエンジン
   YouTube連携 + 譜面再生 + tap/hold/flick判定
   ============================================ */
(function () {
  "use strict";

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
  var elStartOverlay = document.getElementById("overlay-start");
  var elResultOverlay = document.getElementById("overlay-result");
  var elBtnStart = document.getElementById("btn-start");
  var elBtnRetry = document.getElementById("btn-retry");
  var elStatusText = document.getElementById("video-status");
  var laneButtons = document.querySelectorAll(".lane-btn");

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

  // ============================================
  // YouTube API
  // ============================================
  window.onYouTubeIframeAPIReady = function () {
    var vid = (typeof CHART !== "undefined" && CHART) ? CHART.videoId : "MF4Yw8IS6og";
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
          elStatusText.textContent = "再生してスタートできます";
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
  };

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
  // スコア管理
  // ============================================
  function loadBest() {
    var v = localStorage.getItem("rhythmBestPrincess");
    bestScore = v ? parseInt(v, 10) : 0;
    elBest.textContent = bestScore;
  }

  function saveBest() {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("rhythmBestPrincess", bestScore);
      elBest.textContent = bestScore;
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
        t: n.t,
        l: n.l,
        type: n.type,
        d: n.d || 0,
        hit: false,
        judged: false,
        held: false,
        holdProgress: 0
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
    var judgeText = "";
    var judgeColor = "";
    var points = 0;

    if (absDiff <= PERFECT_RANGE) {
      judgeText = "PERFECT";
      judgeColor = "#F1C40F";
      points = SCORE_PERFECT;
      counts.perfect++;
    } else if (absDiff <= GREAT_RANGE) {
      judgeText = "GREAT";
      judgeColor = "#2ECC71";
      points = SCORE_GREAT;
      counts.great++;
    } else if (absDiff <= GOOD_RANGE) {
      judgeText = "GOOD";
      judgeColor = "#3498DB";
      points = SCORE_GOOD;
      counts.good++;
    } else {
      return; // outside range, no judgment
    }

    note.hit = true;
    note.judged = true;
    judgedNotes++;

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
    note.judged = true;
    judgedNotes++;
    combo = 0;
    counts.miss++;
    updateHUD();
    elJudge.textContent = "MISS";
    elJudge.style.color = "#E74C3C";
    spawnJudgeText("MISS", "#E74C3C", cw / 2, judgeY - 30, 0);
  }

  // ============================================
  // エフェクト
  // ============================================
  function spawnHitEffect(x, y, color) {
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
      var speed = 2 + Math.random() * 3;
      effects.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, color: color, r: 2 + Math.random() * 2
      });
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

    // YouTubeから現在時刻を取得
    try {
      if (player && player.getCurrentTime) {
        chartTime = player.getCurrentTime() - (chart.offset || 0);
      }
    } catch (e) {
      // プレーヤーがまだ使えない場合
    }

    spawnNotes();
    cleanupNotes();

    // ノーツ位置更新 + 自動ミス判定
    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.judged) continue;

      var diff = n.t - chartTime;

      // ノーツが判定ラインを過ぎてMISS_RANGE以上離れたら自動ミス
      if (diff < -MISS_THRESHOLD) {
        autoMiss(n);
      }
    }

    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.type !== "hold" || !n.hit || n.holdProgress >= 1) continue;

      if (laneHeld[n.l]) {
        n.holdProgress = Math.min(1, (chartTime - n.t) / n.d);
        if (n.holdProgress >= 1) {
          score += HOLD_BONUS;
          updateHUD();
          spawnJudgeText("HOLD OK", "#2ECC71", cw / 2, judgeY - 55, 0);
          holdActive[n.l] = null;
        }
      }
    }

    // エフェクト更新
    for (var i = effects.length - 1; i >= 0; i--) {
      var e = effects[i];
      e.x += e.vx;
      e.y += e.vy;
      e.life -= 0.04;
      if (e.life <= 0) { effects.splice(i, 1); }
    }

    // 判定テキスト更新
    for (var i = judgeTexts.length - 1; i >= 0; i--) {
      var jt = judgeTexts[i];
      jt.y -= 0.8;
      jt.life -= 0.02;
      if (jt.life <= 0) { judgeTexts.splice(i, 1); }
    }

    // レーンフラッシュ減衰
    for (var i = 0; i < LANE_COUNT; i++) {
      if (laneFlash[i] > 0) {
        laneFlash[i] *= 0.92;
        if (laneFlash[i] < 0.01) laneFlash[i] = 0;
      }
    }

    // フェードアウト / 終了判定
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
        fadeOutActive = false;
        running = false;
        try { player.pauseVideo(); } catch (e) {}
        endGame();
        return;
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

    // レーン線
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * lw, 0);
      ctx.lineTo(i * lw, ch);
      ctx.stroke();
    }

    // レーンフラッシュ
    for (var i = 0; i < LANE_COUNT; i++) {
      if (laneFlash[i] > 0) {
        ctx.fillStyle = "rgba(" + hexToRgb(LANE_COLORS[i]) + "," + (laneFlash[i] * 0.15) + ")";
        ctx.fillRect(i * lw, 0, lw, ch);
      }
    }

    // 判定ライン
    ctx.beginPath();
    ctx.moveTo(0, judgeY);
    ctx.lineTo(cw, judgeY);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, judgeY);
    ctx.lineTo(cw, judgeY);
    ctx.strokeStyle = "rgba(187,134,252,0.25)";
    ctx.lineWidth = 6;
    ctx.stroke();

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

    // ノーツ描画
    var noteW = lw * 0.65;
    var noteH = ch * 0.035;

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
          var holdColor = n.hit ? "rgba(187,134,252,0.8)" : "rgba(255,255,255,0.15)";
          ctx.fillStyle = holdColor;
          ctx.fillRect(nx - noteW * 0.3, Math.max(0, tailTop), noteW * 0.6, Math.min(ch, tailBottom) - Math.max(0, tailTop));
        }
      }

      // ノーツ本体
      ctx.save();

      // 影
      ctx.beginPath();
      roundRect(ctx, nx - noteW / 2 + 2, ny - noteH / 2 + 2, noteW, noteH, 4);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();

      // 本体
      ctx.beginPath();
      roundRect(ctx, nx - noteW / 2, ny - noteH / 2, noteW, noteH, 4);
      var nGrad = ctx.createLinearGradient(0, ny - noteH / 2, 0, ny + noteH / 2);
      nGrad.addColorStop(0, lighten(color, 40));
      nGrad.addColorStop(1, color);
      ctx.fillStyle = nGrad;
      ctx.fill();

      // ハイライト
      ctx.beginPath();
      roundRect(ctx, nx - noteW / 2 + 3, ny - noteH / 2 + 2, noteW - 6, noteH * 0.35, 2);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fill();

      // フリック矢印
      if (n.type === "flick") {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "bold " + Math.round(noteH * 0.8) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▶", nx, ny);
      } else if (n.type === "hold") {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "bold " + Math.round(noteH * 0.6) + "px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("▼", nx - 1, ny);
      }

      ctx.restore();
    }

    // エフェクト
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      ctx.globalAlpha = e.life;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * e.life, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.fill();
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
  }

  // ============================================
  // 描画ヘルパー
  // ============================================
  function roundRect(ctx, x, y, w, h, r) {
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

  // ============================================
  // ヒット処理
  // ============================================
  function hitLane(lane) {
    if (!running) return;

    laneFlash[lane] = 1;
    laneHeld[lane] = true;

    // フリック検出用に開始位置を記録
    flickTracker[lane] = { x: 0, t: performance.now() };

    // 最も近い未ヒットノーツを探す
    var closest = null;
    var closestDist = Infinity;
    for (var i = 0; i < activeNotes.length; i++) {
      var n = activeNotes[i];
      if (n.l !== lane || n.judged) continue;
      var diff = Math.abs(n.t - chartTime);
      if (diff < closestDist) {
        closestDist = diff;
        closest = n;
      }
    }

    if (!closest || closestDist > GOOD_RANGE + 0.02) return;

    // フリックノーツの場合
    if (closest.type === "flick") {
      // PCではタップで代用
      judgeNote(closest, closest.t - chartTime);
      return;
    }

    // ホールドノーツの場合
    if (closest.type === "hold") {
      judgeNote(closest, closest.t - chartTime);
      if (closest.judged) {
        holdActive[lane] = { note: closest };
      }
      return;
    }

    // タップノーツ
    judgeNote(closest, closest.t - chartTime);
  }

  function releaseLane(lane) {
    if (!running) return;

    laneHeld[lane] = false;

    // ホールドノーツの終了処理
    if (holdActive[lane]) {
      var h = holdActive[lane];
      var n = h.note;
      if (n && n.hit && n.holdProgress < 1) {
        var completion = n.holdProgress;
        if (completion > 0.8) {
          // 80%以上ホールドできた → ボーナス
          score += HOLD_BONUS;
          updateHUD();
          spawnJudgeText("HOLD OK", "#2ECC71", cw / 2, judgeY - 55, 0);
        } else {
          spawnJudgeText("HOLD BREAK", "#E74C3C", cw / 2, judgeY - 55, 0);
        }
        n.holdProgress = 1;
      }
      holdActive[lane] = null;
    }

    // フリック検出（指を離したときの速度）
    if (flickTracker[lane]) {
      var elapsed = performance.now() - flickTracker[lane].t;
      if (elapsed > 200) {
        flickTracker[lane] = null;
        return; // ゆっくり離した → フリックじゃない
      }
      flickTracker[lane] = null;
    }
  }

  // ============================================
  // キーボード入力
  // ============================================
  document.addEventListener("keydown", function (e) {
    var idx = LANE_KEYS.indexOf(e.code);
    if (idx !== -1) {
      e.preventDefault();
      hitLane(idx);
    }
  });

  document.addEventListener("keyup", function (e) {
    var idx = LANE_KEYS.indexOf(e.code);
    if (idx !== -1) {
      releaseLane(idx);
    }
  });

  // ============================================
  // レーンボタン入力（タッチ/マウス）
  // ============================================
  for (var i = 0; i < laneButtons.length; i++) {
    (function (btn) {
      var lane = parseInt(btn.getAttribute("data-lane"), 10);
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        btn.classList.add("pressed");
        hitLane(lane);
      });
      btn.addEventListener("pointerup", function (e) {
        e.preventDefault();
        btn.classList.remove("pressed");
        releaseLane(lane);
      });
      btn.addEventListener("pointerleave", function (e) {
        btn.classList.remove("pressed");
        releaseLane(lane);
      });
      btn.addEventListener("pointercancel", function (e) {
        btn.classList.remove("pressed");
        releaseLane(lane);
      });
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
  function startFadeOut() {
    fadeOutActive = true;
    fadeOutStart = chartTime;
  }

  // ============================================
  // ゲーム制御
  // ============================================
  function startGame() {
    if (!player || !playerReady) {
      elStatusText.textContent = "プレーヤーの準備中です...";
      return;
    }

    if (typeof CHART === "undefined" || !CHART) {
      elStatusText.textContent = "譜面データの読み込みに失敗しました";
      return;
    }

    initCanvas();

    score = 0;
    combo = 0;
    maxCombo = 0;
    noteIdx = 0;
    judgedNotes = 0;
    accuracyTotal = 0;
    accuracyMax = 0;
    counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    activeNotes = [];
    effects = [];
    judgeTexts = [];
    laneFlash = [0, 0, 0, 0];
    laneHeld = [false, false, false, false];
    holdActive = [null, null, null, null];
    flickTracker = [null, null, null, null];
    gameEndCountdown = 0;
    chartTime = 0;
    chart = CHART;
    totalNotes = chart.notes.length;

    updateHUD();
    elScore.textContent = "0";
    elCombo.textContent = "0";
    elJudge.textContent = "-";
    elJudge.style.color = "#fff";
    elAccuracy.textContent = "100%";

    elStartOverlay.classList.remove("active");
    elResultOverlay.classList.remove("active");

    running = true;
    started = true;

    try {
      player.seekTo(0);
      player.playVideo();
    } catch (e) {}

    if (animId) cancelAnimationFrame(animId);
    gameLoop();
  }

  function endGame() {
    running = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    try { player.pauseVideo(); } catch (e) {}

    saveBest();

    elFinalScore.textContent = score;
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
      elBestResult.textContent = "🎉 ハイスコア更新！";
    } else {
      elBestResult.textContent = "ベスト: " + bestScore;
    }

    elResultOverlay.classList.add("active");
  }

  // ============================================
  // イベント登録
  // ============================================
  elBtnStart.addEventListener("click", startGame);
  elBtnRetry.addEventListener("click", startGame);

  window.addEventListener("resize", function () {
    if (!running) {
      initCanvas();
      draw();
    }
  });

  // ============================================
  // 初期化
  // ============================================
  loadBest();
  initCanvas();

  // 初期描画（待機画面）
  (function () {
    initCanvas();
    var grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "#0d001a");
    grad.addColorStop(1, "#1a0a2e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  })();

})();
