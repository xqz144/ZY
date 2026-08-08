/* 梦角传讯 — 语音消息与语音字卡库工具 */
/* 依赖：无（纯前端 localStorage） */
(function (window) {
  "use strict";

  var VOICE_CARDS_KEY = "mengjiao_voice_cards";
  var DEFAULT_VOICE_CARDS = [];

  var VoiceUtils = {
    KEY: VOICE_CARDS_KEY,

    /* 读取所有语音字卡 */
    getCards: function () {
      try {
        var raw = localStorage.getItem(VOICE_CARDS_KEY);
        if (raw) {
          var arr = JSON.parse(raw);
          if (Array.isArray(arr)) return arr.filter(function (c) { return c && c.id && c.text; });
        }
      } catch (e) {}
      return DEFAULT_VOICE_CARDS.slice();
    },

    /* 保存所有语音字卡 */
    saveCards: function (cards) {
      try {
        localStorage.setItem(VOICE_CARDS_KEY, JSON.stringify(cards || []));
        return true;
      } catch (e) {
        return false;
      }
    },

    /* 添加一条语音字卡 */
    addCard: function (text, audioBase64, duration) {
      var cards = this.getCards();
      var card = {
        id: "vc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        text: String(text || "").trim(),
        audio: String(audioBase64 || ""),
        duration: parseInt(duration, 10) || 0,
        createdAt: new Date().toISOString()
      };
      if (!card.text || !card.audio) return null;
      cards.unshift(card);
      if (!this.saveCards(cards)) return null;
      return card;
    },

    /* 删除一条语音字卡 */
    removeCard: function (id) {
      var cards = this.getCards().filter(function (c) { return c.id !== id; });
      return this.saveCards(cards);
    },

    /* 按 id 取字卡 */
    getCardById: function (id) {
      return this.getCards().find(function (c) { return c.id === id; }) || null;
    },

    /* 随机取一条字卡 */
    pickCard: function () {
      var cards = this.getCards();
      if (!cards.length) return null;
      return cards[Math.floor(Math.random() * cards.length)];
    },

    /* 检测浏览器是否支持录音 */
    isRecordingSupported: function () {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    },

    /* 格式化秒数显示 */
    formatDuration: function (sec) {
      var s = parseInt(sec, 10) || 0;
      var m = Math.floor(s / 60);
      s = s % 60;
      return (m > 0 ? m + ":" : "0:") + String(s).padStart(2, "0");
    },

    /* 将 Blob 转为 base64 dataURL */
    blobToBase64: function (blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error("读取音频失败")); };
        reader.readAsDataURL(blob);
      });
    },

    /* 预估算 base64 大小（字节） */
    estimateBase64Size: function (dataUrl) {
      if (!dataUrl) return 0;
      var base64 = dataUrl.split(",")[1] || "";
      return Math.floor(base64.length * 0.75);
    }
  };

  window.MengjiaoVoiceUtils = VoiceUtils;
})(window);
