/* ============================================
   Princess Viral / 音ノ乃のの 譜面データ
   BPM: 134
   調整方法はファイル末尾を参照
   ============================================ */
var CHARTS = {};

CHARTS.princess_viral = (function () {
  "use strict";

  var BPM = 134;
  var BEAT = 60 / BPM; // ~0.4478s
  var b4 = BEAT * 4; // 小節

  var notes = [];

  function push(t, l, type, dur) {
    notes.push({ t: +t.toFixed(3), l: l, type: type || "tap", d: dur || 0 });
  }

  function bar(n) { return n * b4; }
  function beat(n) { return n * BEAT; }

  // ========================================
  // INTRO (bar 0-2) 無音
  // ========================================

  // ========================================
  // BUILD-UP (bar 2-6) 単音でリズム確認
  // ========================================
  // bar 2
  push(bar(2) + beat(1), 0, "tap");
  push(bar(2) + beat(3), 2, "tap");
  // bar 3
  push(bar(3) + beat(1), 1, "tap");
  push(bar(3) + beat(3), 3, "tap");
  // bar 4
  push(bar(4) + beat(0), 0, "tap");
  push(bar(4) + beat(2), 2, "tap");
  push(bar(4) + beat(3), 1, "tap");
  // bar 5
  push(bar(5) + beat(1), 3, "tap");
  push(bar(5) + beat(2), 0, "tap");
  push(bar(5) + beat(3), 2, "tap");

  // ========================================
  // VERSE A (bar 6-14) 密度中程度、ホールド導入
  // ========================================
  // bar 6
  push(bar(6) + beat(0), 0, "hold", beat(2));
  push(bar(6) + beat(2), 2, "tap");
  push(bar(6) + beat(3), 1, "tap");
  // bar 7
  push(bar(7) + beat(0), 3, "hold", beat(1));
  push(bar(7) + beat(1), 1, "tap");
  push(bar(7) + beat(2), 0, "tap");
  push(bar(7) + beat(3), 2, "tap");
  // bar 8
  push(bar(8) + beat(0), 1, "tap");
  push(bar(8) + beat(1), 3, "tap");
  push(bar(8) + beat(2), 0, "hold", beat(1));
  push(bar(8) + beat(3), 2, "tap");
  // bar 9
  push(bar(9) + beat(0), 1, "tap");
  push(bar(9) + beat(1), 3, "tap");
  push(bar(9) + beat(2), 0, "tap");
  push(bar(9) + beat(3), 2, "tap");
  // bar 10
  push(bar(10) + beat(0), 1, "tap");
  push(bar(10) + beat(2), 3, "hold", beat(2));
  push(bar(10) + beat(3), 0, "tap");
  // bar 11
  push(bar(11) + beat(0), 2, "tap");
  push(bar(11) + beat(1), 0, "tap");
  push(bar(11) + beat(2), 3, "tap");
  push(bar(11) + beat(3), 1, "tap");
  // bar 12
  push(bar(12) + beat(0), 2, "hold", beat(1));
  push(bar(12) + beat(1), 0, "tap");
  push(bar(12) + beat(2), 3, "tap");
  push(bar(12) + beat(3), 1, "tap");
  // bar 13
  push(bar(13) + beat(0), 0, "tap");
  push(bar(13) + beat(1), 2, "tap");
  push(bar(13) + beat(2), 1, "tap");
  push(bar(13) + beat(3), 3, "tap");
  // bar 14
  push(bar(14) + beat(0), 0, "hold", beat(3));
  push(bar(14) + beat(2), 2, "tap");
  push(bar(14) + beat(3), 1, "tap");

  // ========================================
  // PRE-CHORUS (bar 14-18) 密度上昇、フリック導入
  // ========================================
  // bar 15
  push(bar(15) + beat(0), 3, "flick");
  push(bar(15) + beat(1), 1, "tap");
  push(bar(15) + beat(2), 0, "flick");
  push(bar(15) + beat(3), 2, "tap");
  // bar 16
  push(bar(16) + beat(0), 1, "hold", beat(1));
  push(bar(16) + beat(1), 3, "tap");
  push(bar(16) + beat(2), 0, "tap");
  push(bar(16) + beat(3), 2, "flick");
  // bar 17
  push(bar(17) + beat(0), 0, "tap");
  push(bar(17) + beat(0.5), 1, "tap");
  push(bar(17) + beat(1), 2, "tap");
  push(bar(17) + beat(1.5), 3, "tap");
  push(bar(17) + beat(2), 0, "flick");
  push(bar(17) + beat(3), 2, "hold", beat(1));
  // bar 18
  push(bar(18) + beat(0), 1, "tap");
  push(bar(18) + beat(1), 3, "tap");
  push(bar(18) + beat(2), 0, "tap");
  push(bar(18) + beat(3), 2, "flick");

  // ========================================
  // CHORUS A (bar 18-26) 高密度、全ノーツ種
  // ========================================
  // bar 19
  push(bar(19) + beat(0), 0, "tap");
  push(bar(19) + beat(0.5), 2, "hold", beat(0.5));
  push(bar(19) + beat(1), 1, "tap");
  push(bar(19) + beat(1.5), 3, "tap");
  push(bar(19) + beat(2), 0, "flick");
  push(bar(19) + beat(3), 2, "tap");
  // bar 20
  push(bar(20) + beat(0), 1, "tap");
  push(bar(20) + beat(0.5), 3, "tap");
  push(bar(20) + beat(1), 0, "hold", beat(1));
  push(bar(20) + beat(2), 2, "tap");
  push(bar(20) + beat(3), 1, "flick");
  // bar 21
  push(bar(21) + beat(0), 3, "tap");
  push(bar(21) + beat(0.5), 0, "tap");
  push(bar(21) + beat(1), 2, "hold", beat(0.5));
  push(bar(21) + beat(1.5), 1, "tap");
  push(bar(21) + beat(2), 3, "flick");
  push(bar(21) + beat(3), 0, "tap");
  // bar 22
  push(bar(22) + beat(0), 1, "hold", beat(2));
  push(bar(22) + beat(1), 3, "tap");
  push(bar(22) + beat(2), 0, "tap");
  push(bar(22) + beat(3), 2, "flick");
  // bar 23
  push(bar(23) + beat(0), 1, "tap");
  push(bar(23) + beat(0.5), 3, "tap");
  push(bar(23) + beat(1), 0, "tap");
  push(bar(23) + beat(1.5), 2, "tap");
  push(bar(23) + beat(2), 1, "flick");
  push(bar(23) + beat(3), 3, "hold", beat(1));
  // bar 24
  push(bar(24) + beat(0), 0, "tap");
  push(bar(24) + beat(0.5), 2, "tap");
  push(bar(24) + beat(1), 1, "hold", beat(0.5));
  push(bar(24) + beat(1.5), 3, "tap");
  push(bar(24) + beat(2), 0, "flick");
  push(bar(24) + beat(3), 2, "tap");
  // bar 25
  push(bar(25) + beat(0), 1, "tap");
  push(bar(25) + beat(1), 3, "tap");
  push(bar(25) + beat(2), 0, "hold", beat(1));
  push(bar(25) + beat(3), 2, "flick");

  // ========================================
  // BRIDGE (bar 26-30) 低密度、長ホールド
  // ========================================
  // bar 26–27
  push(bar(26) + beat(0), 0, "hold", beat(6));
  push(bar(26) + beat(2), 2, "tap");
  push(bar(26) + beat(3), 3, "tap");
  // bar 27
  push(bar(27) + beat(1), 1, "tap");
  push(bar(27) + beat(3), 3, "tap");
  // bar 28–29
  push(bar(28) + beat(0), 2, "hold", beat(6));
  push(bar(28) + beat(2), 0, "tap");
  push(bar(28) + beat(3), 1, "tap");
  // bar 29
  push(bar(29) + beat(1), 3, "tap");
  push(bar(29) + beat(3), 0, "tap");

  // ========================================
  // CHORUS B (bar 30-38) 最高密度、クライマックス
  // ========================================
  // bar 30 (same as bar 19)
  push(bar(30) + beat(0), 0, "tap");
  push(bar(30) + beat(0.5), 2, "hold", beat(0.5));
  push(bar(30) + beat(1), 1, "tap");
  push(bar(30) + beat(1.5), 3, "tap");
  push(bar(30) + beat(2), 0, "flick");
  push(bar(30) + beat(3), 2, "tap");
  // bar 31
  push(bar(31) + beat(0), 1, "tap");
  push(bar(31) + beat(0.5), 3, "tap");
  push(bar(31) + beat(1), 0, "hold", beat(1));
  push(bar(31) + beat(2), 2, "tap");
  push(bar(31) + beat(3), 1, "flick");
  // bar 32
  push(bar(32) + beat(0), 3, "tap");
  push(bar(32) + beat(0.5), 0, "tap");
  push(bar(32) + beat(1), 2, "hold", beat(0.5));
  push(bar(32) + beat(1.5), 1, "tap");
  push(bar(32) + beat(2), 3, "flick");
  push(bar(32) + beat(3), 0, "tap");
  // bar 33
  push(bar(33) + beat(0), 1, "hold", beat(2));
  push(bar(33) + beat(1), 3, "tap");
  push(bar(33) + beat(2), 0, "tap");
  push(bar(33) + beat(3), 2, "flick");
  // bar 34
  push(bar(34) + beat(0), 0, "tap");
  push(bar(34) + beat(0.5), 2, "tap");
  push(bar(34) + beat(1), 1, "tap");
  push(bar(34) + beat(1.5), 3, "tap");
  push(bar(34) + beat(2), 0, "flick");
  push(bar(34) + beat(2.5), 2, "tap");
  push(bar(34) + beat(3), 1, "tap");
  push(bar(34) + beat(3.5), 3, "tap");
  // bar 35
  push(bar(35) + beat(0), 0, "hold", beat(1));
  push(bar(35) + beat(1), 2, "tap");
  push(bar(35) + beat(2), 1, "hold", beat(1));
  push(bar(35) + beat(3), 3, "tap");
  // bar 36
  push(bar(36) + beat(0), 0, "tap");
  push(bar(36) + beat(0.5), 2, "flick");
  push(bar(36) + beat(1), 1, "tap");
  push(bar(36) + beat(1.5), 3, "tap");
  push(bar(36) + beat(2), 0, "hold", beat(0.5));
  push(bar(36) + beat(2.5), 2, "tap");
  push(bar(36) + beat(3), 1, "flick");
  push(bar(36) + beat(3.5), 3, "tap");
  // bar 37
  push(bar(37) + beat(0), 0, "hold", beat(2));
  push(bar(37) + beat(1), 2, "tap");
  push(bar(37) + beat(2), 1, "tap");
  push(bar(37) + beat(3), 3, "tap");

  // ========================================
  // OUTRO (bar 38-40)
  // ========================================
  // bar 38
  push(bar(38) + beat(0), 0, "tap");
  push(bar(38) + beat(1), 2, "tap");
  push(bar(38) + beat(2), 1, "tap");
  push(bar(38) + beat(3), 3, "tap");
  // bar 39
  push(bar(39) + beat(0), 0, "hold", beat(3));
  push(bar(39) + beat(2), 2, "tap");
  push(bar(39) + beat(3), 1, "tap");

  // ========================================
  // CHORUS C (bar 40-47) 変化サビ
  // ========================================
  // bar 40
  push(bar(40) + beat(0), 0, "tap");
  push(bar(40) + beat(0.5), 2, "tap");
  push(bar(40) + beat(1), 1, "flick");
  push(bar(40) + beat(1.5), 3, "tap");
  push(bar(40) + beat(2), 0, "hold", beat(0.5));
  push(bar(40) + beat(2.5), 2, "tap");
  push(bar(40) + beat(3), 1, "tap");
  push(bar(40) + beat(3.5), 3, "flick");
  // bar 41
  push(bar(41) + beat(0), 0, "tap");
  push(bar(41) + beat(1), 2, "hold", beat(1));
  push(bar(41) + beat(2), 1, "tap");
  push(bar(41) + beat(3), 3, "flick");
  // bar 42
  push(bar(42) + beat(0), 2, "tap");
  push(bar(42) + beat(0.5), 0, "flick");
  push(bar(42) + beat(1), 3, "hold", beat(0.5));
  push(bar(42) + beat(1.5), 1, "tap");
  push(bar(42) + beat(2), 2, "tap");
  push(bar(42) + beat(3), 0, "flick");
  // bar 43
  push(bar(43) + beat(0), 1, "hold", beat(2));
  push(bar(43) + beat(1), 3, "tap");
  push(bar(43) + beat(2), 2, "tap");
  push(bar(43) + beat(3), 0, "flick");
  // bar 44
  push(bar(44) + beat(0), 1, "tap");
  push(bar(44) + beat(0.5), 3, "tap");
  push(bar(44) + beat(1), 0, "tap");
  push(bar(44) + beat(1.5), 2, "tap");
  push(bar(44) + beat(2), 1, "flick");
  push(bar(44) + beat(3), 3, "hold", beat(1));
  // bar 45
  push(bar(45) + beat(0), 0, "tap");
  push(bar(45) + beat(0.5), 2, "tap");
  push(bar(45) + beat(1), 1, "hold", beat(0.5));
  push(bar(45) + beat(1.5), 3, "flick");
  push(bar(45) + beat(2), 0, "tap");
  push(bar(45) + beat(3), 2, "tap");
  // bar 46
  push(bar(46) + beat(0), 1, "tap");
  push(bar(46) + beat(1), 3, "tap");
  push(bar(46) + beat(2), 0, "hold", beat(1));
  push(bar(46) + beat(3), 2, "flick");
  // bar 47
  push(bar(47) + beat(0), 1, "hold", beat(3));
  push(bar(47) + beat(2), 3, "tap");
  push(bar(47) + beat(3), 2, "tap");

  // ========================================
  // BREAK (bar 48-51) 一息
  // ========================================
  // bar 48
  push(bar(48) + beat(0), 0, "hold", beat(2));
  push(bar(48) + beat(1), 2, "tap");
  push(bar(48) + beat(3), 1, "tap");
  // bar 49
  push(bar(49) + beat(0), 3, "hold", beat(2));
  push(bar(49) + beat(1), 1, "tap");
  push(bar(49) + beat(3), 0, "tap");
  // bar 50
  push(bar(50) + beat(0), 2, "tap");
  push(bar(50) + beat(1), 0, "tap");
  push(bar(50) + beat(2), 3, "tap");
  push(bar(50) + beat(3), 1, "tap");
  // bar 51
  push(bar(51) + beat(0), 2, "hold", beat(3));
  push(bar(51) + beat(2), 0, "tap");
  push(bar(51) + beat(3), 3, "tap");

  // ========================================
  // FINAL CHORUS (bar 52-59) ラスサビ
  // ========================================
  // bar 52
  push(bar(52) + beat(0), 0, "tap");
  push(bar(52) + beat(0.5), 2, "hold", beat(0.5));
  push(bar(52) + beat(1), 1, "flick");
  push(bar(52) + beat(1.5), 3, "tap");
  push(bar(52) + beat(2), 0, "tap");
  push(bar(52) + beat(3), 2, "flick");
  // bar 53
  push(bar(53) + beat(0), 1, "tap");
  push(bar(53) + beat(0.5), 3, "tap");
  push(bar(53) + beat(1), 0, "hold", beat(1));
  push(bar(53) + beat(2), 2, "flick");
  push(bar(53) + beat(3), 1, "tap");
  // bar 54
  push(bar(54) + beat(0), 3, "tap");
  push(bar(54) + beat(0.5), 0, "tap");
  push(bar(54) + beat(1), 2, "hold", beat(0.5));
  push(bar(54) + beat(1.5), 1, "flick");
  push(bar(54) + beat(2), 3, "tap");
  push(bar(54) + beat(3), 0, "tap");
  // bar 55
  push(bar(55) + beat(0), 1, "hold", beat(2));
  push(bar(55) + beat(1), 3, "flick");
  push(bar(55) + beat(2), 2, "tap");
  push(bar(55) + beat(3), 0, "tap");
  // bar 56
  push(bar(56) + beat(0), 1, "tap");
  push(bar(56) + beat(0.5), 3, "tap");
  push(bar(56) + beat(1), 0, "flick");
  push(bar(56) + beat(1.5), 2, "tap");
  push(bar(56) + beat(2), 1, "hold", beat(0.5));
  push(bar(56) + beat(2.5), 3, "tap");
  push(bar(56) + beat(3), 0, "flick");
  push(bar(56) + beat(3.5), 2, "tap");
  // bar 57
  push(bar(57) + beat(0), 1, "hold", beat(1));
  push(bar(57) + beat(1), 3, "flick");
  push(bar(57) + beat(2), 2, "hold", beat(1));
  push(bar(57) + beat(3), 0, "tap");
  // bar 58
  push(bar(58) + beat(0), 1, "tap");
  push(bar(58) + beat(0.5), 3, "tap");
  push(bar(58) + beat(1), 0, "hold", beat(0.5));
  push(bar(58) + beat(1.5), 2, "flick");
  push(bar(58) + beat(2), 1, "tap");
  push(bar(58) + beat(3), 3, "tap");
  // bar 59
  push(bar(59) + beat(0), 0, "hold", beat(3));
  push(bar(59) + beat(1), 2, "tap");
  push(bar(59) + beat(2), 1, "tap");
  push(bar(59) + beat(3), 3, "flick");

  // ========================================
  // ENDING (bar 60-61) フィニッシュ
  // ========================================
  // bar 60
  push(bar(60) + beat(0), 0, "tap");
  push(bar(60) + beat(1), 2, "tap");
  push(bar(60) + beat(2), 1, "tap");
  push(bar(60) + beat(3), 3, "tap");
  // bar 61
  push(bar(61) + beat(0), 0, "hold", beat(3));
  push(bar(61) + beat(2), 2, "tap");

  notes.sort(function (a, b) { return a.t - b.t; });

  return {
    videoId: "MF4Yw8IS6og",
    bpm: BPM,
    offset: 0,
    duration: 109,
    notes: notes
  };

  /*
    ===== 調整方法 =====

    1. offset の調整（音ズレ補正）
       曲とノーツのタイミングが合わない場合、offset の値（秒）を変えてください。
       ノーツが曲より早い → offset をプラス
       ノーツが曲より遅い → offset をマイナス

    2. 個別ノーツの調整
       各エントリは { t: 秒, l: レーン(0-3), type: "tap"|"hold"|"flick", d: 長さ(秒) }
       t: タイムスタンプ（曲開始からの秒数）
       l: レーン番号（0=左端, 3=右端）
       type: ノーツ種類
       d: holdのみ必要（長押しの長さ）
  */
})();
