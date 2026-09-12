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
    persona: '你是用户的虚拟伴侣，请用温柔、自然的语气和用户交流，像真正的恋人一样关心对方。回复要简短自然，不要太书面化。',
    features: {
      chat: true,
      diary: true,
      moments: true
    },
    temperature: 0.8,
    maxTokens: 300
  };

  function loadConfig() {
    try {
      var saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
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

    return fetch(cfg.baseUrl + '/chat/completions', {
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
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          var msg = (err.error && err.error.message) || ('HTTP ' + res.status);
          throw new Error('AI 服务错误：' + msg);
        });
      }
      return res.json();
    }).then(function (data) {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      throw new Error('AI 返回格式异常');
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
   * 生成聊天回复
   * @param {string} userMessage - 用户最新消息
   * @param {Array} history - 历史消息 [{role, content}]
   * @param {string} partnerName - 角色名
   * @param {string} myName - 用户名
   */
  function generateChatReply(userMessage, history, partnerName, myName) {
    var cfg = loadConfig();
    var systemPrompt = cfg.persona + '\n你扮演的角色名字叫"' + (partnerName || '对方') + '"，用户名字叫"' + (myName || '我') + '"。';

    var messages = [{ role: 'system', content: systemPrompt }];

    // 加入最近的历史（最多 10 条，避免 token 过多）
    if (history && history.length) {
      var recent = history.slice(-10);
      recent.forEach(function (m) {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: m.content });
        }
      });
    }

    messages.push({ role: 'user', content: userMessage });

    return chatCompletion(messages).then(function (reply) {
      // 清理可能的角色前缀
      reply = reply.replace(/^[^:：]+[：:]\s*/, '');
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

  window.AIService = {
    getConfig: getConfig,
    updateConfig: updateConfig,
    isFeatureEnabled: isFeatureEnabled,
    chatCompletion: chatCompletion,
    testConnection: testConnection,
    generateChatReply: generateChatReply,
    generateDiary: generateDiary,
    generateMomentComment: generateMomentComment
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
