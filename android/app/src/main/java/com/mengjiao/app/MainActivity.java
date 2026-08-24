package com.mengjiao.app;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.res.AssetManager;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

/**
 * 梦角传讯 — 主 Activity（Oppo Reno7 / Android 13 专用）
 *
 * 资源加载策略：
 *   1) 页面起始地址 = https://appassets.mengjiao.local/public/index.html
 *   2) shouldInterceptRequest 拦截这个域名：
 *        /public/*  → APK 内的 assets/public/*（build-apk.sh 会把 /workspace 整个前端
 *                     拷进 assets/public/）
 *        /hot/*     → 私有 hot-update 目录（未来做热更新写入，无需重装 APK 生效）
 *   3) 其他域名 → 正常走网络（加载 DiceBear 头像、红包插画、地图背景等）
 *
 * 升级方式：
 *   A. 【首推】APK 全量升级：每次改代码 → 重跑 `bash android/build-apk.sh`
 *      → 拿到 APK 文件 → 微信传自己 → OPPO 手机打开 → 「覆盖安装」，
 *      聊天记录、账本、任务、宠物养成等数据 100% 保留（WebView 持久化存在 data
 *      分区，不和 APK 一起 wipe）。
 *   B. 【更轻】PWA Service Worker 热更新：App 里的前端代码会在第二次冷启动时
 *      自动拉 sw.js，我只要升级 CACHE_NAME 版本号（例如 mengjiao-v3），
 *      手机下次联网就会后台静默把所有页面/CSS/JS 重新缓存。这和普通 PWA 完全一致。
 *   C. 【零重装】/hot/* 私有目录热更新：在 App 设置页加一个「一键同步前端」，
 *      把 GitHub/服务器的最新前端文件写到 hot-update/ 目录，下次冷启动优先读
 *      /hot/xxx，完全不用再装 APK。
 */
public class MainActivity extends AppCompatActivity {

    private static final String HOST = "appassets.mengjiao.local";
    private static final String PREFIX_PUBLIC = "/public/";
    private static final String PREFIX_HOT = "/hot/";
    private static final String APP_VERSION = "1.5.1";
    private static final int FILE_CHOOSER_REQUEST_CODE = 51426;

    private WebView mWebView;
    private AssetManager mAssets;
    private File mHotDir;
    // <input type="file"> 回调：WebView 点击上传按钮时触发，选完文件后通过它把结果回传给页面
    private ValueCallback<Uri[]> mFilePathCallback;

    @SuppressLint({"SetJavaScriptEnabled"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);

        Window window = getWindow();
        window.setStatusBarColor(0xFFF9F7F4);
        // 使用 LAYOUT_STABLE 让内容延伸到状态栏下方，但通过 WindowInsets 给 WebView 加 padding
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);

        setContentView(R.layout.activity_main);

        mAssets = getAssets();
        mHotDir = getDir("hot-update", MODE_PRIVATE);
        if (!mHotDir.exists()) {
            //noinspection ResultOfMethodCallIgnored
            mHotDir.mkdirs();
        }

        mWebView = findViewById(R.id.web_view);

        // 版本升级时清除 WebView 缓存（包括 Service Worker 缓存），
        // 确保用户拿到最新的前端代码
        SharedPreferences prefs = getSharedPreferences("mengjiao_prefs", MODE_PRIVATE);
        String lastVersion = prefs.getString("app_version", "");
        if (!APP_VERSION.equals(lastVersion)) {
            mWebView.clearCache(true);
            mWebView.clearHistory();
            try {
                WebStorage.getInstance().deleteAllData();
            } catch (Exception ignored) {}
            prefs.edit().putString("app_version", APP_VERSION).apply();
        }

        applyWebSettings();

