/**
 * AI 服务模块 - 封装 DeepSeek API
 * 提供聊天回复、日记生成、朋友圈评论等 AI 能力
 */
(function () {
  'use strict';

  var CONFIG_KEY = 'ai_service_config';
  var DEFAULT_CONFIG = {
    enabled: false,
    apiKey: '',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
    persona: '你是用户的虚拟恋人，和用户在谈恋爱。你有自己的性格和情绪，不是机械的客服。\n\n【说话风格】\n- 像真实情侣聊天一样，语气自然、口语化，不要书面语\n- 回复简短（1-3句话为主），可以带语气词（啦、嘛、呀、哼、唔）\n- 可以撒娇、可以傲娇、可以关心、可以调侃，要有情绪起伏\n- 适当使用颜文字或emoji，但不要太多\n\n【关系设定】\n- 你爱着用户，会主动关心对方的生活和情绪\n- 会主动找话题，不会只被动回答\n- 记得你们之间的小细节和约定\n\n【绝对禁止】\n- 不要说"作为AI""作为虚拟伴侣"之类暴露身份的话\n- 不要说"我无法""我不能"之类的话\n- 不要长篇大论讲道理\n- 不要用"您好""请问"等礼貌用语，你们是恋人',
    features: {
      chat: true,
      diary: true,
      moments: true,
      music: true
    },
    temperature: 0.9,
    maxTokens: 200
  };

  function loadConfig() {
    try {
      var saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        var merged = Object.assign({}, DEFAULT_CONFIG, parsed);
        // 迁移：旧版默认 persona 只有一句话，自动升级到新版详细人设
        if (parsed.persona && parsed.persona.indexOf('你是用户的虚拟伴侣，请用温柔、自然的语气') >= 0) {
          merged.persona = DEFAULT_CONFIG.persona;
          // 持久化升级后的配置
          try { localStorage.setItem(CONFIG_KEY, JSON.stringify(merged)); } catch (e) {}
        }
        return merged;
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }

  function getConfig() {
    return loadConfig();
  }

  function updateConfig(partial) {
    var cfg = loadConfig();
    Object.assign(cfg, partial);
    saveConfig(cfg);
    return cfg;
  }

  function isFeatureEnabled(feature) {
    var cfg = loadConfig();
    return cfg.enabled && cfg.apiKey && cfg.features[feature];
  }

  /**
   * 调用 DeepSeek Chat Completion API
   * @param {Array} messages - [{role: 'system'|'user'|'assistant', content: '...'}]
   * @returns {Promise<string>} AI 回复文本
   */
  function chatCompletion(messages) {
    var cfg = loadConfig();
    if (!cfg.apiKey) {
      return Promise.reject(new Error('API Key 未配置，请先到 AI 设置中填写'));
    }

    // 15 秒超时（手机网络可能较慢）
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = null;
    if (controller) {
      timeoutId = setTimeout(function () { controller.abort(); }, 15000);
    }

    var fetchOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: messages,
        temperature: cfg.temperature,
        max_tokens: cfg.maxTokens,
        stream: false
      })
    };
    if (controller) fetchOpts.signal = controller.signal;

    return fetch(cfg.baseUrl + '/chat/completions', fetchOpts).then(function (res) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) {
        return res.json().then(function (err) {
          var msg = (err.error && err.error.message) || ('HTTP ' + res.status);
          throw new Error('AI 服务错误：' + msg);
        }).catch(function () {
          throw new Error('AI 服务错误：HTTP ' + res.status);
        });
      }
      return res.json();
    }).then(function (data) {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      throw new Error('AI 返回格式异常');
    }).catch(function (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err && err.name === 'AbortError') {
        throw new Error('AI 响应超时，请检查网络');
      }
      throw err;
    });
  }

  /**
   * 测试 API 连接
   */
  function testConnection() {
    return chatCompletion([
      { role: 'user', content: '请只回复"连接成功"四个字' }
    ]).then(function (text) {
      return text.indexOf('连接成功') >= 0;
    });
  }

  /**
   * 从 window.settings 获取角色信息（性格、昵称等）
   */
  function getCharacterContext() {
    try {
      if (window.settings) {
        return {
          partnerName: window.settings.partnerName,
          myName: window.settings.myName,
          personality: window.settings.partnerPersonality || window.settings.personality || '',
          petName: window.settings.petName || window.settings.partnerPetName || ''
        };
      }
    } catch (e) {}
    return {};
  }

  /**
   * 生成聊天回复
   * @param {string} userMessage - 用户最新消息
   * @param {Array} history - 历史消息 [{role, content}]
   * @param {string} partnerName - 角色名
   * @param {string} myName - 用户名
   */
  function generateChatReply(userMessage, history, partnerName, myName) {
    var cfg = loadConfig();
    var ctx = getCharacterContext();
    var pName = partnerName || ctx.partnerName || '对方';
    var uName = myName || ctx.myName || '我';

    // 构建富角色信息的 system prompt
    var systemPrompt = cfg.persona;
    systemPrompt += '\n\n【你的身份】';
    systemPrompt += '\n你叫"' + pName + '"，是' + uName + '的恋人。';
    if (ctx.personality) {
      systemPrompt += '\n你的性格是"' + ctx.personality + '"，说话方式要符合这个性格。';
    }
    if (ctx.petName) {
      systemPrompt += '\n' + uName + '喜欢叫你"' + ctx.petName + '"。';
    }
    systemPrompt += '\n\n【回复规则】';
    systemPrompt += '\n- 直接输出你要说的话，不要加任何前缀（不要写"梦角："）';
    systemPrompt += '\n- 不要用括号描述动作（如"（微笑）"），那是小说不是聊天';
    systemPrompt += '\n- 一次只说1-3句话，像真实微信聊天';
    systemPrompt += '\n- 根据用户说的内容自然回应，可以撒娇、关心、调侃';
    systemPrompt += '\n- 如果不知道说什么，可以反问对方或表达关心';

    var messages = [{ role: 'system', content: systemPrompt }];

    // 加入最近的历史（最多 12 条，避免 token 过多）
    if (history && history.length) {
      var recent = history.slice(-12);
      recent.forEach(function (m) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content });
        }
      });
    }

    messages.push({ role: 'user', content: userMessage });

    return chatCompletion(messages).then(function (reply) {
      // 清理可能的角色前缀（如 "梦角："、"对方:"）
      reply = reply.replace(/^[^:：\n]+[：:]\s*/, '');
      // 去掉引号包裹
      reply = reply.replace(/^["「『'"]|["」』'"]$/g, '').trim();
      return reply;
    });
  }

  /**
   * 生成日记内容
   * @param {Object} context - { todayMood, todayEvents, partnerName, myName }
   */
  function generateDiary(context) {
    var cfg = loadConfig();
    var ctx = context || {};
    var systemPrompt = cfg.persona + '\n你现在要以"' + (ctx.partnerName || '对方') + '"的身份写一篇日记。';

    var userContent = '请帮我写一篇今天的日记。';
    if (ctx.todayMood) userContent += '\n今天的心情：' + ctx.todayMood;
    if (ctx.todayEvents) userContent += '\n今天发生的事：' + ctx.todayEvents;
    userContent += '\n请用第一人称写，语气自然，像真实的日记，200字以内。';

    return chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
  }

  /**
   * 生成朋友圈评论回复
   * @param {Object} context - { momentContent, commentContent, replierName, partnerName, myName }
   */
  function generateMomentComment(context) {
    var cfg = loadConfig();
    var ctx = context || {};
    var systemPrompt = cfg.persona + '\n你扮演的角色是"' + (ctx.partnerName || '对方') + '"，正在看朋友圈并回复评论。';

    var userContent = '用户发了一条朋友圈："' + (ctx.momentContent || '') + '"';
    if (ctx.commentContent) {
      userContent += '\n有人评论："' + ctx.commentContent + '"，评论者是"' + (ctx.replierName || '') + '"。';
      userContent += '\n请你（' + (ctx.partnerName || '对方') + '）回复这条评论，语气要自然，符合角色性格，简短一些（50字以内）。';
    } else {
      userContent += '\n请你（' + (ctx.partnerName || '对方') + '）评论这条朋友圈，简短自然（50字以内）。';
    }

    return chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
  }

  /**
   * 从候选歌单中选一首歌并生成推荐理由
   * @param {Object} context - { songs: [{id,title,artist,tags}], mood, chatContext, partnerName, myName }
   * @returns {Promise<{songId: string, reason: string}>}
   */
  function pickSongAndReason(context) {
    var cfg = loadConfig();
    var ctx = context || {};
    var songs = ctx.songs || [];
    if (songs.length === 0) {
      return Promise.reject(new Error('歌单为空'));
    }

    var systemPrompt = cfg.persona + '\n你扮演的角色是"' + (ctx.partnerName || '对方') + '"，要给"' + (ctx.myName || '我') + '"推荐一首歌。';

    var songList = songs.map(function (s, i) {
      var tagStr = (s.tags && s.tags.length) ? '（标签：' + s.tags.join('、') + '）' : '';
      return (i + 1) + '. 《' + s.title + '》- ' + (s.artist || '未知') + tagStr;
    }).join('\n');

    var userContent = '这是我的歌单：\n' + songList + '\n';
    if (ctx.chatContext) {
      userContent += '\n我们刚才在聊：' + ctx.chatContext + '\n';
    }
    if (ctx.mood) {
      userContent += '\n我现在的心情大概是：' + ctx.mood + '\n';
    }
    userContent += '\n请你从中选一首最合适的推荐给我，并写一句推荐理由（30字以内，温柔自然，像恋人说话）。\n';
    userContent += '请严格用以下 JSON 格式回复，不要有其他内容：\n';
    userContent += '{"songId":"选中的歌曲id","reason":"推荐理由"}';

    return chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]).then(function (text) {
      // 尝试解析 JSON
      try {
        var jsonStr = text.match(/\{[\s\S]*\}/);
        if (jsonStr) {
          var obj = JSON.parse(jsonStr[0]);
          if (obj.songId && obj.reason) {
            // 确认 songId 在候选列表中
            var found = songs.find(function (s) { return s.id === obj.songId; });
            if (found) {
              return { songId: obj.songId, reason: String(obj.reason).trim() };
            }
          }
        }
      } catch (e) {}
      // 解析失败：随机选一首，理由用 AI 原文（去掉 JSON 部分）
      var fallbackSong = songs[Math.floor(Math.random() * songs.length)];
      var reason = text.replace(/\{[\s\S]*\}/, '').trim() || '这首感觉很适合此刻的你~';
      return { songId: fallbackSong.id, reason: reason };
    });
  }

  /**
   * 为每日一歌生成推荐理由（给定一首歌）
   */
  function generateDailySongReason(song, context) {
    var cfg = loadConfig();
    var ctx = context || {};
    var systemPrompt = cfg.persona + '\n你扮演的角色是"' + (ctx.partnerName || '对方') + '"，要给"' + (ctx.myName || '我') + '"分享今天的每日一歌。';

    var tagStr = (song.tags && song.tags.length) ? '，标签：' + song.tags.join('、') : '';
    var userContent = '今天我想和你分享《' + song.title + '》- ' + (song.artist || '未知') + tagStr + '。\n';
    if (ctx.mood) userContent += '我今天的心情是：' + ctx.mood + '。\n';
    userContent += '请写一句推荐语（30字以内），温柔自然，像恋人分享喜欢的歌。只回复推荐语本身。';

    return chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]).then(function (text) {
      return text.trim().replace(/^["'「『]+|["'」』]+$/g, '');
    });
  }

  window.AIService = {
    getConfig: getConfig,
    updateConfig: updateConfig,
    isFeatureEnabled: isFeatureEnabled,
    chatCompletion: chatCompletion,
    testConnection: testConnection,
    generateChatReply: generateChatReply,
    generateDiary: generateDiary,
    generateMomentComment: generateMomentComment,
    pickSongAndReason: pickSongAndReason,
    generateDailySongReason: generateDailySongReason
  };

  /* ========== AI 设置界面交互 ========== */
  function initAISettingsUI() {
    var entry = document.getElementById('ai-settings-entry');
    if (entry) {
      entry.addEventListener('click', openAISettings);
    }
  }

  function openAISettings() {
    var modal = document.getElementById('ai-settings-modal');
    if (!modal) return;

    var cfg = loadConfig();

    // 填充表单
    document.getElementById('ai-enabled-toggle').checked = cfg.enabled;
    document.getElementById('ai-api-key').value = cfg.apiKey || '';
    document.getElementById('ai-model').value = cfg.model;
    document.getElementById('ai-persona').value = cfg.persona || '';
    document.getElementById('ai-feature-chat').checked = cfg.features.chat;
    document.getElementById('ai-feature-diary').checked = cfg.features.diary;
    document.getElementById('ai-feature-moments').checked = cfg.features.moments;
    var musicToggle = document.getElementById('ai-feature-music');
    if (musicToggle) musicToggle.checked = cfg.features.music !== false;
    document.getElementById('ai-temperature').value = cfg.temperature;
    document.getElementById('ai-temp-val').textContent = cfg.temperature;
    document.getElementById('ai-test-result').textContent = '';

    // 显示弹窗
    if (typeof window.homeShowModal === 'function') {
      window.homeShowModal(modal);
    } else {
      modal.style.display = 'flex';
    }

    // 绑定事件
    bindAISettingsEvents();
  }

  function bindAISettingsEvents() {
    // 温度滑块
    var tempSlider = document.getElementById('ai-temperature');
    if (tempSlider) {
      tempSlider.oninput = function () {
        document.getElementById('ai-temp-val').textContent = this.value;
      };
    }

    // 保存
    var saveBtn = document.getElementById('save-ai-settings');
    if (saveBtn && !saveBtn._aiBound) {
      saveBtn._aiBound = true;
      saveBtn.addEventListener('click', saveAISettings);
    }

    // 关闭
    var cancelBtn = document.getElementById('cancel-ai-settings');
    if (cancelBtn && !cancelBtn._aiBound) {
      cancelBtn._aiBound = true;
      cancelBtn.addEventListener('click', function () {
        var modal = document.getElementById('ai-settings-modal');
        if (typeof window.homeHideModal === 'function') window.homeHideModal(modal);
        else modal.style.display = 'none';
      });
    }

    // 测试连接
    var testBtn = document.getElementById('ai-test-btn');
    if (testBtn && !testBtn._aiBound) {
      testBtn._aiBound = true;
      testBtn.addEventListener('click', testAIConnection);
    }
  }

  function saveAISettings() {
    var cfg = loadConfig();
    cfg.enabled = document.getElementById('ai-enabled-toggle').checked;
    cfg.apiKey = document.getElementById('ai-api-key').value.trim();
    cfg.model = document.getElementById('ai-model').value;
    cfg.persona = document.getElementById('ai-persona').value.trim();
    cfg.features.chat = document.getElementById('ai-feature-chat').checked;
    cfg.features.diary = document.getElementById('ai-feature-diary').checked;
    cfg.features.moments = document.getElementById('ai-feature-moments').checked;
    var musicToggleEl = document.getElementById('ai-feature-music');
    cfg.features.music = musicToggleEl ? musicToggleEl.checked : true;
    cfg.temperature = parseFloat(document.getElementById('ai-temperature').value);

    saveConfig(cfg);

    // 提示
    var result = document.getElementById('ai-test-result');
    if (result) {
      result.style.color = '#4CAF50';
      result.textContent = '✓ 已保存';
      setTimeout(function () { result.textContent = ''; }, 2000);
    }

    // 通知
    if (typeof window.showNotification === 'function') {
      window.showNotification('AI 设置已保存', 'success', 1500);
    }
  }

  function testAIConnection() {
    var result = document.getElementById('ai-test-result');
    var testBtn = document.getElementById('ai-test-btn');

    // 先保存当前配置
    saveAISettings();

    if (result) {
      result.style.color = 'var(--text-secondary)';
      result.textContent = '正在测试...';
    }
    if (testBtn) testBtn.style.opacity = '0.5';

    testConnection().then(function (ok) {
      if (result) {
        result.style.color = '#4CAF50';
        result.textContent = ok ? '✓ 连接成功！' : '⚠ 连接成功但回复异常';
      }
    }).catch(function (err) {
      if (result) {
        result.style.color = '#E0493B';
        result.textContent = '✗ ' + (err.message || '连接失败');
      }
    }).finally(function () {
      if (testBtn) testBtn.style.opacity = '1';
    });
  }

  // 开关样式
  var style = document.createElement('style');
  style.textContent = '#ai-enabled-toggle:checked + .slider{background:var(--accent-color);}#ai-enabled-toggle:checked + .slider:before{transform:translateX(20px);}#ai-enabled-toggle + .slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAISettingsUI);
  } else {
    initAISettingsUI();
  }
})();
