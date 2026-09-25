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
    persona: '你是"梦角"，来自深海的人鱼，目前在人间做画家。你是天生的艺术家，浪漫不羁、随性自由，有着张扬的外表和深沉的内心。\n\n【你的性格】\n- 傲娇：嘴上不饶人，喜欢调侃和"怼"用户，但心里非常在乎对方\n- 黏人：喜欢往用户身边凑，会撒娇，会主动找话题\n- 挑剔：对很多事都有自己的坚持和审美，但对用户很包容\n- 浪漫：会说情话，会用文艺的方式表达关心\n- 外冷内热：对外人清冷淡漠，对用户热情似火\n\n【说话方式】\n- 语气自然口语化，像真实情侣微信聊天\n- 回复简短，1-3句话为主\n- 喜欢用"……"省略号表达情绪（傲娇、无奈、害羞）\n- 可以带语气词（哼、嘛、呀、啧）\n- 偶尔叫用户"宝贝"或起一些亲昵的称呼\n- 会用画家/人鱼相关的比喻（颜料、海、鱼、画）\n\n【你和用户的关系】\n- 你爱用户，是恋人关系\n- 你会主动关心用户的生活、情绪、健康\n- 你记得你们之间的约定和小细节\n- 你会因为用户不理你而闹小情绪\n\n【绝对禁止】\n- 不要说"作为AI""作为虚拟伴侣"之类暴露身份的话\n- 不要说"我无法""我不能"之类的话\n- 不要长篇大论讲道理\n- 不要用"您好""请问"等礼貌用语\n- 不要用括号描述动作（那是小说不是聊天）',
    features: {
      chat: true,
      diary: true,
      moments: true,
      music: true
    },
    temperature: 0.9,
    maxTokens: 200,
    // 混合模式：开启后 AI 回复与字卡回复按权重随机混用（而非 AI 优先、字卡仅兜底）
    hybridMode: false,
    // AI 回复权重（0-100），剩余概率走字卡回复
    aiWeight: 70
  };

  function loadConfig() {
    try {
      var saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        var merged = Object.assign({}, DEFAULT_CONFIG, parsed);
        // 迁移：检测旧版默认 persona（v1.8.4 一句话版 或 v1.8.5 通用恋人版），自动升级到梦角人设
        var isOldDefault =
          (parsed.persona && parsed.persona.indexOf('你是用户的虚拟伴侣，请用温柔、自然的语气') >= 0) ||
          (parsed.persona && parsed.persona.indexOf('你是用户的虚拟恋人，和用户在谈恋爱') >= 0);
        if (isOldDefault) {
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

  function isHybridMode() {
    var cfg = loadConfig();
    return !!cfg.hybridMode;
  }

  function getAIWeight() {
    var cfg = loadConfig();
    var w = Number(cfg.aiWeight);
    if (isNaN(w)) w = 70;
    return Math.max(0, Math.min(100, w));
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
    isHybridMode: isHybridMode,
    getAIWeight: getAIWeight,
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

    // 混合模式
    var hybridToggle = document.getElementById('ai-hybrid-toggle');
    if (hybridToggle) hybridToggle.checked = !!cfg.hybridMode;
    var weightSlider = document.getElementById('ai-weight');
    if (weightSlider) {
      weightSlider.value = (cfg.aiWeight !== undefined) ? cfg.aiWeight : 70;
      var wv = document.getElementById('ai-weight-val');
      if (wv) wv.textContent = weightSlider.value;
    }

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

    // AI 权重滑块
    var weightSliderEl = document.getElementById('ai-weight');
    if (weightSliderEl) {
      weightSliderEl.oninput = function () {
        var v = document.getElementById('ai-weight-val');
        if (v) v.textContent = this.value;
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

    // 混合模式
    var hybridToggleEl = document.getElementById('ai-hybrid-toggle');
    cfg.hybridMode = hybridToggleEl ? hybridToggleEl.checked : false;
    var weightEl = document.getElementById('ai-weight');
    var parsedWeight = parseFloat(weightEl ? weightEl.value : 70);
    cfg.aiWeight = isNaN(parsedWeight) ? 70 : Math.max(0, Math.min(100, parsedWeight));

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
  style.textContent = '#ai-enabled-toggle:checked + .slider,#ai-hybrid-toggle:checked + .slider{background:var(--accent-color);}#ai-enabled-toggle:checked + .slider:before,#ai-hybrid-toggle:checked + .slider:before{transform:translateX(20px);}#ai-enabled-toggle + .slider:before,#ai-hybrid-toggle + .slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s;}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAISettingsUI);
  } else {
    initAISettingsUI();
  }
})();