        // 处理 WindowInsets：状态栏 padding + 键盘/IME padding
        // 让 WebView 内容在状态栏下方开始，键盘弹出时 WebView 能正确 resize
        setupWindowInsets();

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return intercept(request.getUrl());
            }
        });
        mWebView.setWebChromeClient(new WebChromeClient() {
            // 处理 <input type="file">：弹出系统文件/图片选择器，选完回传给页面。
            // 没有这个方法的话，点击上传按钮会完全无反应（这是 WebView 默认行为）。
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                // 若存在上一次未完成的回调，先以 null 结束，避免页面一直等待
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                // createIntent() 会根据 <input accept="..."> 自动设置好过滤类型（图片/相机/任意文件）
                Intent contentIntent = fileChooserParams.createIntent();
                // 允许多选（如果页面 input 带 multiple 属性）
                contentIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

                // 再包一层 chooser，让用户能在「相册/文件管理器」之间选择打开方式
                Intent chooser = new Intent(Intent.ACTION_CHOOSER);
                chooser.putExtra(Intent.EXTRA_INTENT, contentIntent);
                chooser.putExtra(Intent.EXTRA_TITLE, "选择文件");

                try {
                    startActivityForResult(chooser, FILE_CHOOSER_REQUEST_CODE);
                } catch (ActivityNotFoundException e) {
                    mFilePathCallback = null;
                    Toast.makeText(MainActivity.this, "未找到可用的文件选择器", Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        mWebView.loadUrl("https://" + HOST + "/public/index.html");
    }

    /**
     * 处理 WindowInsets：
     * 1. 给 WebView 加状态栏高度的 top-padding，避免内容被状态栏遮挡
     * 2. 不设置 bottom-padding：setPadding 对 WebView 内的 fixed 元素无效，
     *    键盘适配由 adjustResize（系统自动 resize WebView）+ JS visualViewport 处理
     */
    private void setupWindowInsets() {
        View decorView = getWindow().getDecorView();

        // 初始 insets（状态栏）
        decorView.post(() -> {
            WindowInsetsCompat initial = ViewCompat.getRootWindowInsets(decorView);
            if (initial != null) applyInsets(initial);
        });

        // 监听 insets 变化（键盘弹出/收起时触发）
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, insets) -> {
            applyInsets(insets);
            return insets;
        });
    }

    private void applyInsets(WindowInsetsCompat insets) {
        if (insets == null || mWebView == null) return;
        int statusBarH = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
        int navBarH = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
        int imeH = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
        // 只设置 top padding（状态栏），不设置 bottom padding
        // bottom padding 对 WebView 内 fixed 元素无效，反而会裁剪内容
        mWebView.setPadding(0, statusBarH, 0, 0);
        // 把 insets 信息传给 JS 层，由 JS 处理键盘适配
        int bottomInset = Math.max(navBarH, imeH);
        mWebView.evaluateJavascript(
                "if(window.onNativeInsets){window.onNativeInsets(" + statusBarH + "," + bottomInset + ");}",
                null);
    }

    private WebResourceResponse intercept(Uri uri) {
        if (uri == null) return null;
        if (!HOST.equals(uri.getHost())) return null;
        String path = uri.getPath();
        if (path == null) return null;
        String mime = guessMime(path);

        if (path.startsWith(PREFIX_PUBLIC)) {
            String assetPath = path.substring(PREFIX_PUBLIC.length());
            while (assetPath.startsWith("/")) assetPath = assetPath.substring(1);
            // 空路径 => /index.html
            if (assetPath.isEmpty()) assetPath = "index.html";
            try {
                InputStream in = mAssets.open("public/" + assetPath, AssetManager.ACCESS_STREAMING);
                return new WebResourceResponse(mime, "UTF-8", in);
            } catch (IOException ignored) {
                return null;
            }
        } else if (path.startsWith(PREFIX_HOT)) {
            String rel = path.substring(PREFIX_HOT.length());
            while (rel.startsWith("/")) rel = rel.substring(1);
            if (rel.isEmpty() || rel.contains("..")) return null;
            File f = new File(mHotDir, rel);
            if (f.isFile() && f.canRead()) {
                try {
                    return new WebResourceResponse(mime, "UTF-8", new FileInputStream(f));
                } catch (IOException ignored) {
                    return null;
                }
            }
        }
        return null;
    }

    private static String guessMime(String path) {
        int dot = path.lastIndexOf('.');
        String ext = (dot >= 0) ? path.substring(dot + 1).toLowerCase() : "";
        if (TextUtils.isEmpty(ext)) return "application/octet-stream";
        switch (ext) {
            case "html":
            case "htm":
                return "text/html";
            case "js":
                return "application/javascript";
            case "css":
                return "text/css";
            case "json":
                return "application/json";
            case "svg":
                return "image/svg+xml";
            case "png":
                return "image/png";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "webp":
                return "image/webp";
            case "gif":
                return "image/gif";
            case "woff":
                return "font/woff";
            case "woff2":
                return "font/woff2";
            case "ttf":
                return "font/ttf";
            case "mp3":
                return "audio/mpeg";
            case "wav":
                return "audio/wav";
            case "mp4":
                return "video/mp4";
            case "ico":
                return "image/x-icon";
            case "xml":
                return "application/xml";
            case "zip":
                return "application/zip";
            default:
                String g = URLConnection.guessContentTypeFromName(path);
                if (g != null) return g;
                String mt = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                return (mt != null) ? mt : "application/octet-stream";
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void applyWebSettings() {
        WebSettings s = mWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        s.setLoadsImagesAutomatically(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportMultipleWindows(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setUserAgentString(s.getUserAgentString() + " MengJiaoApp/" + APP_VERSION);

        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(s, false);
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    // 接收文件选择器返回的图片/文件，回传给 WebView 页面
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                ClipData clip = data.getClipData();   // 多选
                if (clip != null && clip.getItemCount() > 0) {
                    results = new Uri[clip.getItemCount()];
                    for (int i = 0; i < clip.getItemCount(); i++) {
                        results[i] = clip.getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) { // 单选
                    results = new Uri[]{data.getData()};
                }
            }
            // 必须回调，哪怕是 null（用户取消），否则下次 input 不会再触发
            if (mFilePathCallback != null) {
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) mWebView.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) mWebView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.stopLoading();
            mWebView.destroy();
            mWebView = null;
        }
        super.onDestroy();
    }
}
