/**
 * 音乐推荐服务模块
 * 功能：
 *   1. 歌曲库管理（增删改查）
 *   2. 每日一歌推送（对方每天给用户推一首歌）
 *   3. 聊天内嵌推歌（对方回复时概率附带一首歌）
 *   4. 音乐卡片渲染（消息类型 type='music'）
 *   5. 本地音频文件上传（IndexedDB 存储）
 */
(function () {
  'use strict';

  var LIB_KEY = 'music_library';
  var DAILY_KEY = 'music_daily_record';
  var SETTINGS_KEY = 'music_settings';
  var DB_NAME = 'mengjiao_music';
  var DB_STORE = 'audio_files';
  var DB_VERSION = 1;

  var DEFAULT_SETTINGS = {
    dailyPushEnabled: true,      // 每日一歌开关
    chatPushEnabled: true,       // 聊天内嵌推歌开关
    chatPushChance: 0.18,        // 聊天推歌概率 18%
    dailyPushHour: 9,            // 每日推歌时间（小时）
    useAI: true                  // 是否使用 AI 选歌+生成理由
  };

  /* ========== IndexedDB 音频存储 ========== */
  var _db = null;
  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function (e) {
        _db = e.target.result;
        resolve(_db);
      };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  function putAudioBlob(id, blob) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({ id: id, blob: blob, size: blob.size, type: blob.type, createdAt: Date.now() });
        tx.oncomplete = function () { resolve(id); };
        tx.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  function getAudioBlob(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, 'readonly');
        var req = tx.objectStore(DB_STORE).get(id);
        req.onsuccess = function (e) { resolve(e.target.result || null); };
        req.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  function deleteAudioBlob(id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    });
  }

  // 缓存已创建的 blob URL，避免重复创建
  var _blobUrlCache = {};
  function getBlobUrl(fileId) {
    if (_blobUrlCache[fileId]) return Promise.resolve(_blobUrlCache[fileId]);
    return getAudioBlob(fileId).then(function (record) {
      if (!record || !record.blob) return null;
      var url = URL.createObjectURL(record.blob);
      _blobUrlCache[fileId] = url;
      return url;
    });
  }

  /* ========== 歌曲库管理 ========== */
  function loadLibrary() {
    try {
      return JSON.parse(localStorage.getItem(LIB_KEY) || '[]');
    } catch (e) { return []; }
  }

  function saveLibrary(list) {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function addSong(song) {
    var lib = loadLibrary();
    var newSong = {
      id: 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: (song.title || '').trim(),
      artist: (song.artist || '').trim(),
      cover: song.cover || '',
      url: song.url || '',
      fileId: song.fileId || '',   // 本地音频文件 ID（IndexedDB key）
      fileName: song.fileName || '',
      tags: Array.isArray(song.tags) ? song.tags : [],
      addedAt: Date.now()
    };
    if (!newSong.title) return null;
    lib.unshift(newSong);
    saveLibrary(lib);
    return newSong;
  }

  function removeSong(id) {
    var lib = loadLibrary();
    var song = lib.find(function (s) { return s.id === id; });
    // 删除 IndexedDB 中的音频文件
    if (song && song.fileId) {
      deleteAudioBlob(song.fileId).catch(function () {});
      if (_blobUrlCache[song.fileId]) {
        URL.revokeObjectURL(_blobUrlCache[song.fileId]);
        delete _blobUrlCache[song.fileId];
      }
    }
    saveLibrary(lib.filter(function (s) { return s.id !== id; }));
  }

  function updateSong(id, patch) {
    var lib = loadLibrary();
    var idx = lib.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    Object.assign(lib[idx], patch);
    saveLibrary(lib);
  }

  function getSongById(id) {
    return loadLibrary().find(function (s) { return s.id === id; }) || null;
  }

  /* ========== 设置 ========== */
  function loadSettings() {
    try {
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'));
    } catch (e) { return Object.assign({}, DEFAULT_SETTINGS); }
  }

  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* ========== 每日一歌 ========== */
  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getDailyRecord() {
    try {
      return JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
    } catch (e) { return null; }
  }

  function saveDailyRecord(rec) {
    try { localStorage.setItem(DAILY_KEY, JSON.stringify(rec)); } catch (e) {}
  }

  function isDailyPushedToday() {
    var rec = getDailyRecord();
    return rec && rec.date === getTodayStr();
  }

  /**
   * 执行每日一歌推送
   * 选歌 -> 生成理由 -> 以对方消息形式发送音乐卡片
   */
  function pushDailySong() {
    if (isDailyPushedToday()) return Promise.resolve(false);

    var settings = loadSettings();
    if (!settings.dailyPushEnabled) return Promise.resolve(false);

    var lib = loadLibrary();
    if (lib.length === 0) return Promise.resolve(false);

    // 随机选一首歌（每日一歌不依赖上下文，随机选）
    var song = lib[Math.floor(Math.random() * lib.length)];
    var pName = (window.settings && window.settings.partnerName) || '对方';
    var mName = (window.settings && window.settings.myName) || '我';

    var reasonPromise;
    if (settings.useAI && window.AIService && window.AIService.isFeatureEnabled && window.AIService.isFeatureEnabled('music')) {
      reasonPromise = window.AIService.generateDailySongReason(song, { partnerName: pName, myName: mName })
        .catch(function () { return defaultReason(song); });
    } else {
      reasonPromise = Promise.resolve(defaultReason(song));
    }

    return reasonPromise.then(function (reason) {
      sendMusicMessage(song, reason);
      saveDailyRecord({ date: getTodayStr(), songId: song.id, reason: reason, pushedAt: Date.now() });
      return true;
    });
  }

  function defaultReason(song) {
    var reasons = [
      '今天这首歌送给你，希望你喜欢~',
      '单曲循环了好久，觉得你也会爱上它',
      '听到这首歌就想到了你',
      '愿这首歌陪你度过今天',
      '这首歌的旋律很适合现在的你'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /* ========== 聊天内嵌推歌 ========== */
  /**
   * 聊天回复时尝试推歌（由 core.js 的 simulateReply 调用）
   * @param {string} chatContext - 最近的聊天内容摘要
   * @returns {Promise<boolean>} 是否推了歌
   */
  function maybePushSongInChat(chatContext) {
    var settings = loadSettings();
    if (!settings.chatPushEnabled) return Promise.resolve(false);

    var lib = loadLibrary();
    if (lib.length === 0) return Promise.resolve(false);

    // 概率判定
    if (Math.random() > settings.chatPushChance) return Promise.resolve(false);

    var pName = (window.settings && window.settings.partnerName) || '对方';
    var mName = (window.settings && window.settings.myName) || '我';

    var pickPromise;
    if (settings.useAI && window.AIService && window.AIService.isFeatureEnabled && window.AIService.isFeatureEnabled('music')) {
      // AI 从歌单中选一首 + 生成理由
      pickPromise = window.AIService.pickSongAndReason({
        songs: lib.slice(0, 15),  // 最多传 15 首避免 token 过多
        chatContext: chatContext,
        partnerName: pName,
        myName: mName
      }).then(function (result) {
        var song = getSongById(result.songId);
        if (!song) song = lib[Math.floor(Math.random() * lib.length)];
        return { song: song, reason: result.reason };
      }).catch(function () {
        var s = lib[Math.floor(Math.random() * lib.length)];
        return { song: s, reason: defaultReason(s) };
      });
    } else {
      var s = lib[Math.floor(Math.random() * lib.length)];
      pickPromise = Promise.resolve({ song: s, reason: defaultReason(s) });
    }

    return pickPromise.then(function (result) {
      sendMusicMessage(result.song, result.reason);
      return true;
    });
  }

  /* ========== 发送音乐卡片消息 ========== */
  function sendMusicMessage(song, reason) {
    if (typeof window.addMessage !== 'function') return;
    var pName = (window.settings && window.settings.partnerName) || '对方';
    window.addMessage({
      id: Date.now() + Math.random(),
      sender: pName,
      text: reason || '',
      timestamp: new Date(),
      status: 'received',
      type: 'music',
      music: {
        id: song.id,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        url: song.url || '',
        fileId: song.fileId || '',
        tags: song.tags || []
      }
    });
    if (typeof window.playSound === 'function') window.playSound('message');
  }

  /* ========== 音乐卡片渲染 ========== */
  /**
   * 渲染音乐消息卡片（供 core.js 的 createMessageFragment 调用）
   */
  function renderMusicCard(msg) {
    var music = msg.music || {};
    var title = music.title || '未知歌曲';
    var artist = music.artist || '未知歌手';
    var cover = music.cover || '';
    var url = music.url || '';
    var fileId = music.fileId || '';
    var text = msg.text || '';
    var canPlay = !!(url || fileId);

    var coverHtml = cover
      ? '<img src="' + cover + '" style="width:48px;height:48px;border-radius:10px;object-fit:cover;flex-shrink:0;">'
      : '<div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,var(--accent-color),#a78bfa);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-music" style="color:#fff;font-size:18px;"></i></div>';

    var playBtn = canPlay
      ? '<button class="music-play-btn" data-url="' + escapeHtml(url) + '" data-file-id="' + escapeHtml(fileId) + '" style="width:32px;height:32px;border-radius:50%;background:var(--accent-color);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:8px;"><i class="fas fa-play" style="color:#fff;font-size:12px;margin-left:2px;"></i></button>'
      : '<div style="width:32px;height:32px;border-radius:50%;background:var(--secondary-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:8px;"><i class="fas fa-music" style="color:var(--text-secondary);font-size:12px;"></i></div>';

    var reasonHtml = text ? '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;line-height:1.5;">' + escapeHtml(text) + '</div>' : '';

    return '<div class="music-card" style="background:var(--secondary-bg);border-radius:14px;padding:10px;min-width:220px;max-width:280px;">'
      + reasonHtml
      + '<div style="display:flex;align-items:center;margin-top:' + (text ? '8px' : '0') + ';">'
      + coverHtml
      + '<div style="flex:1;min-width:0;margin-left:10px;">'
      + '<div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(title) + '</div>'
      + '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(artist) + '</div>'
      + '</div>'
      + playBtn
      + '</div>'
      + '</div>';
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ========== 音乐播放 ========== */
  var currentAudio = null;
  var currentBtn = null;

  function toggleMusicPlay(url, btn, fileId) {
    // 如果有当前播放且点的是同一个按钮 -> 暂停
    if (currentAudio && currentBtn === btn) {
      if (currentAudio.paused) {
        currentAudio.play();
      } else {
        currentAudio.pause();
      }
      return;
    }

    // 停止当前播放
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
      if (currentBtn) {
        var prevIcon = currentBtn.querySelector('i');
        if (prevIcon) { prevIcon.className = 'fas fa-play'; prevIcon.style.marginLeft = '2px'; }
      }
    }

    function startPlay(audioUrl) {
      var audio = new Audio(audioUrl);
      currentAudio = audio;
      currentBtn = btn;
      var icon = btn.querySelector('i');
      audio.play().then(function () {
        if (icon) { icon.className = 'fas fa-pause'; icon.style.marginLeft = '0'; }
      }).catch(function (e) {
        if (typeof window.showNotification === 'function') window.showNotification('播放失败：' + (e.message || '无法播放'), 'error', 2000);
      });
      audio.onended = function () {
        if (icon) { icon.className = 'fas fa-play'; icon.style.marginLeft = '2px'; }
        currentAudio = null;
        currentBtn = null;
      };
      // 点击暂停/继续
      btn.onclick = function () {
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      };
    }

    if (fileId) {
      // 本地文件：从 IndexedDB 获取
      getBlobUrl(fileId).then(function (blobUrl) {
        if (blobUrl) startPlay(blobUrl);
        else if (typeof window.showNotification === 'function') window.showNotification('音频文件不存在', 'error', 2000);
      }).catch(function () {
        if (typeof window.showNotification === 'function') window.showNotification('音频加载失败', 'error', 2000);
      });
    } else if (url) {
      startPlay(url);
    }
  }

  /* ========== 暴露到全局 ========== */
  window.MusicService = {
    // 歌曲库
    loadLibrary: loadLibrary,
    addSong: addSong,
    removeSong: removeSong,
    updateSong: updateSong,
    getSongById: getSongById,
    // 设置
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    // 推歌
    pushDailySong: pushDailySong,
    maybePushSongInChat: maybePushSongInChat,
    isDailyPushedToday: isDailyPushedToday,
    // 渲染
    renderMusicCard: renderMusicCard,
    toggleMusicPlay: toggleMusicPlay,
    sendMusicMessage: sendMusicMessage,
    // IndexedDB
    putAudioBlob: putAudioBlob,
    getAudioBlob: getAudioBlob,
    deleteAudioBlob: deleteAudioBlob,
    // UI
    openAddSongForm: openAddSongForm
  };

  /* ========== 音乐库管理 UI ========== */
  function openMusicLibrary() {
    var modal = document.getElementById('music-library-modal');
    if (!modal) return;
    renderMusicLibraryList();
    if (typeof window.homeShowModal === 'function') window.homeShowModal(modal);
    else modal.style.display = 'flex';
  }

  function renderMusicLibraryList() {
    var list = document.getElementById('music-library-list');
    if (!list) return;
    var lib = loadLibrary();
    if (lib.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text-secondary);font-size:13px;"><i class="fas fa-music" style="font-size:36px;margin-bottom:12px;opacity:0.4;"></i><br>歌单还是空的<br><span style="font-size:11px;">添加几首喜欢的歌，对方才能推给你听~</span></div>';
      return;
    }
    list.innerHTML = lib.map(function (s) {
      var tagHtml = (s.tags || []).map(function (t) { return '<span style="display:inline-block;padding:2px 8px;background:var(--accent-color);color:#fff;border-radius:10px;font-size:10px;margin-right:4px;margin-top:4px;">' + escapeHtml(t) + '</span>'; }).join('');
      var coverHtml = s.cover
        ? '<img src="' + s.cover + '" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;">'
        : '<div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,var(--accent-color),#a78bfa);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-music" style="color:#fff;font-size:16px;"></i></div>';
      var playIcon = (s.url || s.fileId) ? '<i class="fas fa-volume-up" style="color:var(--accent-color);font-size:10px;margin-left:6px;"></i>' : '';
      return '<div style="display:flex;align-items:center;padding:10px;background:var(--secondary-bg);border-radius:12px;margin-bottom:8px;">'
        + coverHtml
        + '<div style="flex:1;min-width:0;margin-left:10px;">'
        + '<div style="font-size:13px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(s.title) + playIcon + '</div>'
        + '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">' + escapeHtml(s.artist || '未知歌手') + '</div>'
        + '<div>' + tagHtml + '</div>'
        + '</div>'
        + '<button onclick="MusicService.removeSong(\'' + s.id + '\');renderMusicLibraryList();" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;padding:8px;"><i class="fas fa-trash-alt"></i></button>'
        + '</div>';
    }).join('');
  }

  /* ========== 添加歌曲表单弹窗 ========== */
  var _selectedFile = null;

  function openAddSongForm() {
    var modal = document.getElementById('music-add-form-modal');
    if (!modal) return;
    // 清空表单
    _selectedFile = null;
    var titleInput = document.getElementById('add-song-title');
    var artistInput = document.getElementById('add-song-artist');
    var tagsInput = document.getElementById('add-song-tags');
    var fileInput = document.getElementById('add-song-file');
    var fileLabel = document.getElementById('add-song-file-label');
    var urlInput = document.getElementById('add-song-url');
    if (titleInput) titleInput.value = '';
    if (artistInput) artistInput.value = '';
    if (tagsInput) tagsInput.value = '';
    if (fileInput) fileInput.value = '';
    if (fileLabel) fileLabel.textContent = '点击选择音频文件（mp3/m4a 等）';
    if (urlInput) urlInput.value = '';
    // 尝试用文件名预填歌名
    if (fileInput) {
      fileInput.onchange = function () {
        if (fileInput.files && fileInput.files[0]) {
          _selectedFile = fileInput.files[0];
          var fileName = fileInput.files[0].name;
          // 去掉扩展名
          var baseName = fileName.replace(/\.[^.]+$/, '');
          if (fileLabel) fileLabel.textContent = '✓ ' + fileName + ' (' + (fileInput.files[0].size / 1024 / 1024).toFixed(1) + 'MB)';
          // 如果歌名为空，用文件名预填
          if (titleInput && !titleInput.value) titleInput.value = baseName;
        } else {
          _selectedFile = null;
          if (fileLabel) fileLabel.textContent = '点击选择音频文件（mp3/m4a 等）';
        }
      };
    }
    if (typeof window.homeShowModal === 'function') window.homeShowModal(modal);
    else modal.style.display = 'flex';
  }

  function closeAddSongForm() {
    var modal = document.getElementById('music-add-form-modal');
    if (typeof window.homeHideModal === 'function') window.homeHideModal(modal);
    else modal.style.display = 'none';
  }

  function submitAddSongForm() {
    var title = (document.getElementById('add-song-title') || {}).value || '';
    title = title.trim();
    if (!title) {
      if (typeof window.showNotification === 'function') window.showNotification('请输入歌曲名称', 'error', 1500);
      return;
    }
    var artist = ((document.getElementById('add-song-artist') || {}).value || '').trim();
    var tagsStr = ((document.getElementById('add-song-tags') || {}).value || '').trim();
    var url = ((document.getElementById('add-song-url') || {}).value || '').trim();
    var tags = tagsStr ? tagsStr.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean) : [];

    if (!_selectedFile && !url) {
      // 没有音频文件也没有链接 -> 只保存歌名信息
    }

    var fileId = '';
    var fileName = '';
    var savePromise = Promise.resolve();

    if (_selectedFile) {
      fileId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      fileName = _selectedFile.name;
      savePromise = putAudioBlob(fileId, _selectedFile);
    }

    savePromise.then(function () {
      var song = addSong({ title: title, artist: artist, url: url, fileId: fileId, fileName: fileName, tags: tags });
      if (song) {
        closeAddSongForm();
        renderMusicLibraryList();
        var tip = _selectedFile ? '已添加《' + title + '》（可播放）' : '已添加《' + title + '》';
        if (typeof window.showNotification === 'function') window.showNotification('✓ ' + tip, 'success', 1500);
      }
    }).catch(function (e) {
      if (typeof window.showNotification === 'function') window.showNotification('保存失败：' + (e.message || ''), 'error', 2000);
    });
  }

  function initMusicUI() {
    // 音乐库入口
    var entry = document.getElementById('music-library-entry');
    if (entry) entry.addEventListener('click', openMusicLibrary);

    // 关闭按钮
    var closeBtn = document.getElementById('music-library-close');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      var modal = document.getElementById('music-library-modal');
      if (typeof window.homeHideModal === 'function') window.homeHideModal(modal);
      else modal.style.display = 'none';
    });

    // 添加歌曲按钮 -> 打开表单弹窗
    var addBtn = document.getElementById('music-add-btn');
    if (addBtn) addBtn.addEventListener('click', openAddSongForm);

    // 添加歌曲表单弹窗的按钮
    var formSaveBtn = document.getElementById('add-song-save');
    if (formSaveBtn) formSaveBtn.addEventListener('click', submitAddSongForm);

    var formCancelBtn = document.getElementById('add-song-cancel');
    if (formCancelBtn) formCancelBtn.addEventListener('click', closeAddSongForm);

    // 暴露渲染函数给内联 onclick
    window.renderMusicLibraryList = renderMusicLibraryList;
  }

  /* ========== 启动时检查每日一歌 ========== */
  function checkDailySongOnLoad() {
    setTimeout(function () {
      if (!isDailyPushedToday()) {
        var settings = loadSettings();
        if (settings.dailyPushEnabled) {
          pushDailySong().catch(function (e) { console.warn('[每日一歌] 失败:', e); });
        }
      }
    }, 8000); // 延迟 8 秒，等 app 完全加载
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMusicUI();
      checkDailySongOnLoad();
    });
  } else {
    initMusicUI();
    checkDailySongOnLoad();
  }
})();
