/**
 * SparkShared - 全网站共享的「宠物」只读数据层
 * ----------------------------------------------------
 * 设计意图：
 *   1. 宠物只有 1 只，但支持「形态切换」（original / alternate），
 *      两种形态共享同一份名字、等级、经验、心情、饱腹度数据；
 *   2. 所有页面（spark-new.html / rps.html / chat-new.html / index-zy.html ……）
 *      在渲染时统一通过 SparkShared.readPet() 取 { name, form, image, avatar, color, emoji }，
 *      这样一旦在火花页改了名字 / 切了形态，其它页面刷新就能同步。
 *
 * 底层数据结构（仍与 SparkTracker 一致，使用 SPARK_KEY = "mengjiao_spark"）：
 *   {
 *     version: 3,
 *     form: "original" | "alternate",        // 形态：原形态 / 新形态
 *     pet: {                                  // 只有 1 只宠物
 *       name, level, exp, totalExp, streak,
 *       fullness, mood, avatar, daily, ...
 *     }
 *   }
 *
 * 兼容处理：旧结构（{ activePet, pets: {fire, kirin} }）在 load() 时会被
 * migrateOld() 自动合并（名字取 pets.fire.name，其余属性取 pets.fire）。
 */
(function () {
  'use strict';

  var SPARK_KEY = 'mengjiao_spark';

  // 形态定义（所有页面统一引用，防止路径不一致）
  var FORMS = {
    original: {
      id: 'original',
      label: '原形态',
      emoji: '🔥',
      image: { root: 'assets/character.png',     page: '../assets/character.png' },
      avatar:{ root: 'assets/character.png',     page: '../assets/character.png' },
      color: '#ff8a56',
      auraColor: 'rgba(255,184,107,0.45)',
      frameGradient: 'linear-gradient(145deg, #ffb86b, #ff8a56)'
    },
    alternate: {
      id: 'alternate',
      label: '新形态',
      emoji: '🦁',
      image: { root: 'assets/kirin_front.png',  page: '../assets/kirin_front.png' },
      avatar:{ root: 'assets/kirin_front.png',  page: '../assets/kirin_front.png' },
      color: '#b79050',
      auraColor: 'rgba(214,183,120,0.45)',
      frameGradient: 'linear-gradient(145deg, #f0d38a, #a77c3f)'
    }
  };

  var FORM_ORDER = ['original', 'alternate'];
  var DEFAULT_NAME = '小火人';

  /* ========== 底层读写 ========== */
  function readRaw() {
    try {
      var raw = localStorage.getItem(SPARK_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeRaw(data) {
    try { localStorage.setItem(SPARK_KEY, JSON.stringify(data)); }
    catch (e) { console.warn('[SparkShared] save failed', e); }
  }

  /* 单宠物默认结构 */
  function defaultPet(name) {
    return {
      name: name || DEFAULT_NAME,
      level: 1, exp: 0, totalExp: 0,
      streak: 0, lastActiveDate: '', totalInteractions: 0,
      makeupCards: 1, makeupMonth: (function(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); })(),
      milestones: [],
      avatar: { hairColor: 'purple', outfitColor: 'maroon', earColor: 'brown', eyes: 'round', mouth: 'smile', accessory: 'none', pose: 'idle' },
      daily: {},
      fullness: 60, mood: 60,
      lastFed: '', lastVitalUpdate: '',
      foods: {}
    };
  }
  function defaultData() {
    return {
      version: 3,
      form: 'original',
      pet: defaultPet(DEFAULT_NAME)
    };
  }

  /**
   * 旧格式迁移：
   *   v1: 单宠物平铺（没有 pets）→ 合并为 pet，form 保持 original
   *   v2: { activePet, pets: { fire, kirin } } → 合并为单 pet
   *       名字 = pets[activePet].name ?? pets.fire.name ?? DEFAULT_NAME
   *       其余 = pets.fire 属性（经验、等级、心情、饱腹度、连续天数、milestones…）
   *       （因为 fire 是最早的主数据，kirin 只是形态不是独立个体）
   */
  function migrateOld(d) {
    if (!d) return defaultData();
    // 已是最新结构
    if (d && d.version === 3 && typeof d.pet === 'object' && FORMS[d.form]) return d;

    var form = FORMS[d.form] ? d.form : 'original';
    var pet = defaultPet(DEFAULT_NAME);

    if (d && typeof d.pets === 'object') {
      // v2 结构
      var activeKey = d.activePet && d.pets[d.activePet] ? d.activePet : 'fire';
      var active = d.pets[activeKey] || {};
      var fire = d.pets.fire || {};
      pet = mergeObj(mergeObj(defaultPet(DEFAULT_NAME), fire), active);
      // 名字以 active 的为准
      pet.name = (active.name || fire.name || DEFAULT_NAME);
      // 如果 activeKey 是 kirin（用户在旧版本里切到了玉麒麟 tab），形态默认切到 alternate
      if (activeKey === 'kirin') form = 'alternate';
    } else if (d && (typeof d.level === 'number' || typeof d.name === 'string' || typeof d.exp === 'number')) {
      // v1 平铺结构
      pet = mergeObj(defaultPet(DEFAULT_NAME), d);
    }
    // 兜底：缺失字段填默认
    pet = mergeObj(defaultPet(pet.name || DEFAULT_NAME), pet);

    return { version: 3, form: form, pet: pet };
  }
  function mergeObj(base, extra) {
    if (!extra) return base;
    for (var k in extra) {
      if (!Object.prototype.hasOwnProperty.call(extra, k)) continue;
      var v = extra[k];
      if (v === null || v === undefined) continue;
      // 浅层对象（avatar、daily、foods）合并而非覆盖
      if (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k]) &&
          typeof v === 'object' && !Array.isArray(v)) {
        base[k] = mergeObj(base[k], v);
      } else {
        base[k] = v;
      }
    }
    return base;
  }

  /* ========== 对外 API ========== */

  /**
   * 读取形态信息 + 宠物基础信息（所有页面都用这个）
   *   scope: "root"  → 路径是 assets/xxx.png        （给 index-zy.html 这种根目录页面用）
   *          "page"  → 路径是 ../assets/xxx.png     （给 pages/xxx.html 用）
   * 返回：{ name, form, formLabel, emoji, image, avatar, color, auraColor, frameGradient,
   *         level, exp, totalExp, mood, fullness, streak }
   */
  function readPet(scope) {
    var data = migrateOld(readRaw());
    var fd = FORMS[data.form] || FORMS.original;
    var s = (scope === 'root') ? 'root' : 'page';
    var p = data.pet || defaultPet();
    return {
      // 名字 & 形态
      name: p.name || DEFAULT_NAME,
      form: fd.id,
      formLabel: fd.label,
      emoji: fd.emoji,
      // 图片路径
      image: fd.image[s],
      avatar: fd.avatar[s],
      // 颜色
      color: fd.color,
      auraColor: fd.auraColor,
      frameGradient: fd.frameGradient,
      // 数值
      level: p.level || 1,
      exp: p.exp || 0,
      totalExp: p.totalExp || 0,
      mood: typeof p.mood === 'number' ? p.mood : 60,
      fullness: typeof p.fullness === 'number' ? p.fullness : 60,
      streak: p.streak || 0,
      // 原始数据引用（方便上层直接再加工）
      _formDef: fd,
      _pet: p,
      _data: data
    };
  }

  /**
   * 切形态（只改 form，不改 pet 数据）
   */
  function setForm(formId) {
    if (!FORMS[formId]) return false;
    var data = migrateOld(readRaw());
    data.form = formId;
    writeRaw(data);
    return true;
  }

  /**
   * 改名字（只改 pet.name）
   */
  function setName(newName) {
    var data = migrateOld(readRaw());
    data.pet.name = String(newName || '').trim().slice(0, 12) || DEFAULT_NAME;
    writeRaw(data);
    return data.pet.name;
  }

  /**
   * 写完整 pet（SparkTracker.feed() / recordInteraction() 等有完整 pet 对象时用）
   */
  function setPet(petPatch) {
    if (!petPatch) return;
    var data = migrateOld(readRaw());
    data.pet = mergeObj(data.pet, petPatch);
    writeRaw(data);
    return data.pet;
  }

  /**
   * 底层原始完整读写（给 SparkTracker 这种需要直接改整个结构的场景）
   */
  function load() { return migrateOld(readRaw()); }
  function save(data) { writeRaw(data); }

  /* 导出 */
  window.SparkShared = {
    SPARK_KEY: SPARK_KEY,
    FORMS: FORMS,
    FORM_ORDER: FORM_ORDER,
    DEFAULT_NAME: DEFAULT_NAME,
    readPet: readPet,
    setForm: setForm,
    setName: setName,
    setPet: setPet,
    load: load,
    save: save,
    defaultPet: defaultPet,
    defaultData: defaultData,
    migrate: migrateOld
  };
})();
