/* 梦角传讯 — 图片压缩与存储工具（共享） */
(function (global) {
  "use strict";

  var DEFAULT_MAX_WIDTH = 1200;
  var DEFAULT_MAX_HEIGHT = 1200;
  var DEFAULT_QUALITY = 0.82;
  var DEFAULT_MAX_SIZE_MB = 4.5;

  /* ---------- 图片压缩 ---------- */
  function compressImage(file, options) {
    options = options || {};
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith("image/")) {
        return reject(new Error("请选择图片文件"));
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var maxWidth = options.maxWidth || DEFAULT_MAX_WIDTH;
          var maxHeight = options.maxHeight || DEFAULT_MAX_HEIGHT;
          var quality = options.quality || DEFAULT_QUALITY;
          var type = options.type || "image/jpeg";

          var w = img.width;
          var h = img.height;
          if (w > maxWidth || h > maxHeight) {
            var ratio = Math.min(maxWidth / w, maxHeight / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          var canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext("2d");
          if (type === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);

          var dataUrl = canvas.toDataURL(type, quality);
          resolve(dataUrl);
        };
        img.onerror = function () { reject(new Error("图片加载失败")); };
        img.src = e.target.result;
      };
      reader.onerror = function () { reject(new Error("读取文件失败")); };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- 快速读取文件（不压缩） ---------- */
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith("image/")) return reject(new Error("请选择图片文件"));
      var reader = new FileReader();
      reader.onload = function (e) { resolve(e.target.result); };
      reader.onerror = function () { reject(new Error("读取文件失败")); };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- localStorage 用量估算 ---------- */
  function estimateLocalStorageSize() {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        var val = localStorage.getItem(key);
        total += (key.length + (val ? val.length : 0)) * 2;
      }
    } catch (e) {}
    return total;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  /* ---------- 容量检查 ---------- */
  function checkStorageLimit() {
    var used = estimateLocalStorageSize();
    var limit = DEFAULT_MAX_SIZE_MB * 1024 * 1024;
    var ratio = used / limit;
    if (ratio > 0.9) {
      return {
        ok: false,
        level: "danger",
        message: "存储空间已接近上限（" + formatSize(used) + " / " + DEFAULT_MAX_SIZE_MB + "MB），建议清理聊天记录或图片。",
        used: used,
        limit: limit
      };
    }
    if (ratio > 0.7) {
      return {
        ok: true,
        level: "warning",
        message: "存储空间使用较多（" + formatSize(used) + " / " + DEFAULT_MAX_SIZE_MB + "MB）。",
        used: used,
        limit: limit
      };
    }
    return { ok: true, level: "ok", used: used, limit: limit };
  }

  /* ---------- 通用 toast ---------- */
  function showToast(message, duration) {
    duration = duration || 2500;
    var toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, duration);
  }

  global.MengjiaoImageUtils = {
    compressImage: compressImage,
    readFileAsDataURL: readFileAsDataURL,
    estimateLocalStorageSize: estimateLocalStorageSize,
    formatSize: formatSize,
    checkStorageLimit: checkStorageLimit,
    showToast: showToast,
    DEFAULT_MAX_SIZE_MB: DEFAULT_MAX_SIZE_MB
  };
})(window);
