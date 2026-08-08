/* 梦角传讯 — 共享表情包库 */
(function (global) {
  "use strict";

  var STICKER_KEY = "mengjiao_stickers";

  /* 默认表情包（emoji + 颜文字） */
  var DEFAULT_STICKERS = [
    "❤️", "💖", "💗", "💕", "💓", "💞", "🧡", "💛", "💚", "💙", "💜", "🤍",
    "🌸", "🌷", "🌹", "🌺", "🌻", "🌼", "🍀", "🌿", "🌱", "🌙", "⭐", "✨",
    "☁️", "🌈", "🦋", "🐱", "🐰", "🐻", "🐼", "🐨", "🐥", "🦄", "🎀", "💫",
    "🍓", "🍑", "🍒", "🍰", "🍬", "🍭", "🧁", "🍪", "🍩", "🍮", "🍵", "🧋",
    "🎵", "🎧", "🎀", "🎁", "🎈", "🎉", "✨", "💌", "📷", "🔮", "🕯️", "🧸",
    "(｡･ω･｡)", "(◕ᴗ◕✿)", "(๑•ᴗ•๑)", "(◍•ᴗ•◍)", "(˘︶˘)", "(✿◡‿◡)",
    "(o´∀`o)", "(´,,•ω•,,)", "(っ˘̩╭╮˘̩)っ", "(ノ´ヮ`)ノ*:・゚✧", "(｡♥‿♥｡)", "(●´ω｀●)"
  ];

  function getStickers() {
    try {
      var raw = localStorage.getItem(STICKER_KEY);
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    return DEFAULT_STICKERS.slice();
  }

  function saveStickers(arr) {
    try {
      localStorage.setItem(STICKER_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function addSticker(item) {
    if (!item) return false;
    var stickers = getStickers();
    if (stickers.indexOf(item) !== -1) return false;
    stickers.unshift(item);
    saveStickers(stickers);
    return true;
  }

  function removeSticker(item) {
    var stickers = getStickers();
    var idx = stickers.indexOf(item);
    if (idx === -1) return false;
    stickers.splice(idx, 1);
    saveStickers(stickers);
    return true;
  }

  function resetStickers() {
    saveStickers(DEFAULT_STICKERS.slice());
    return DEFAULT_STICKERS.slice();
  }

  global.MengjiaoStickers = {
    getStickers: getStickers,
    saveStickers: saveStickers,
    addSticker: addSticker,
    removeSticker: removeSticker,
    resetStickers: resetStickers,
    DEFAULT_STICKERS: DEFAULT_STICKERS.slice()
  };
})(window);
