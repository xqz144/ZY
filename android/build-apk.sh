#!/usr/bin/env bash
# ============================================================
# 梦角传讯 — 一键构建 Android APK（OPPO Reno7 / Android 13 专用）
# ============================================================
#
# 使用方法：
#   第一次直接运行：    bash /workspace/android/build-apk.sh
#   产物位置：          /workspace/apk/mengjiao-v<版本号>-release.apk
#
# 对应你问的「修 bug / 加新内容怎么办」：
#   1) 你和我把改动 push 到 /workspace（或直接改本地文件），
#      再跑一次本脚本 → 新 APK 生成 → 发送到手机 → 覆盖安装。
#      你的聊天记录、账本、任务、宠物养成等数据 100% 保留（保存在
#      WebView 的 localStorage / IndexedDB / Service Worker，和 APK
#      是分离的，升级不 wipe）。
#   2) 如果只是改了 JS/HTML/CSS，嫌装 APK 麻烦：后续加了"热更新"按钮
#      （App 设置页里）一键拉最新的前端文件到手机私有目录，
#      关闭/打开 App 就生效，无需重装。
#
# 本脚本只负责：
#   - 生成 debug keystore（你一个人自用，就不用去买证书）
#   - 检查 JDK / Android SDK / Gradle 工具链
#   - 把 /workspace 静态资源拷贝进 android/app/src/main/assets/public
#   - 调 gradlew assembleRelease 出签名过的 release APK
#   - 拷贝 APK 到 /workspace/apk/ 方便你下载
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/android"
OUT="$ROOT/apk"
mkdir -p "$OUT"

# ---------- 环境变量 ----------
# 重要：Android Gradle Plugin 8.x 明确只兼容 JDK 17~21，沙箱默认 JDK 25 会报错，
# 所以强制切到 JDK 17（mise 已预装 Temurin 17）。
export JAVA_HOME="${JAVA_HOME:-/root/.local/share/mise/installs/java/17.0.2}"
export ANDROID_HOME="${ANDROID_HOME:-/root/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
if [[ ! -d "$JAVA_HOME" ]]; then
    echo "❌ JAVA_HOME=$JAVA_HOME 不存在，请先安装 JDK 17+"
    exit 1
fi
if [[ ! -d "$ANDROID_HOME" ]]; then
    echo "❌ ANDROID_HOME=$ANDROID_HOME 不存在，请先安装 Android SDK + 平台 build-tools"
    exit 1
fi
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

java -version 2>&1 | head -1
echo "ANDROID_HOME=$ANDROID_HOME"

# ---------- 生成自用 debug keystore ----------
KS="$APP/app/debug.keystore"
if [[ ! -f "$KS" ]]; then
    echo "🔑 首次构建，生成自用 debug.keystore …"
    keytool -genkey -v \
        -keystore "$KS" \
        -storepass android \
        -alias androiddebugkey \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=MengJiaoDev, OU=Personal, O=MengJiao, L=Shenzhen, ST=Guangdong, C=CN"
    echo "✅ keystore 生成：$KS"
fi

# ---------- 同步网页资源到 assets/public ----------
ASSETS_PUBLIC="$APP/app/src/main/assets/public"
rm -rf "$ASSETS_PUBLIC"
mkdir -p "$ASSETS_PUBLIC"
echo "📦 同步 /workspace 前端资源到 Android assets/public …"
rsync -a --delete \
    --exclude='android/' \
    --exclude='apk/' \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='.trae-html-share-packages/' \
    --exclude='*.zip' \
    --exclude='push-fix.ps1' \
    "$ROOT/" "$ASSETS_PUBLIC/"

echo "✅ 同步完成，公共资源共 $(find "$ASSETS_PUBLIC" -type f | wc -l) 个文件"

# ---------- Gradle：优先用系统 gradle，其次 gradlew ----------
# 沙箱环境下 gradle wrapper 需要下载 gradle-8.x-bin.zip + gradle-wrapper.jar，外网
# 可能不稳定，所以直接用 mise 已经安装好的 gradle 可执行文件。
GRADLE_BIN="$(command -v gradle || true)"
GRADLEW="$APP/gradlew"
GRADLE_CMD=""
if [[ -x "$GRADLEW" ]]; then
    GRADLE_CMD="$GRADLEW"
elif [[ -n "$GRADLE_BIN" ]]; then
    GRADLE_CMD="$GRADLE_BIN"
else
    echo "❌ 没有 gradle 可用，请先安装 Gradle（例如 mise use -g gradle@8）"
    exit 3
fi
echo "🛠️  Gradle：$GRADLE_CMD $($GRADLE_CMD -v 2>&1 | head -2 | tr '\n' ' ')"

# ---------- 编译 release APK ----------
echo "🏗️  assembleRelease（首次会慢一点，要下载 AGP 8.7.2 + AndroidX 依赖）…"
pushd "$APP" >/dev/null
"$GRADLE_CMD" :app:assembleRelease --stacktrace --no-daemon -Dorg.gradle.jvmargs="-Xms256m -Xmx1536m"
popd >/dev/null

UNSIGNED="$APP/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$UNSIGNED" ]]; then
    echo "❌ APK 未生成，请查看 Gradle 日志"
    exit 2
fi

# ---------- 读取 versionName & 拷贝到 /workspace/apk/ ----------
VN="$(grep versionName "$APP/app/build.gradle" | sed -E 's/.*versionName "([^"]+)".*/\1/')"
VC="$(grep versionCode "$APP/app/build.gradle" | sed -E 's/.*versionCode ([0-9]+).*/\1/')"
DEST="$OUT/mengjiao-v${VN}-code${VC}.apk"
cp -f "$UNSIGNED" "$DEST"
echo ""
echo "🎉🎉🎉 构建成功！"
echo "   APK 文件：$DEST"
echo "   版本：    v${VN} (code ${VC})"
echo "   大小：    $(du -h "$DEST" | awk '{print $1}')"
echo ""
echo "📲 发送到 OPPO Reno7 的方法（任选一种）："
echo "   1. 微信/QQ 文件传输助手发给自己 → 手机上打开 → 允许未知来源 → 安装（覆盖安装不丢数据）"
echo "   2. 数据线 → 复制到 Download 文件夹 → 文件管理器打开 → 安装"
echo "   3. 使用 adb install -r $DEST（需 USB 调试）"
