(function() {
    'use strict';

    function initCompanion() {
        if (document.getElementById('companion-container')) return;

        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'css/companion.css';
        document.head.appendChild(css);

        var html = '<div class="companion-container" id="companion-container" style="display:none;">' +
            '<div class="companion-header">' +
            '<button class="companion-exit-btn" onclick="CompanionApp.confirmExit()">' +
            '<span>退出</span></button></div>' +
            '<div class="companion-body">' +
            '<div class="companion-avatars">' +
            '<div class="companion-avatar-wrap companion-avatar-me">' +
            '<img class="companion-avatar-img" id="companion-my-avatar" src="" alt="我"></div>' +
            '<div class="companion-avatar-wrap companion-avatar-partner">' +
            '<img class="companion-avatar-img" id="companion-partner-avatar" src="" alt="梦角"></div></div>' +
            '<div class="companion-names">' +
            '<span id="companion-my-name" class="companion-name">我</span>' +
            '<span class="companion-name-amp">&amp;</span>' +
            '<span id="companion-partner-name" class="companion-name">梦角</span></div>' +
            '<div class="companion-timer-area">' +
            '<div class="companion-project-label" id="companion-project-label">陪伴项目</div>' +
            '<div class="companion-project-name" id="companion-project-name">未设置</div>' +
            '<div class="companion-time-display" id="companion-time-display">00:00:00</div></div>' +
            '<div class="companion-actions" id="companion-actions">' +
            '<button class="companion-btn companion-btn-primary" onclick="CompanionApp.showSetup()">' +
            '<span>开始陪伴</span></button></div></div></div>' +
            '<div class="companion-setup-overlay" id="companion-setup-overlay" style="display:none;">' +
            '<div class="companion-setup-modal">' +
            '<div class="companion-setup-title">设置陪伴</div>' +
            '<div class="companion-setup-field">' +
            '<label class="companion-setup-label">陪伴项目</label>' +
            '<input type="text" id="companion-project-input" class="companion-setup-input" placeholder="例如：一起看书、陪伴学习..." maxlength="20"></div>' +
            '<div class="companion-setup-field">' +
            '<label class="companion-setup-label">计时方式</label>' +
            '<div class="companion-setup-modes">' +
            '<div class="companion-mode-card" id="companion-mode-countdown" onclick="CompanionApp.selectMode(\'countdown\')">' +
            '<div class="companion-mode-text">' +
            '<div class="companion-mode-name">倒计时</div>' +
            '<div class="companion-mode-desc">设定固定时长</div></div>' +
            '<div class="companion-mode-check"></div></div>' +
            '<div class="companion-mode-card" id="companion-mode-stopwatch" onclick="CompanionApp.selectMode(\'stopwatch\')">' +
            '<div class="companion-mode-text">' +
            '<div class="companion-mode-name">正向计时</div>' +
            '<div class="companion-mode-desc">从零开始记录</div></div>' +
            '<div class="companion-mode-check"></div></div></div></div>' +
            '<div class="companion-setup-field" id="companion-duration-field" style="display:none;">' +
            '<label class="companion-setup-label">设定时长</label>' +
            '<div class="companion-duration-row">' +
            '<div class="companion-duration-item">' +
            '<input type="number" id="companion-hours" min="0" max="23" value="0" class="companion-duration-input">' +
            '<span class="companion-duration-unit">时</span></div>' +
            '<div class="companion-duration-item">' +
            '<input type="number" id="companion-minutes" min="0" max="59" value="30" class="companion-duration-input">' +
            '<span class="companion-duration-unit">分</span></div>' +
            '<div class="companion-duration-item">' +
            '<input type="number" id="companion-seconds" min="0" max="59" value="0" class="companion-duration-input">' +
            '<span class="companion-duration-unit">秒</span></div></div></div>' +
            '<div class="companion-setup-buttons">' +
            '<button class="companion-btn companion-btn-cancel" onclick="CompanionApp.hideSetup()">取消</button>' +
            '<button class="companion-btn companion-btn-confirm" onclick="CompanionApp.startCompanion()">开始</button></div></div></div>' +
            '<div class="companion-exit-overlay" id="companion-exit-overlay" style="display:none;">' +
            '<div class="companion-exit-modal">' +
            '<div class="companion-exit-text">确定要退出陪伴模式吗？</div>' +
            '<div class="companion-exit-subtext" id="companion-exit-subtext"></div>' +
            '<div class="companion-exit-buttons">' +
            '<button class="companion-btn companion-btn-cancel" onclick="CompanionApp.cancelExit()">取消</button>' +
            '<button class="companion-btn companion-btn-confirm" onclick="CompanionApp.doExit()">是</button></div></div></div>';
        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) document.body.appendChild(div.firstChild);

        var script = document.createElement('script');
        script.src = 'js/companion.js';
        document.body.appendChild(script);

        var oldOpenApp = window.openApp;
        window.openApp = function(appName) {
            if (appName === 'companion') {
                if (window.CompanionApp) window.CompanionApp.show();
                return;
            }
            if (oldOpenApp) oldOpenApp(appName);
        };
    }

    if (document.readyState === 'complete') initCompanion();
    else window.addEventListener('load', initCompanion);
})();
