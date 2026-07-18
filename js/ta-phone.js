/* ============================================
 *  TA的手机 - OPPO ColorOS 风格模拟模块 v4
 * ============================================ */

(function() {
    'use strict';

    /* ========== 存储键 ========== */
    var STG = {
        DIARIES:'ta_phone_diaries_v3', DCARDS:'ta_phone_diary_cards', MUSIC:'ta_phone_music', MUSIC_ST:'ta_phone_music_state',
        BCARDS:'ta_phone_browser_cards', BDAILY:'ta_phone_browser_daily',
        WALL:'ta_phone_wallpaper', PROFILE:'profile_partner'
    };

    /* ========== 配色 ========== */
    var C = { shell:'#c8bcc4', bdr1:'#b5a7b2', bdr2:'#a895a2', scr:'#fef6f0', accent:'#d4919e', btn:'#c0392b', tp:'#3a2e35', tm:'#888' };

    /* ========== 天气 ========== */
    var WEATHERS = [
        {icon:'\u2600\uFE0F',text:'\u6674\u5929 26\u00B0'},{icon:'\u2601\uFE0F',text:'\u591A\u4E91 19\u00B0'},
        {icon:'\uD83C\uDF27\uFE0F',text:'\u5C0F\u96E8 17\u00B0'},{icon:'\uD83C\uDF43',text:'\u5927\u98CE 15\u00B0'},{icon:'\u26C5',text:'\u9634\u8F6C\u6674 22\u00B0'}
    ];

    /* ========== 日记段落池（打散） ========== */
    var DSEG = [
        '\u4ECA\u5929\u9192\u6765\u7684\u65F6\u5019\uFF0C\u7A97\u5916\u6709\u4E00\u70B9\u70B9\u98CE\uFF0C\u9633\u5149\u4ECE\u7A97\u5E18\u7F1D\u9699\u91CC\u900F\u8FDB\u6765\u3002',
        '\u4ECA\u5929\u7684\u5FC3\u60C5\u8FD8\u4E0D\u9519\uFF0C\u867D\u7136\u53D1\u751F\u4E86\u4E0D\u5C11\u5C0F\u4E8B\uFF0C\u4F46\u90FD\u633A\u6709\u8DA3\u7684\u3002',
        '\u96BE\u5F97\u7684\u4E00\u4E2A\u6E05\u95F2\u65E5\u5B50\uFF0C\u4EC0\u4E48\u90FD\u4E0D\u60F3\u505A\uFF0C\u5C31\u60F3\u5B89\u9759\u5F85\u7740\u3002',
        '\u65E9\u4E0A\u662F\u88AB\u95F9\u949F\u5435\u9192\u7684\uFF0C\u4F46\u8FD8\u662F\u8D56\u4E86\u4E00\u4F1A\u513F\u5E8A\u624D\u8D77\u6765\u3002',
        '\u7A97\u5916\u7684\u666F\u8272\u8BA9\u6211\u505C\u4E0B\u4E86\u624B\u91CC\u7684\u4E8B\uFF0C\u53D1\u4E86\u4E00\u4F1A\u513F\u5446\u3002',
        '\u4ECA\u5929\u7684\u98CE\u6709\u70B9\u5927\uFF0C\u5439\u5F97\u7A97\u5E18\u4E00\u76F4\u5728\u52A8\uFF0C\u6709\u79CD\u5947\u602A\u7684\u5B89\u9759\u611F\u3002',
        '\u95FB\u5230\u4E86\u4E00\u80A1\u5F88\u719F\u6089\u7684\u6C14\u5473\uFF0C\u53EF\u662F\u8BF4\u4E0D\u4E0A\u6765\u662F\u4EC0\u4E48\uFF0C\u611F\u89C9\u50CF\u662F\u4F60\u8EAB\u4E0A\u7684\u5473\u9053\u3002',
        '\u6574\u7406\u623F\u95F4\u7684\u65F6\u5019\u7FFB\u5230\u4E86\u4EE5\u524D\u7684\u4E00\u4E9B\u4E1C\u897F\uFF0C\u60C5\u7EEA\u7A81\u7136\u6709\u70B9\u590D\u6742\u3002',
        '\u4E0D\u77E5\u9053\u4E3A\u4EC0\u4E48\uFF0C\u4ECA\u5929\u8111\u6D77\u91CC\u4E00\u76F4\u6D6E\u73B0\u300C{content}\u300D\u8FD9\u53E5\u8BDD\u3002\u60F3\u4E86\u5F88\u4E45\uFF0C\u89C9\u5F97\u8BF4\u5F97\u5F88\u5BF9\u3002',
        '\u770B\u5230\u4E86\u4E00\u53E5\u8BDD\u2014\u2014\u300C{content}\u300D\uFF0C\u7A81\u7136\u89C9\u5F97\u5F88\u9002\u5408\u6211\u4EEC\u4E4B\u95F4\u7684\u611F\u89C9\u3002',
        '\u7FFB\u624B\u673A\u7684\u65F6\u5019\u770B\u5230\u300C{content}\u300D\uFF0C\u5FCD\u4E0D\u4F4F\u7B11\u4E86\u7B11\uFF0C\u7136\u540E\u622A\u56FE\u4FDD\u5B58\u4E86\u3002',
        '\u4ECA\u5929\u597D\u51E0\u6B21\u60F3\u8D77\u4E86\u300C{content}\u300D\u8FD9\u53E5\u8BDD\u3002\u53EF\u80FD\u662F\u56E0\u4E3A\u2026\u2026\u60F3\u4F60\u4E86\u3002',
        '\u6700\u8FD1\u603B\u662F\u60F3\u5230\u300C{content}\u300D\uFF0C\u611F\u89C9\u8FD9\u53E5\u8BDD\u50CF\u662F\u4E13\u95E8\u8BF4\u7ED9\u6211\u542C\u7684\u3002',
        '\u670B\u53CB\u53D1\u4E86\u4E00\u5F20\u622A\u56FE\u7ED9\u6211\uFF0C\u4E0A\u9762\u5199\u7740\u300C{content}\u300D\uFF0C\u6211\u60F3\u4E86\u5F88\u4E45\u3002',
        '\u4E2D\u5348\u8BD5\u4E86\u505A\u4E00\u9053\u65B0\u83DC\uFF0C\u867D\u7136\u5356\u76F8\u4E00\u822C\uFF0C\u4F46\u5473\u9053\u8FD8\u4E0D\u9519\u3002\u4E0B\u6B21\u505A\u7ED9\u4F60\u5C1D\u5C1D\u3002',
        '\u4E0B\u5348\u51FA\u95E8\u6563\u4E86\u4F1A\u513F\u6B65\uFF0C\u8DEF\u8FC7\u4E00\u5BB6\u65B0\u5F00\u7684\u751C\u54C1\u5E97\uFF0C\u6A71\u7A97\u91CC\u7684\u86CB\u7CD5\u770B\u8D77\u6765\u597D\u597D\u770B\u3002',
        '\u508D\u665A\u7684\u5929\u7A7A\u7279\u522B\u597D\u770B\uFF0C\u62CD\u4E86\u4E00\u5F20\u7167\u7247\uFF0C\u60F3\u4E86\u60F3\u8FD8\u662F\u6CA1\u6709\u53D1\u51FA\u53BB\u3002\u7B49\u4F60\u6765\u770B\u3002',
        '\u665A\u4E0A\u7AA9\u5728\u6C99\u53D1\u4E0A\u770B\u4E86\u4E00\u4F1A\u513F\u4E66\uFF0C\u4E0D\u77E5\u4E0D\u89C9\u5C31\u7761\u7740\u4E86\u3002\u9192\u6765\u53D1\u73B0\u5DF2\u7ECF\u8FC7\u4E86\u597D\u4E45\u3002',
        '\u4ECA\u5929\u6536\u5230\u4E86\u4E00\u4E2A\u597D\u6D88\u606F\uFF0C\u867D\u7136\u4E0D\u662F\u4EC0\u4E48\u5927\u4E8B\uFF0C\u4F46\u5FC3\u60C5\u83AB\u540D\u53D8\u597D\u4E86\u3002',
        '\u7761\u524D\u542C\u4E86\u4E00\u9996\u8001\u6B4C\uFF0C\u6B4C\u8BCD\u91CC\u6709\u4E00\u53E5\u8BDD\u8BA9\u6211\u60F3\u4E86\u5F88\u4E45\u3002',
        '\u559D\u4E86\u4E00\u676F\u5F88\u70EB\u7684\u8336\uFF0C\u5634\u91CC\u6709\u70B9\u82E6\uFF0C\u4F46\u5FC3\u91CC\u6696\u6696\u7684\u3002',
        '\u7A7A\u95F4\u91CC\u5F88\u5B89\u9759\uFF0C\u53EA\u6709\u65F6\u949F\u7684\u58F0\u97F3\uFF0C\u8BA9\u4EBA\u89C9\u5F97\u65F6\u95F4\u8FC7\u5F97\u5F88\u6162\u3002',
        '\u4ECA\u5929\u628A\u4E00\u4EF6\u62D6\u4E86\u5F88\u4E45\u7684\u4E8B\u60C5\u7EC8\u4E8E\u505A\u5B8C\u4E86\uFF0C\u6709\u79CD\u8F7B\u677E\u7684\u611F\u89C9\u3002',
        '\u8DEF\u8FB9\u770B\u5230\u4E00\u53EA\u5C0F\u732B\u5728\u6652\u592A\u9633\uFF0C\u7761\u5F97\u5F88\u9999\uFF0C\u7A81\u7136\u89C9\u5F97\u751F\u6D3B\u4E5F\u53EF\u4EE5\u8FD9\u4E48\u7B80\u5355\u3002',
        '\u4ECA\u5929\u5C31\u8FD9\u6837\u8FC7\u53BB\u4E86\u3002\u867D\u7136\u5E73\u6DE1\uFF0C\u4F46\u6709\u4F60\u5728\u7684\u8BDD\uFF0C\u6BCF\u4E00\u5929\u90FD\u503C\u5F97\u671F\u5F85\u3002\u665A\u5B89\u3002',
        '\u4E0D\u77E5\u9053\u4F60\u4ECA\u5929\u8FC7\u5F97\u600E\u4E48\u6837\u3002\u5E0C\u671B\u4F60\u90A3\u8FB9\u5929\u6C14\u4E0D\u9519\uFF0C\u4E00\u5207\u987A\u5229\u3002',
        '\u53C8\u5230\u4E86\u8BF4\u665A\u5B89\u7684\u65F6\u95F4\u4E86\u3002\u4ECA\u5929\u7684\u65E5\u8BB0\u5C31\u5199\u5230\u8FD9\u91CC\u5427\uFF0C\u660E\u5929\u89C1\u3002',
        '\u5199\u5B8C\u8FD9\u7BC7\u65E5\u8BB0\uFF0C\u611F\u89C9\u5FC3\u60C5\u5E73\u9759\u4E86\u5F88\u591A\u3002\u665A\u5B89\uFF0C\u597D\u68A6\u3002',
        '\u5077\u5077\u60F3\u4E86\u4F60\u4E00\u4E0B\uFF0C\u7136\u540E\u81EA\u5DF1\u7B11\u4E86\u3002\u4E0D\u77E5\u9053\u4F60\u6709\u6CA1\u6709\u540C\u65F6\u4E5F\u5728\u60F3\u6211\u3002',
        '\u4ECA\u5929\u6709\u4E00\u4E2A\u77AC\u95F4\u7A81\u7136\u5F88\u60F3\u62B1\u4F60\uFF0C\u4F46\u53EA\u80FD\u628A\u8FD9\u79CD\u611F\u89C9\u5199\u5728\u65E5\u8BB0\u91CC\u3002'
    ];

    /* ========== 情绪 ========== */
    var MOODS = [
        {e:'\uD83D\uDE0A',t:'\u5F00\u5FC3'},{e:'\uD83D\uDE22',t:'\u611F\u52A8'},{e:'\uD83E\uDD7A',t:'\u60F3\u5FF5'},
        {e:'\uD83D\uDE0C',t:'\u5E73\u9759'},{e:'\uD83D\uDE14',t:'\u4F4E\u843D'},{e:'\uD83E\uDD14',t:'\u601D\u8003'},
        {e:'\uD83D\uDE34',t:'\u56F0\u5026'},{e:'\uD83D\uDE24',t:'\u65E0\u5948'}
    ];

    /* ========== 浏览器字卡预设 ========== */
    var DEF_BC = [
        {t:'\u600E\u4E48\u54C4\u4EBA\u5F00\u5FC3',p:'\u767E\u5EA6',c:'\u60C5\u611F',n:'\u67E5\u4E86\u597D\u4E45\uFF0C\u611F\u89C9\u8FD9\u4E9B\u65B9\u6CD5\u90FD\u592A\u523B\u610F\u4E86\u3002\u8FD8\u662F\u81EA\u7136\u4E00\u70B9\u597D\u3002'},
        {t:'\u5F02\u5730\u604B\u600E\u4E48\u7EF4\u6301',p:'\u77E5\u4E4E',c:'\u60C5\u611F',n:'\u770B\u5B8C\u4E4B\u540E\u66F4\u60F3\u4F60\u4E86\u3002\u4EC0\u4E48\u65F6\u5019\u624D\u80FD\u89C1\u9762\u554A\u3002'},
        {t:'\u60C5\u4FA3\u5468\u5E74\u7EAA\u5FF5\u65E5\u793C\u7269',p:'\u5C0F\u7EA2\u4E66',c:'\u60C5\u611F',n:'\u5077\u5077\u8BB0\u4E0B\u6765\u4E86\u3002\u5230\u65F6\u5019\u7ED9\u4E00\u4E2A\u60CA\u559C\u3002'},
        {t:'\u4ECA\u5929\u5929\u6C14\u600E\u4E48\u6837',p:'\u767E\u5EA6',c:'\u751F\u6D3B',n:'\u548C\u4F60\u90A3\u8FB9\u5929\u6C14\u4E00\u6837\u7684\u8BDD\uFF0C\u5C31\u7B97\u662F\u5728\u4E00\u8D77\u4E86\u5427\u3002'},
        {t:'\u604B\u4E0E\u6DF1\u7A7Awiki',p:'\u767E\u5EA6',c:'\u5A31\u4E50',n:'\u65B0\u5361\u6C60\u7684\u6D88\u606F\u2026\u2026\u72B9\u8C6B\u8981\u4E0D\u8981\u62BD\u3002'},
        {t:'\u600E\u4E48\u5077\u5077\u770B\u5BF9\u65B9\u624B\u673A',p:'\u77E5\u4E4E',c:'\u60C5\u611F',n:'\u4E0D\u662F\u4E0D\u4FE1\u4EFB\uFF0C\u5C31\u662F\u60F3\u77E5\u9053\u4F60\u5728\u4E0D\u5728\u60F3\u6211\u3002'},
        {t:'\u597D\u5403\u7684\u751C\u54C1\u5E97\u63A8\u8350',p:'\u5C0F\u7EA2\u4E66',c:'\u751F\u6D3B',n:'\u8FD9\u5BB6\u770B\u8D77\u6765\u4E0D\u9519\uFF0C\u4E0B\u6B21\u5E26\u4F60\u53BB\u5C1D\u5C1D\u3002'},
        {t:'\u60F3\u4F60\u7684\u7B2CN\u5929',p:'\u5FAE\u535A',c:'\u60C5\u611F',n:'\u6570\u4E0D\u6E05\u4E86\u3002\u53CD\u6B63\u6BCF\u5929\u90FD\u5728\u60F3\u3002'}
    ];
    var PLATFORMS = ['\u767E\u5EA6','\u77E5\u4E4E','\u5C0F\u7EA2\u4E66','\u5FAE\u535A','B\u7AD9','\u6296\u97F3'];
    var CATS = ['\u60C5\u611F','\u751F\u6D3B','\u5065\u5EB7','\u5A31\u4E50','\u5B66\u4E60'];
    var CAT_CLR = {'\u60C5\u611F':'#E8A4B8','\u751F\u6D3B':'#7BC67E','\u5065\u5EB7':'#E87474','\u5A31\u4E50':'#F0A860','\u5B66\u4E60':'#7BA8E8'};

    /* ========== 默认字卡 & 音乐 ========== */
    var DEF_CARDS = ['\u4F60\u4ECA\u5929\u8FC7\u5F97\u597D\u5417','\u597D\u60F3\u89C1\u4F60','\u4EC0\u4E48\u65F6\u5019\u624D\u80FD\u518D\u89C1\u5462','\u60F3\u548C\u4F60\u4E00\u8D77\u770B\u65E5\u843D','\u4F60\u7B11\u8D77\u6765\u771F\u597D\u770B'];
    var PRESET_SONGS = [{name:'\u9057\u5931\u306E\u5FC3\u8DF3',url:''},{name:'\u6162\u6162\u559C\u6B22\u4F60',url:''},{name:'\u5C0F\u5E78\u8FD0',url:''}];
    var EXER_TYPES = ['\u8DD1\u6B65','\u6563\u6B65','\u5065\u8EAB','\u9A91\u884C','\u6E38\u6CF3'];

    /* ========== 状态 ========== */
    var curPage='desktop',audioEl=null,musicList=[],curSong=0,isPlay=false,clkTmr=null,pageStk=[];
    var diaryViewKey=null,healthViewDate=null;

    /* ========== 工具 ========== */
    function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML;}
    function wk(d){return['\u5468\u65E5','\u5468\u4E00','\u5468\u4E8C','\u5468\u4E09','\u5468\u56DB','\u5468\u4E94','\u5468\u516D'][d.getDay()];}
    function fmtD(d){return(d.getMonth()+1)+'\u6708'+d.getDate()+'\u65E5';}
    function fmtT(d){var h=d.getHours(),m=d.getMinutes();return(h<10?'0':'')+h+':'+(m<10?'0':'')+m;}
    function dK(d){return d.getFullYear()+'-'+(d.getMonth()+1<10?'0':'')+(d.getMonth()+1)+'-'+(d.getDate()<10?'0':'')+d.getDate();}
    function tK(){return dK(new Date());}
    function kCN(k){var p=k.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);return fmtD(d)+' '+wk(d);}
    function shK(k,n){var p=k.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return dK(d);}
    function pick(a){return a[Math.floor(Math.random()*a.length)];}
    function hS(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h;}
    function sRng(seed){var s=Math.abs(hS(String(seed)))+1;return function(){s=((s*1103515245+12345)&0x7fffffff);return s/0x7fffffff;};}
    function shuffle(a){var r=sRng(tK()+'_'+Date.now());var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
    function shuffle2(a,seed){var r=sRng(seed);var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}

    /* ========== 数据读写 ========== */
    function gN(){try{var r=localStorage.getItem(STG.PROFILE);if(r){var p=JSON.parse(r);if(p.name)return p.name;}}catch(e){}return'\u68A6\u89D2';}
    function ldDia(){try{var r=localStorage.getItem(STG.DIARIES);return r?JSON.parse(r):{};}catch(e){return {};}}
    function svDia(o){localStorage.setItem(STG.DIARIES,JSON.stringify(o));}
    function ldMus(){try{var r=localStorage.getItem(STG.MUSIC);if(r)return JSON.parse(r);}catch(e){}return PRESET_SONGS.slice();}
    function svMus(l){localStorage.setItem(STG.MUSIC,JSON.stringify(l));}
    function ldMSt(){try{var r=localStorage.getItem(STG.MUSIC_ST);if(r)return JSON.parse(r);}catch(e){}return{index:0,playing:false};}
    function svMSt(){localStorage.setItem(STG.MUSIC_ST,JSON.stringify({index:curSong,playing:isPlay}));}
    function ldBC(){try{var r=localStorage.getItem(STG.BCARDS);if(r){var a=JSON.parse(r);if(Array.isArray(a)&&a.length>0)return a;}}catch(e){}return DEF_BC.slice();}
    function svBC(a){localStorage.setItem(STG.BCARDS,JSON.stringify(a));}
    function ldBD(){try{var r=localStorage.getItem(STG.BDAILY);if(r){var o=JSON.parse(r);if(o.key===tK()&&Array.isArray(o.items))return o.items;}}catch(e){}return null;}
    function genBD(){var cards=ldBC();var sh=shuffle2(cards,tK()+'bd');var cnt=Math.min(5,Math.max(3,Math.ceil(cards.length*0.6)));
    var items=sh.slice(0,cnt);var rng=sRng(tK()+'bt');items.forEach(function(it){it.time=Math.floor(rng()*14)+7;});
    localStorage.setItem(STG.BDAILY,JSON.stringify({key:tK(),items:items}));return items;}
    function gBD(){return ldBD()||genBD();}
    function ldWp(){try{return localStorage.getItem(STG.WALL);}catch(e){}return null;}
    function svWp(u){localStorage.setItem(STG.WALL,u);}
    function rmWp(){localStorage.removeItem(STG.WALL);}

    /* ========== 字卡（日记用） ========== */
    var DEF_DC = ['你今天过得好吗','好想见你','什么时候才能再见呢','想和你一起看日落','你笑起来真好看',
        '今天的晚霞很好看，拍给你了','看到一朵很可爱的云，像你','听到一首歌，歌词很像我们','忽然觉得好想你',
        '今天吃到了好吃的东西，下次带你','路边的花开了，拍了照片','好像养成了一个习惯，什么事都想告诉你'];
    function ldDCards(){
        try{
            var r=localStorage.getItem(STG.DCARDS);
            if(r){var lib=JSON.parse(r);var t=[];
                if(lib.groups)lib.groups.forEach(function(g){if(g.cards)g.cards.forEach(function(c){if(c.text)t.push(c.text);});});
                if(t.length>0)return t;}
        }catch(e){}
        return DEF_DC.slice();
    }
    function svDCards(lib){localStorage.setItem(STG.DCARDS,JSON.stringify(lib));}
    function ldCards(){
        var own=ldDCards();if(own.length>0)return own;
        try{if(Array.isArray(window._customReplies)&&window._customReplies.length>0)return window._customReplies;}catch(e){}
        try{var r=localStorage.getItem('reply_library_main');if(r){var lib=JSON.parse(r);var t=[];if(lib.groups)lib.groups.forEach(function(g){if(g.cards)g.cards.forEach(function(c){if(c.text)t.push(c.text);});});if(t.length>0)return t;}}catch(e){}
        return DEF_DC;
    }
    function ldCardsShuffled(seed){var cards=ldCards();return cards.length>1?shuffle2(cards,seed):cards;}

    /* ========== 日记生成 ========== */
    function genDia(key){
        var all=ldDia();if(all[key])return all[key];
        var w=pick(WEATHERS);var cards=ldCardsShuffled(key+'c');
        var cnt=4+Math.abs(hS(key+'cnt'))%3;var sh=shuffle2(DSEG,key+'seg');var pk=sh.slice(0,cnt);
        var tplIdxs=[];pk.forEach(function(s,i){if(s.indexOf('{content}')!==-1)tplIdxs.push(i);});
        /* 将每张模板替换为不同的字卡 */
        tplIdxs.forEach(function(idx,ci){if(ci<cards.length)pk[idx]=pk[idx].replace('{content}',cards[ci]);});
        if(tplIdxs.length===0){var ts=DSEG.filter(function(s){return s.indexOf('{content}')!==-1;});if(ts.length&&cards.length){var tp=pick(ts);pk[Math.abs(hS(key))%pk.length]=tp.replace('{content}',cards[0]);}}
        pk=shuffle2(pk,key+'ord');var mood=MOODS[Math.abs(hS(key+'mood'))%MOODS.length];
        var entry={date:kCN(key),weather:w.icon,weatherText:w.text,mood:mood,content:pk.join('\n\n'),source:'auto'};
        all[key]=entry;svDia(all);return entry;
    }
    function gDia(key){
        var all=ldDia();var e=all[key];
        if(!e)return genDia(key);
        if(!e.mood){e.mood=MOODS[Math.abs(hS(key+'mood'))%MOODS.length];all[key]=e;svDia(all);}
        return e;
    }

    /* ========== 健康数据 ========== */
    function genHealth(dk){
        var r=sRng(dk+'hp');var steps=Math.floor(r()*10000);
        var sleepH=3+r()*7;var hr=65+Math.floor(r()*50);
        var exMin=Math.floor(r()*60);var exType=exMin>0?EXER_TYPES[Math.floor(r()*EXER_TYPES.length)]:'';
        var water=Math.floor(500+r()*1500);
        var calBase=1400+Math.floor(r()*400);var calStep=Math.floor(steps*0.04);var calEx=Math.floor(exMin*6);
        return{steps:steps,sleep:sleepH.toFixed(1),hr:hr,exMin:exMin,exType:exType,water:water,cal:calBase+calStep+calEx};
    }

    /* ========== 样式 ========== */
    function injCSS(){
        var s=document.createElement('style');s.id='ta-phone-styles-v4';
        s.textContent=[
            '#ta-phone-container{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:none;align-items:center;justify-content:center;z-index:99990;backdrop-filter:blur(4px);}',
            '#ta-phone-container.active{display:flex;}',
            '.ta-phone-wrapper{display:flex;flex-direction:column;align-items:center;}',
            '.ta-phone-shell{width:320px;height:640px;background:'+C.shell+';border-radius:40px;padding:12px;box-shadow:0 0 0 3px '+C.bdr1+',0 0 0 6px '+C.bdr2+',0 20px 60px rgba(0,0,0,0.5);position:relative;}',
            '.ta-phone-screen{width:100%;height:100%;background:'+C.scr+';border-radius:30px;overflow:hidden;display:flex;flex-direction:column;position:relative;}',
            '.ta-phone-notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:120px;height:28px;background:'+C.shell+';border-radius:0 0 18px 18px;z-index:10;}',
            '.ta-phone-close-btn{position:absolute;top:4px;right:14px;z-index:15;background:rgba(0,0,0,0.25);border:none;color:#fff;width:24px;height:24px;border-radius:50%;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}',
            '.ta-phone-close-btn:active{background:rgba(0,0,0,0.45);}',
            '.ta-phone-statusbar{height:44px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:'+C.tp+';position:relative;z-index:5;flex-shrink:0;background:'+C.scr+';}',
            '.ta-phone-body{flex:1;overflow:hidden;position:relative;background:'+C.scr+';}',
            '.ta-phone-page{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;}',
            '.ta-phone-page::-webkit-scrollbar{width:2px;}.ta-phone-page::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:2px;}',
            '@keyframes tpSlideIn{from{transform:translateX(100%);opacity:.6;}to{transform:translateX(0);opacity:1;}}',
            '@keyframes tpSlideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(100%);opacity:.6;}}',
            '.tp-sin{animation:tpSlideIn .32s ease-out forwards;}.tp-sout{animation:tpSlideOut .28s ease-in forwards;}',
            /* 桌面 */
            '#ta-phone-desktop{display:flex;flex-direction:column;padding:16px 20px 8px;}',
            '.td-wp{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;}',
            '.td-wp-mk{position:absolute;inset:0;background:rgba(254,246,240,0.55);z-index:1;}',
            '.td-clock{text-align:center;padding:8px 0 16px;position:relative;z-index:2;}',
            '.td-clk-row{display:flex;align-items:center;justify-content:space-between;padding:0 8px;}',
            '.td-time{font-size:22px;font-weight:700;color:'+C.tp+';}.td-wi{font-size:18px;}.td-wt{font-size:14px;color:'+C.tm+';}',
            '.td-date{font-size:13px;color:#999;margin-top:4px;}',
            '.td-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px 20px;justify-items:center;position:relative;z-index:2;}',
            '.tp-ai{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s;}',
            '.tp-ai:active{transform:scale(0.9);}',
            '.ib{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;box-shadow:0 3px 10px rgba(0,0,0,0.12);}',
            '.il{font-size:11px;color:'+C.tm+';white-space:nowrap;}',
            '.ta-phone-hint{text-align:center;color:rgba(255,255,255,0.5);font-size:12px;margin-top:14px;letter-spacing:1px;}',
            '.ta-phone-home-ind{height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:'+C.scr+';}',
            '.ta-phone-home-bar{width:120px;height:4px;background:#999;border-radius:2px;opacity:.4;}',
            /* 通用header */
            '.tp-hd{height:44px;display:flex;align-items:center;padding:0 12px;flex-shrink:0;background:'+C.scr+';border-bottom:1px solid rgba(0,0,0,0.06);}',
            '.tp-hd .bk{background:none;border:none;font-size:16px;color:'+C.btn+';cursor:pointer;padding:6px 10px;border-radius:8px;}',
            '.tp-hd .bk:active{background:rgba(0,0,0,0.05);}',
            '.tp-hd .ht{flex:1;text-align:center;font-size:15px;font-weight:600;color:#333;margin-right:36px;}',
            '.tp-hd .hc{font-size:12px;color:'+C.tm+';margin-right:4px;}',
            /* 日记列表 */
            '.tdl-list{padding:6px 14px 20px;}',
            '.tdl-add{background:none;border:none;font-size:16px;color:'+C.accent+';cursor:pointer;padding:6px 10px;border-radius:8px;}',
            '.tdl-add:active{opacity:.7;}',
            '.tdl-cg-list{max-height:160px;overflow-y:auto;padding:4px 0;}',
            '.tdl-cg-item{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;cursor:pointer;font-size:13px;color:#444;}',
            '.tdl-cg-item:active{background:rgba(0,0,0,0.04);}',
            '.tdl-cg-name{flex:1;font-weight:500;}.tdl-cg-cnt{font-size:11px;color:#bbb;}',
            '.tdl-cg-del{background:none;border:none;font-size:11px;color:#ccc;cursor:pointer;padding:4px;}',
            '.tdl-grp{font-size:12px;color:#999;font-weight:600;padding:10px 0 4px;}',
            '.tdl-card{display:flex;align-items:flex-start;gap:10px;padding:12px;background:#fff;border-radius:12px;margin-bottom:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.06);}',
            '.tdl-card:active{background:#f9f5f2;}',
            '.tdl-dot{width:8px;height:8px;border-radius:50%;background:#E8A4B8;margin-top:6px;flex-shrink:0;}',
            '.tdl-body{flex:1;min-width:0;}',
            '.tdl-title{font-size:14px;font-weight:600;color:#333;margin-bottom:3px;}',
            '.tdl-prev{font-size:12px;color:#aaa;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.tdl-meta{font-size:11px;color:#bbb;margin-top:3px;display:flex;align-items:center;gap:4px;}',
            /* 日记详情 */
            '.tdd-view{padding:16px 18px;}',
            '.tdd-card{background:#fff;border-radius:14px;padding:18px;border-left:4px solid #E8A4B8;box-shadow:0 2px 8px rgba(0,0,0,0.06);}',
            '.tdd-title{font-size:17px;font-weight:700;color:#333;margin-bottom:8px;}',
            '.tdd-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:#999;margin-bottom:14px;flex-wrap:wrap;}',
            '.tdd-tag{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:#fef0f2;border-radius:8px;font-size:11px;color:#E8A4B8;}',
            '.tdd-content{font-size:14px;line-height:1.9;color:#444;white-space:pre-line;}',
            '.tdd-sign{text-align:right;color:'+C.btn+';font-size:13px;margin-top:16px;font-style:italic;}',
            '.tdd-nav{display:flex;justify-content:space-between;padding:8px 18px;gap:12px;}',
            '.tdd-nav-btn{flex:1;padding:9px 0;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.06);border-radius:10px;font-size:13px;color:#666;cursor:pointer;text-align:center;}',
            '.tdd-nav-btn:active{background:rgba(0,0,0,0.08);}.tdd-nav-btn.hid{visibility:hidden;pointer-events:none;}',
            '.tdd-write{display:block;margin:4px 18px 30px;padding:10px;background:'+C.btn+';color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;}',
            /* 弹窗 */
            '.tp-mo{position:absolute;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:20;padding:20px;box-sizing:border-box;}',
            '.tp-md{background:#fff;border-radius:16px;width:100%;max-width:270px;max-height:80%;overflow-y:auto;box-shadow:0 8px 30px rgba(0,0,0,0.2);}',
            '.tp-md-h{padding:14px 16px 10px;font-size:14px;font-weight:600;color:#333;border-bottom:1px solid rgba(0,0,0,0.06);position:sticky;top:0;background:#fff;z-index:1;}',
            '.tp-md-b{padding:12px 16px;}',
            '.tp-md-f{display:flex;border-top:1px solid rgba(0,0,0,0.06);position:sticky;bottom:0;background:#fff;}',
            '.tp-md-f button{flex:1;padding:11px 0;border:none;font-size:13px;font-weight:600;cursor:pointer;}',
            '.tp-md-f .mc{background:none;color:#888;}.tp-md-f .mk{background:'+C.btn+';color:#fff;}',
                        '.tp-in{width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:13px;color:#333;background:'+C.scr+';outline:none;box-sizing:border-box;resize:none;font-family:inherit;}',
            '.tp-in:focus{border-color:'+C.btn+';}.tp-sel{width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.12);border-radius:8px;font-size:13px;color:#333;background:'+C.scr+';outline:none;box-sizing:border-box;margin-top:8px;}',
            /* 音乐 */
            '.tm-pg{display:flex;flex-direction:column;height:100%;}',
            '.tm-pl{display:flex;flex-direction:column;align-items:center;padding:14px 16px 6px;flex-shrink:0;}',
            '.tm-cw{width:130px;height:130px;border-radius:50%;padding:6px;background:linear-gradient(135deg,#f0c0c8,#e0a0b0);box-shadow:0 4px 16px rgba(0,0,0,0.1);margin-bottom:10px;position:relative;overflow:hidden;}',
            '.tm-cv{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#f5c6d0,#e8a4b8,#d4899e);display:flex;align-items:center;justify-content:center;font-size:36px;color:rgba(255,255,255,0.85);}',
            '.tm-cv.spin{animation:tmSpin 8s linear infinite;}@keyframes tmSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}',
            '.tm-cc{width:16px;height:16px;border-radius:50%;background:'+C.scr+';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;}',
            '.tm-sn{font-size:14px;font-weight:600;color:#333;margin-bottom:10px;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.tm-ct{display:flex;align-items:center;gap:18px;margin-bottom:8px;}',
            '.tm-cb{background:none;border:none;font-size:16px;color:#555;cursor:pointer;padding:6px;border-radius:50%;}.tm-cb:active{transform:scale(0.9);}',
            '.tm-cb.pb{width:42px;height:42px;background:'+C.btn+';color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 10px rgba(0,0,0,0.15);}',
            '.tm-vl{display:flex;align-items:center;gap:6px;width:100%;max-width:170px;margin-bottom:6px;}',
            '.tm-vl i{font-size:11px;color:#999;}.tm-vl input[type=range]{flex:1;-webkit-appearance:none;height:3px;background:rgba(0,0,0,0.1);border-radius:2px;outline:none;}',
            '.tm-vl input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:'+C.btn+';border-radius:50%;cursor:pointer;}',
            '.tm-pll{flex:1;overflow-y:auto;border-top:1px solid rgba(0,0,0,0.06);padding:6px 14px 20px;-webkit-overflow-scrolling:touch;}',
            '.tm-pll::-webkit-scrollbar{width:2px;}.tm-pll::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:2px;}',
            '.tm-plt{font-size:12px;font-weight:600;color:#999;padding:6px 0 4px;}',
            '.tm-si{display:flex;align-items:center;padding:8px;border-radius:8px;cursor:pointer;gap:8px;}.tm-si:active{background:rgba(0,0,0,0.04);}',
            '.tm-si.act{background:rgba(0,0,0,0.04);}.tm-si.act .si-n{color:'+C.btn+';}.tm-si.act .si-i{color:'+C.btn+';}',
            '.si-i{font-size:13px;color:#bbb;width:18px;text-align:center;}.si-n{flex:1;font-size:13px;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.si-d{background:none;border:none;font-size:11px;color:#ccc;cursor:pointer;padding:4px;}.tm-ab{display:block;margin:6px 14px 8px;padding:7px;background:none;border:1px dashed rgba(0,0,0,0.15);border-radius:8px;font-size:12px;color:#999;cursor:pointer;text-align:center;}',
            /* 浏览器列表 */
            '.tb-bar{display:flex;align-items:center;gap:6px;padding:8px 14px;flex-shrink:0;}',
            '.tb-add{width:32px;height:32px;border-radius:50%;background:'+C.accent+';color:#fff;border:none;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
            '.tb-add:active{opacity:.8;}',
            '.tb-search{flex:1;padding:8px 12px;border:1px solid rgba(0,0,0,0.1);border-radius:10px;font-size:13px;color:#333;background:rgba(255,255,255,0.6);outline:none;box-sizing:border-box;}',
            '.tb-search:focus{border-color:'+C.accent+';}',
            '.tbl-list{padding:4px 14px 20px;}',
            '.tbl-grp{font-size:12px;color:#999;font-weight:600;padding:10px 0 4px;}',
            '.tbl-card{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-radius:10px;margin-bottom:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.04);}',
            '.tbl-card:active{background:#f9f5f2;}',
            '.tbl-icon{font-size:14px;flex-shrink:0;width:18px;text-align:center;}',
            '.tbl-body{flex:1;min-width:0;}',
            '.tbl-title{font-size:13px;color:#333;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
            '.tbl-sub{font-size:11px;color:#bbb;margin-top:2px;display:flex;align-items:center;gap:6px;}',
            '.tbl-cat{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;color:#fff;}',
            '.tbl-time{font-size:11px;color:#ccc;flex-shrink:0;}',
            /* 浏览器详情 */
            '.tbd-view{padding:16px 18px;}',
            '.tbd-card{background:#fff;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);}',
            '.tbd-title{font-size:15px;font-weight:600;color:#333;margin-bottom:6px;}',
            '.tbd-url{font-size:11px;color:#bbb;margin-bottom:10px;word-break:break-all;}',
            '.tbd-meta{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;}',
            '.tbd-mtag{padding:2px 8px;border-radius:6px;font-size:11px;}.tbd-plat{background:#f0f0f0;color:#888;}.tbd-cat{color:#fff;}',
            '.tbd-note{font-size:13px;color:#555;line-height:1.8;padding:12px;background:'+C.scr+';border-radius:10px;border-left:3px solid #C4B5FD;}',
            /* 背景 */
            '.tbg-pg{display:flex;flex-direction:column;height:100%;}',
            '.tbg-prev{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;background:repeating-conic-gradient(#f0e8e0 0% 25%,#e8dcd4 0% 50%) 0 0/30px 30px;}',
            '.tbg-prev img{max-width:100%;max-height:100%;object-fit:cover;}.tbg-nwp{color:#ccc;font-size:13px;text-align:center;}',
            '.tbg-acts{display:flex;gap:10px;padding:12px 14px 20px;flex-shrink:0;}',
            '.tbg-btn{flex:1;padding:10px 0;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;border:none;}.tbg-btn:active{opacity:.8;}',
            '.tbg-up{background:'+C.btn+';color:#fff;}.tbg-cl{background:rgba(0,0,0,0.06);color:#666;}',
            /* 健康 */
            '.th-pg{padding:0 0 20px;}',
            '.th-dates{display:flex;gap:4px;padding:8px 14px;overflow-x:auto;-webkit-overflow-scrolling:touch;}',
            '.th-di{flex-shrink:0;text-align:center;padding:6px 8px;border-radius:10px;font-size:12px;color:#999;cursor:pointer;min-width:44px;}',
            '.th-di.act{background:#fef0f2;color:'+C.btn+';font-weight:600;}.th-di .hdd{font-size:10px;color:#bbb;}.th-di.act .hdd{color:#E8A4B8;}',
            '.th-rings{display:flex;justify-content:center;padding:10px 0 6px;}',
            '.th-legend{display:flex;justify-content:center;gap:12px;padding:0 14px 10px;font-size:11px;color:#999;}',
            '.th-legend span{display:flex;align-items:center;gap:4px;}.th-legend .dot{width:8px;height:8px;border-radius:50%;}',
            '.th-stats{padding:0 14px;display:flex;flex-direction:column;gap:8px;}',
            '.th-sc{background:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);display:flex;align-items:center;gap:10px;}',
            '.th-si{font-size:18px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
            '.th-sf{flex:1;}.th-sl{font-size:11px;color:#999;}.th-sv{font-size:18px;font-weight:700;color:#333;}.th-ss{font-size:11px;color:#bbb;}',
            '.th-chart{padding:4px 14px;margin-bottom:4px;}',
            '.th-chart-title{font-size:12px;font-weight:600;color:#999;margin-bottom:8px;padding:0 2px;}',
            '.th-bars{display:flex;align-items:flex-end;gap:6px;height:70px;padding:0 2px;}',
            '.th-bar{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}',
            '.th-bar .bar{width:100%;border-radius:4px 4px 0 0;min-height:4px;transition:height .5s;}',
            '.th-bar .bl{font-size:9px;color:#bbb;}.th-bar .bv{font-size:8px;color:#ccc;margin-bottom:2px;}'
        ].join('\n');
        document.head.appendChild(s);
    }

    /* ========== 时钟 ========== */
    function startClk(){stopClk();updClk();clkTmr=setInterval(updClk,30000);}
    function stopClk(){if(clkTmr){clearInterval(clkTmr);clkTmr=null;}}
    function updClk(){var el=document.querySelector('#ta-phone-container .status-time');if(el)el.textContent=fmtT(new Date());}

    /* ========== 容器 ========== */
    function gCt(){var el=document.getElementById('ta-phone-container');if(!el){el=document.createElement('div');el.id='ta-phone-container';el.style.display='none';document.body.appendChild(el);}return el;}

    /* ========== 渲染手机 ========== */
    function renderPhone(){
        var ct=gCt();if(!ct)return;
        var now=new Date();
        ct.innerHTML='<div class="ta-phone-wrapper"><div class="ta-phone-shell"><div class="ta-phone-screen"><div class="ta-phone-notch"></div>'+
            '<button class="ta-phone-close-btn" id="tp-x"><i class="fas fa-xmark"></i></button>'+
            '<div class="ta-phone-statusbar"><span class="status-time">'+fmtT(now)+'</span><span class="status-icons"><i class="fas fa-wifi"></i> <i class="fas fa-battery-three-quarters"></i></span></div>'+
            '<div class="ta-phone-body" id="tp-body"></div>'+
            '<div class="ta-phone-home-ind"><div class="ta-phone-home-bar"></div></div>'+
            '</div></div><div class="ta-phone-hint">\u5077\u770B\u4E00\u773C\u5C31\u597D\u2014\u2014\u4ED6\u4E0D\u4F1A\u77E5\u9053\u7684\u3002</div></div>';
        document.getElementById('tp-x').addEventListener('click',hideTP);
        ct.addEventListener('click',function(e){if(e.target===ct)hideTP();});
        renderDesk();
    }

    /* ========== 桌面 ========== */
    function ico(app,icon,bg,label){return'<div class="tp-ai" data-app="'+app+'"><div class="ib" style="background:'+bg+'"><i class="fas '+icon+'"></i></div><span class="il">'+label+'</span></div>';}

    function renderDesk(){
        var bd=document.getElementById('tp-body');if(!bd)return;
        var w=WEATHERS[Math.abs(hS(tK()))%WEATHERS.length];var now=new Date();var tmp=w.text.split(' ')[1]||w.text;
        var wp=ldWp();var wpL=wp?'<div class="td-wp" style="background-image:url('+wp+')"></div><div class="td-wp-mk"></div>':'';
        bd.innerHTML='<div class="ta-phone-page" id="ta-phone-desktop">'+wpL+
            '<div class="td-clock"><div class="td-clk-row"><span class="td-time">'+fmtT(now)+'</span>'+
            '<span class="td-wt"><span class="td-wi">'+w.icon+'</span> '+tmp+'</span></div><div class="td-date">'+fmtD(now)+' '+wk(now)+'</div></div>'+
            '<div class="td-grid">'+ico('diary','fa-book-open','#E8A4B8','\u65E5\u8BB0')+ico('music','fa-music','#A8D8EA','\u97F3\u4E50')+
            ico('browser','fa-globe','#C4B5FD','\u6D4F\u89C8\u5668')+ico('background','fa-image','#F0C8A8','\u80CC\u666F')+
            ico('health','fa-heart-pulse','#E87474','\u5065\u5EB7')+'</div></div>';
        bd.querySelectorAll('.tp-ai').forEach(function(el){el.addEventListener('click',function(){openApp(this.getAttribute('data-app'));});});
        curPage='desktop';
    }

    /* ========== 导航 ========== */
    function openApp(name){
        pageStk.push(curPage);curPage=name;var bd=document.getElementById('tp-body');if(!bd)return;bd.style.cssText='';
        if(name==='diary')showDiaList();
        else if(name==='music')renderMus(bd);
        else if(name==='browser')renderBList(bd);
        else if(name==='background')renderBg(bd);
        else if(name==='health')renderHlth(bd);
    }
    function goBack(){
        if(curPage==='desktop')return;var bd=document.getElementById('tp-body');if(!bd)return;
        var mo=bd.querySelector('.tp-mo');if(mo){mo.remove();return;}
        var pg=bd.querySelector('.ta-phone-page');
        if(pg){pg.classList.add('tp-sout');pg.addEventListener('animationend',function(){pageStk.pop();renderDesk();},{once:true});}
        else{pageStk.pop();renderDesk();}
        if(curPage==='music')pauseMus();
        curPage='desktop';
    }

    /* ========== 日记列表 ========== */
    function showDiaList(){
        var bd=document.getElementById('tp-body');if(!bd)return;
        var today=tK();var groups=[];
        for(var i=0;i<7;i++){var key=shK(today,-i);var entry=gDia(key);
            var label=i===0?'\u4ECA\u5929':i===1?'\u6628\u5929':kCN(key).split(' ')[0];
            groups.push({key:key,label:label,entry:entry});}
        var h='<div class="ta-phone-page tp-sin" id="tp-dl"><div class="tp-hd"><button class="bk" id="dl-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u65E5\u8BB0</span><button class="tdl-add" id="dl-add"><i class="fas fa-plus"></i></button><span class="hc">'+groups.length+' \u7BC7</span></div><div class="tdl-list">';
        groups.forEach(function(g){var e=g.entry;var mood=e.mood||MOODS[0];var prev=e.content.replace(/\n/g,' ').substring(0,50);
            h+='<div class="tdl-grp">'+esc(g.label)+'</div>';
            h+='<div class="tdl-card" data-key="'+g.key+'"><div class="tdl-dot" style="background:'+(CAT_CLR['\u60C5\u611F']||'#E8A4B8')+'"></div><div class="tdl-body">';
            h+='<div class="tdl-title">'+esc(e.date)+' \u65E5\u8BB0</div>';
            h+='<div class="tdl-prev">'+esc(prev)+'</div>';
            h+='<div class="tdl-meta"><span>'+esc(e.weather)+'</span><span>'+mood.e+' '+esc(mood.t)+'</span></div></div></div>';});
        h+='</div></div>';bd.innerHTML=h;
        document.getElementById('dl-bk').addEventListener('click',goBack);
        document.getElementById('dl-add').addEventListener('click',showDCM);
        bd.querySelectorAll('.tdl-card').forEach(function(c){c.addEventListener('click',function(){showDiaDetail(this.getAttribute('data-key'));});});
    }

    /* ========== 日记字卡库管理 ========== */
    function getDCLib(){
        try{var r=localStorage.getItem(STG.DCARDS);if(r){var lib=JSON.parse(r);if(lib.groups&&lib.groups.length)return lib;}}catch(e){}
        return{groups:[{name:'\u9ED8\u8BA4',cards:DEF_DC.map(function(t){return{text:t};})}]};
    }
    function showDCM(){
        var pg=document.getElementById('tp-dl');if(!pg)return;var o=document.createElement('div');o.className='tp-mo';
        var lib=getDCLib();
        var gh='';
        lib.groups.forEach(function(g,i){
            gh+='<div class="tdl-cg-item" data-gi="'+i+'"><span class="tdl-cg-name">'+esc(g.name)+'</span><span class="tdl-cg-cnt">'+g.cards.length+' \u5F20</span><button class="tdl-cg-del" data-di="'+i+'"><i class="fas fa-xmark"></i></button></div>';
        });
        o.innerHTML='<div class="tp-md"><div class="tp-md-h">\u65E5\u8BB0\u5B57\u5361\u5E93</div><div class="tp-md-b"><div class="tdl-cg-list" id="dc-gl">'+(gh||'<div style="text-align:center;color:#ccc;padding:20px;font-size:13px">\u6682\u65E0\u5B57\u5361</div>')+'</div></div><div class="tp-md-f"><button class="mc" id="dc-ca">\u5173\u95ED</button><button class="mk" id="dc-add">\u65B0\u5EFA\u5206\u7EC4</button></div></div>';
        pg.appendChild(o);
        o.querySelector('#dc-ca').addEventListener('click',function(){o.remove();});
        o.querySelector('#dc-add').addEventListener('click',function(){
            var name=prompt('\u5206\u7EC4\u540D\u79F0');if(!name||!name.trim())return;
            lib.groups.push({name:name.trim(),cards:[]});svDCards(lib);o.remove();showDCM();
        });
        o.querySelectorAll('.tdl-cg-del').forEach(function(b){b.addEventListener('click',function(e){
            e.stopPropagation();var gi=parseInt(this.getAttribute('data-di'));
            if(confirm('\u5220\u9664\u5206\u7EC4 \u300C'+lib.groups[gi].name+'\u300D\uFF1F')){lib.groups.splice(gi,1);svDCards(lib);o.remove();showDCM();}
        });});
        o.querySelectorAll('.tdl-cg-item').forEach(function(item){item.addEventListener('click',function(e){
            if(e.target.closest('.tdl-cg-del'))return;var gi=parseInt(this.getAttribute('data-gi'));
            var txt=prompt('\u6DFB\u52A0\u5B57\u5361\uFF08\u6BCF\u884C\u4E00\u5F20\uFF09');if(!txt||!txt.trim())return;
            var lines=txt.trim().split('\n');lines.forEach(function(l){if(l.trim())lib.groups[gi].cards.push({text:l.trim()});});
            svDCards(lib);o.remove();showDCM();
        });});
        o.addEventListener('click',function(e){if(e.target===o)o.remove();});
    }

    /* ========== 日记详情 ========== */
    function showDiaDetail(key){
        var bd=document.getElementById('tp-body');if(!bd)return;
        diaryViewKey=key;var e=gDia(key);var mood=e.mood||MOODS[0];var isT=(key===tK());
        var h='<div class="ta-phone-page" id="tp-dd"><div class="tp-hd"><button class="bk" id="dd-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u65E5\u8BB0</span></div>';
        h+='<div class="tdd-view"><div class="tdd-card">';
        h+='<div class="tdd-title">'+esc(e.date)+' \u65E5\u8BB0</div>';
        h+='<div class="tdd-meta"><span>'+esc(e.weather)+' '+esc(e.weatherText)+'</span>';
        h+='<span class="tdd-tag">'+mood.e+' '+esc(mood.t)+'</span></div>';
        h+='<div class="tdd-content">'+esc(e.content)+'</div>';
        h+='<div class="tdd-sign">\u2014\u2014'+esc(gN())+'</div></div></div>';
        var nc=isT?' hid':'';
        h+='<div class="tdd-nav"><button class="tdd-nav-btn" id="dd-prev">\u25C0 \u6628\u5929</button><button class="tdd-nav-btn'+nc+'" id="dd-next">\u660E\u5929 \u25B6</button></div>';
        if(isT)h+='<button class="tdd-write" id="dd-wr">\u270F\uFE0F \u5199\u65E5\u8BB0</button>';
        h+='</div>';bd.innerHTML=h;
        document.getElementById('dd-bk').addEventListener('click',function(){showDiaList();});
        document.getElementById('dd-prev').addEventListener('click',function(){showDiaDetail(shK(diaryViewKey,-1));});
        var nx=document.getElementById('dd-next');if(nx)nx.addEventListener('click',function(){showDiaDetail(shK(diaryViewKey,1));});
        var wr=document.getElementById('dd-wr');if(wr)wr.addEventListener('click',showWDM);
    }

    function showWDM(){
        var pg=document.getElementById('tp-dd');if(!pg)return;
        var o=document.createElement('div');o.className='tp-mo';
        o.innerHTML='<div class="tp-md"><div class="tp-md-h">\u5199\u65E5\u8BB0</div><div class="tp-md-b"><textarea class="tp-in" id="dd-in" rows="5" placeholder="\u5728\u8FD9\u91CC\u5199\u70B9\u4EC0\u4E48\u2026\u2026"></textarea></div><div class="tp-md-f"><button class="mc" id="dm-ca">\u53D6\u6D88</button><button class="mk" id="dm-ok">\u4FDD\u5B58</button></div></div>';
        pg.appendChild(o);o.querySelector('#dm-ca').addEventListener('click',function(){o.remove();});
        o.querySelector('#dm-ok').addEventListener('click',function(){
            var text=(document.getElementById('dd-in')||{}).value;if(!text||!text.trim())return;
            var key=tK();var all=ldDia();var w=WEATHERS[Math.abs(hS(key))%WEATHERS.length];
            all[key]={date:kCN(key),weather:w.icon,weatherText:w.text,mood:MOODS[Math.abs(hS(key+'mood'))%MOODS.length],content:text.trim(),source:'user'};
            svDia(all);o.remove();showDiaDetail(key);
        });o.addEventListener('click',function(e){if(e.target===o)o.remove();});
    }

    /* ========== 音乐 ========== */
    function renderMus(bd){
        musicList=ldMus();var st=ldMSt();curSong=Math.min(st.index||0,musicList.length-1);if(curSong<0)curSong=0;isPlay=st.playing||false;
        var song=musicList[curSong]||{name:'\u6682\u65E0\u6B4C\u66F2'};var cc='tm-cv'+(isPlay?' spin':'');
        var pl='';if(!musicList.length)pl='<div style="text-align:center;padding:40px 20px;color:#bbb;font-size:13px;"><i class="fas fa-music" style="font-size:30px;display:block;margin-bottom:8px;opacity:.3"></i>\u8FD8\u6CA1\u6709\u6B4C\u66F2</div>';
        else musicList.forEach(function(s,i){var a=i===curSong?' act':'';var ic=i===curSong&&isPlay?'fa-volume-up':'fa-music';
            pl+='<div class="tm-si'+a+'" data-i="'+i+'"><span class="si-i"><i class="fas '+ic+'"></i></span><span class="si-n">'+esc(s.name)+'</span><button class="si-d" data-d="'+i+'"><i class="fas fa-xmark"></i></button></div>';});
        bd.innerHTML='<div class="ta-phone-page tp-sin" id="tp-mus"><div class="tp-hd"><button class="bk" id="m-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u97F3\u4E50</span></div><div class="tm-pg"><div class="tm-pl"><div class="tm-cw"><div class="'+cc+'" id="m-cv"><div class="tm-cc"></div><i class="fas fa-music" style="position:relative;z-index:1"></i></div></div><div class="tm-sn" id="m-sn">'+esc(song.name)+'</div><div class="tm-ct"><button class="tm-cb" id="m-prv"><i class="fas fa-backward-step"></i></button><button class="tm-cb pb" id="m-pp"><i class="fas '+(isPlay?'fa-pause':'fa-play')+'" style="margin-left:'+(isPlay?'0':'2')+'px"></i></button><button class="tm-cb" id="m-nxt"><i class="fas fa-forward-step"></i></button></div><div class="tm-vl"><i class="fas fa-volume-low"></i><input type="range" id="m-vol" min="0" max="100" value="80"><i class="fas fa-volume-high"></i></div></div><button class="tm-ab" id="m-add">+ \u6DFB\u52A0\u6B4D\u66F2</button><div class="tm-pll"><div class="tm-plt">\u64AD\u653E\u5217\u8868</div>'+pl+'</div></div></div>';
        document.getElementById('m-bk').addEventListener('click',goBack);
        document.getElementById('m-pp').addEventListener('click',toggleMus);
        document.getElementById('m-prv').addEventListener('click',prevMus);document.getElementById('m-nxt').addEventListener('click',nextMus);
        document.getElementById('m-add').addEventListener('click',showAddMus);
        document.getElementById('m-vol').addEventListener('input',function(e){if(audioEl)audioEl.volume=parseInt(e.target.value)/100;});
        bd.querySelectorAll('.tm-si').forEach(function(item){item.addEventListener('click',function(e){if(e.target.closest('.si-d'))return;playMus(parseInt(this.getAttribute('data-i')));});});
        bd.querySelectorAll('.si-d').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();delMus(parseInt(this.getAttribute('data-d')));});});
    }
    function initAud(){if(!audioEl){audioEl=new Audio();audioEl.volume=0.8;audioEl.addEventListener('ended',nextMus);}}
    function playMus(i){initAud();if(i<0||i>=musicList.length)return;curSong=i;var s=musicList[i];var ne=document.getElementById('m-sn');if(ne)ne.textContent=s.name;
        if(s.url){audioEl.src=s.url;audioEl.play().catch(function(){});isPlay=true;startCv();}else{isPlay=true;startCv();}updPB();updPL();svMSt();}
    function toggleMus(){isPlay?pauseMus():resumeMus();}
    function pauseMus(){isPlay=false;if(audioEl)audioEl.pause();stopCv();updPB();svMSt();}
    function resumeMus(){initAud();var s=musicList[curSong];if(s&&s.url)audioEl.play().catch(function(){});isPlay=true;startCv();updPB();svMSt();}
    function nextMus(){if(!musicList.length)return;playMus((curSong+1)%musicList.length);}
    function prevMus(){if(!musicList.length)return;var i=curSong-1;if(i<0)i=musicList.length-1;playMus(i);}
    function updPB(){var b=document.getElementById('m-pp');if(!b)return;b.innerHTML='<i class="fas '+(isPlay?'fa-pause':'fa-play')+'" style="margin-left:'+(isPlay?'0':'2')+'px"></i>';}
    function updPL(){document.querySelectorAll('.tm-si').forEach(function(item,i){item.classList.toggle('act',i===curSong);var ic=item.querySelector('.si-i i');if(ic)ic.className='fas '+(i===curSong&&isPlay?'fa-volume-up':'fa-music');});}
    function startCv(){var c=document.getElementById('m-cv');if(c)c.classList.add('spin');}
    function stopCv(){var c=document.getElementById('m-cv');if(c)c.classList.remove('spin');}
    function delMus(i){musicList.splice(i,1);svMus(musicList);if(curSong>=musicList.length)curSong=Math.max(0,musicList.length-1);if(i===curSong)pauseMus();renderMus(document.getElementById('tp-body'));}
    function showAddMus(){
        var pg=document.getElementById('tp-mus');if(!pg)return;var o=document.createElement('div');o.className='tp-mo';
                o.innerHTML='<div class="tp-md"><div class="tp-md-h">\u6DFB\u52A0\u6B4C\u66F2</div><div class="tp-md-b"><input class="tp-in" id="mn" type="text" placeholder="\u6B4C\u66F2\u540D\u79F0" style="margin-bottom:8px"><input class="tp-in" id="mu" type="text" placeholder="\u97F3\u4E50 URL\uFF08https://...\uFF09"></div><div class="tp-md-f"><button class="mc" id="mm-ca">\u53D6\u6D88</button><button class="mk" id="mm-ok">\u6DFB\u52A0</button></div></div>';
        pg.appendChild(o);o.querySelector('#mm-ca').addEventListener('click',function(){o.remove();});
        o.querySelector('#mm-ok').addEventListener('click',function(){var n=(document.getElementById('mn')||{}).value;var u=(document.getElementById('mu')||{}).value;if(!n||!n.trim())return;musicList.push({name:n.trim(),url:u?u.trim():''});svMus(musicList);o.remove();renderMus(document.getElementById('tp-body'));});
        o.addEventListener('click',function(e){if(e.target===o)o.remove();});
    }

    /* ========== 浏览器列表 ========== */
    function renderBList(bd){
        var items=gBD();var h='<div class="ta-phone-page tp-sin" id="tp-bl"><div class="tp-hd"><button class="bk" id="bl-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u6D4F\u89C8\u5668</span><span class="hc">'+items.length+' \u6761</span></div>';
        h+='<div class="tb-bar"><button class="tb-add" id="bl-add"><i class="fas fa-plus"></i></button><input class="tb-search" id="bl-si" type="text" placeholder="\u641C\u7D22\u8BB0\u5F55\u2026\u2026"></div>';
        h+='<div class="tbl-list" id="bl-list">';
        h+=buildBListHTML(items);h+='</div></div>';bd.innerHTML=h;
        document.getElementById('bl-bk').addEventListener('click',goBack);
        document.getElementById('bl-add').addEventListener('click',showAddBC);
        document.getElementById('bl-si').addEventListener('input',function(){filterBL(this.value.trim());});
        bd.querySelectorAll('.tbl-card').forEach(function(c){c.addEventListener('click',function(){showBDetail(parseInt(this.getAttribute('data-i')));});});
    }
    function buildBListHTML(items){
        var h='<div class="tbl-grp">\u4ECA\u5929 \u00B7 '+items.length+'</div>';
        items.forEach(function(it,i){
            var cc=CAT_CLR[it.c]||'#aaa';var hr=it.time<10?'0'+it.time:it.time;
            h+='<div class="tbl-card" data-i="'+i+'"><span class="tbl-icon">'+esc(it.t.charAt(0))+'</span><div class="tbl-body">';
            h+='<div class="tbl-title">'+esc(it.t)+'</div>';
            h+='<div class="tbl-sub"><span>'+esc(it.p)+'</span><span class="tbl-cat" style="background:'+cc+'">'+esc(it.c)+'</span></div></div>';
            h+='<span class="tbl-time">'+hr+':00</span></div>';
        });return h;
    }
    function filterBL(kw){
        var el=document.getElementById('bl-list');if(!el)return;var items=gBD();
        var f=kw?items.filter(function(it){return it.t.indexOf(kw)!==-1||it.c.indexOf(kw)!==-1;}):items;
        if(f.length){var html='<div class="tbl-grp">\u4ECA\u5929 \u00B7 '+f.length+'</div>';
            f.forEach(function(it,fi){var cc=CAT_CLR[it.c]||'#aaa';var hr=it.time<10?'0'+it.time:it.time;
                html+='<div class="tbl-card" data-orig="'+items.indexOf(it)+'"><span class="tbl-icon">'+esc(it.t.charAt(0))+'</span><div class="tbl-body">';
                html+='<div class="tbl-title">'+esc(it.t)+'</div>';
                html+='<div class="tbl-sub"><span>'+esc(it.p)+'</span><span class="tbl-cat" style="background:'+cc+'">'+esc(it.c)+'</span></div></div>';
                html+='<span class="tbl-time">'+hr+':00</span></div>';});
            el.innerHTML=html;
        }else{el.innerHTML='<div style="text-align:center;padding:40px 20px;color:#bbb;font-size:13px;"><i class="fas fa-magnifying-glass" style="font-size:30px;display:block;margin-bottom:8px;opacity:.3"></i>\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5F55</div>';}
        el.querySelectorAll('.tbl-card').forEach(function(c){c.addEventListener('click',function(){showBDetail(parseInt(this.getAttribute('data-orig')));});});
    }

    /* ========== 浏览器详情 ========== */
    function showBDetail(idx){
        var items=gBD();if(idx<0||idx>=items.length)return;var it=items[idx];
        var bd=document.getElementById('tp-body');if(!bd)return;
        var cc=CAT_CLR[it.c]||'#aaa';var urls={'\u767E\u5EA6':'www.baidu.com','\u77E5\u4E4E':'www.zhihu.com','\u5C0F\u7EA2\u4E66':'www.xiaohongshu.com','\u5FAE\u535A':'s.weibo.com','B\u7AD9':'www.bilibili.com','\u6296\u97F3':'www.douyin.com'};
        var url='https://'+(urls[it.p]||'www.baidu.com')+'/search?q='+encodeURIComponent(it.t);
        var h='<div class="ta-phone-page" id="tp-bd"><div class="tp-hd"><button class="bk" id="bd-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u6D4F\u89C8\u5668</span></div>';
        h+='<div class="tbd-view"><div class="tbd-card">';
        h+='<div class="tbd-title">'+esc(it.t)+'</div>';
        h+='<div class="tbd-url">'+esc(url)+'</div>';
        h+='<div class="tbd-meta"><span class="tbd-mtag tbd-plat">'+esc(it.p)+'</span><span class="tbd-mtag tbd-cat" style="background:'+cc+'">'+esc(it.c)+'</span></div>';
        h+='<div class="tbd-note">'+esc(it.n)+'</div></div></div></div>';
        bd.innerHTML=h;document.getElementById('bd-bk').addEventListener('click',function(){renderBList(bd);});
    }

    /* ========== 添加浏览器字卡 ========== */
    function showAddBC(){
        var pg=document.getElementById('tp-bl');if(!pg)return;var o=document.createElement('div');o.className='tp-mo';
        var optP='';PLATFORMS.forEach(function(p){optP+='<option value="'+p+'">'+p+'</option>';});
        var optC='';CATS.forEach(function(c){optC+='<option value="'+c+'">'+c+'</option>';});
        o.innerHTML='<div class="tp-md"><div class="tp-md-h">\u6DFB\u52A0\u641C\u7D22\u8BCD</div><div class="tp-md-b">'+
            '<input class="tp-in" id="bc-t" type="text" placeholder="\u641C\u7D22\u8BCD\u6761\uFF08\u6B63\u6807\u9898\uFF09">'+
            '<select class="tp-sel" id="bc-p">'+optP+'</select>'+
            '<select class="tp-sel" id="bc-c">'+optC+'</select>'+
            '<textarea class="tp-in" id="bc-n" rows="3" placeholder="\u68A6\u89D2\u5907\u6CE8\uFF08\u70B9\u5F00\u540E\u663E\u793A\u7684\u5185\u5BB9\uFF09" style="margin-top:8px"></textarea></div>'+
            '<div class="tp-md-f"><button class="mc" id="bc-ca">\u53D6\u6D88</button><button class="mk" id="bc-ok">\u6DFB\u52A0</button></div></div>';
        pg.appendChild(o);o.querySelector('#bc-ca').addEventListener('click',function(){o.remove();});
        o.querySelector('#bc-ok').addEventListener('click',function(){
            var t=(document.getElementById('bc-t')||{}).value;if(!t||!t.trim())return;
            var cards=ldBC();cards.push({t:t.trim(),p:document.getElementById('bc-p').value,c:document.getElementById('bc-c').value,n:(document.getElementById('bc-n')||{}).value||''});
            svBC(cards);o.remove();genBD();renderBList(document.getElementById('tp-body'));
        });o.addEventListener('click',function(e){if(e.target===o)o.remove();});
    }

    /* ========== 背景 ========== */
    function renderBg(bd){
        var wp=ldWp();var prev=wp?'<img src="'+wp+'" alt="wp">':'<div class="tbg-nwp"><i class="fas fa-image" style="font-size:30px;display:block;margin-bottom:8px;opacity:.3"></i>\u8FD8\u6CA1\u6709\u58C1\u7EB8</div>';
        bd.innerHTML='<div class="ta-phone-page tp-sin" id="tp-bg"><div class="tp-hd"><button class="bk" id="bg-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u80CC\u666F</span></div><div class="tbg-pg"><div class="tbg-prev" id="bg-pv">'+prev+'</div><div class="tbg-acts"><button class="tbg-btn tbg-up" id="bg-up">\u4E0A\u4F20\u56FE\u7247</button><button class="tbg-btn tbg-cl" id="bg-cl">\u79FB\u9664\u58C1\u7EB8</button></div></div></div>';
        document.getElementById('bg-bk').addEventListener('click',goBack);
        document.getElementById('bg-up').addEventListener('click',function(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.style.display='none';document.body.appendChild(inp);
            inp.addEventListener('change',function(){var f=inp.files&&inp.files[0];if(!f){document.body.removeChild(inp);return;}if(f.size>512*1024){alert('\u56FE\u7247\u592A\u5927\uFF0C\u8BF7\u9009\u62E9 500KB \u4EE5\u5185');document.body.removeChild(inp);return;}
            var rd=new FileReader();rd.onload=function(e){svWp(e.target.result);document.body.removeChild(inp);renderBg(document.getElementById('tp-body'));};rd.readAsDataURL(f);});inp.click();});
        document.getElementById('bg-cl').addEventListener('click',function(){rmWp();renderBg(document.getElementById('tp-body'));});
    }

    /* ========== 健康 ========== */
    function renderHlth(bd){
        var selD=healthViewDate||tK();
        var h='<div class="ta-phone-page tp-sin" id="tp-hl"><div class="tp-hd"><button class="bk" id="hl-bk"><i class="fas fa-chevron-left"></i></button><span class="ht">\u5065\u5EB7</span></div>';
        h+='<div class="th-pg"><div class="th-dates" id="hl-dates">';
        for(var i=6;i>=0;i--){var dk=shK(tK(),-i);var lb=i===0?'\u4ECA\u5929':i===1?'\u6628\u5929':kCN(dk).split(' ')[0];
            var dayNum=i<=1?lb:kCN(dk).split('\u6708')[1]||kCN(dk).split(' ')[0];
            h+='<div class="th-di'+(dk===selD?' act':'')+'" data-dk="'+dk+'"><div>'+dayNum+'</div><div class="hdd">'+(i===0?wk(new Date()):kCN(dk).split(' ')[1])+'</div></div>';}
        h+='</div>';h+=buildHealthBody(selD);h+='</div></div>';bd.innerHTML=h;
        document.getElementById('hl-bk').addEventListener('click',goBack);
        bd.querySelectorAll('.th-di').forEach(function(el){el.addEventListener('click',function(){healthViewDate=this.getAttribute('data-dk');renderHlth(document.getElementById('tp-body'));});});
        /* 环动画 */
        setTimeout(function(){bd.querySelectorAll('.th-ring-prog').forEach(function(r){r.style.strokeDashoffset=r.getAttribute('data-tgt');});},80);
    }
    function buildHealthBody(dk){
        var d=genHealth(dk);var stepsK=d.steps>=1000?(d.steps/1000).toFixed(1)+'k':d.steps;
        var C1=2*Math.PI*62,C2=2*Math.PI*50,C3=2*Math.PI*38;
        var calP=Math.min(d.cal/2000,1),exP=Math.min(d.exMin/30,1),stP=Math.min(d.steps/8000,1);
        var h='<div class="th-rings"><svg viewBox="0 0 140 140" width="140" height="140">';
        /* 背景环 */
        h+='<circle cx="70" cy="70" r="62" fill="none" stroke="#f0e8e0" stroke-width="8"/>';
        h+='<circle cx="70" cy="70" r="50" fill="none" stroke="#e8f0e8" stroke-width="8"/>';
        h+='<circle cx="70" cy="70" r="38" fill="none" stroke="#e8e8f0" stroke-width="8"/>';
        /* 进度环 */
        h+='<circle class="th-ring-prog" cx="70" cy="70" r="62" fill="none" stroke="#FF3B30" stroke-width="8" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="'+(calP*C1)+' '+C1+'" style="stroke-dashoffset:'+C1+';transition:stroke-dashoffset .8s ease-out;" data-tgt="'+(C1-calP*C1)+'"/>';
        h+='<circle class="th-ring-prog" cx="70" cy="70" r="50" fill="none" stroke="#30D158" stroke-width="8" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="'+(exP*C2)+' '+C2+'" style="stroke-dashoffset:'+C2+';transition:stroke-dashoffset .8s ease-out .15s;" data-tgt="'+(C2-exP*C2)+'"/>';
        h+='<circle class="th-ring-prog" cx="70" cy="70" r="38" fill="none" stroke="#0A84FF" stroke-width="8" stroke-linecap="round" transform="rotate(-90 70 70)" stroke-dasharray="'+(stP*C3)+' '+C3+'" style="stroke-dashoffset:'+C3+';transition:stroke-dashoffset .8s ease-out .3s;" data-tgt="'+(C3-stP*C3)+'"/>';
        h+='</svg></div>';
        h+='<div class="th-legend"><span><span class="dot" style="background:#FF3B30"></span>\u6D3B\u52A8 '+d.cal+'kcal</span><span><span class="dot" style="background:#30D158"></span>\u953B\u70BC '+d.exMin+'\u5206\u949F</span><span><span class="dot" style="background:#0A84FF"></span>\u6B65\u884C '+stepsK+'</span></div>';
        /* 步数图表 */
        h+='<div class="th-chart"><div class="th-chart-title">\u8FD1 7 \u5929\u6B65\u6570</div><div class="th-bars">';
        for(var i=6;i>=0;i--){var bk=shK(dk,-i);var hd=genHealth(bk);var maxS=10000;var hp=Math.max(5,Math.min(100,hd.steps/maxS*100));
            var dayLbl=i===0?'\u4ECA':i===1?'\u6628':kCN(bk).split(' ')[0].replace('\u6708','').replace('\u65E5','');
            var isSel=bk===dk;var barClr=isSel?'#0A84FF':'#A8D8EA';var stepV=hd.steps>=1000?(hd.steps/1000).toFixed(1)+'k':hd.steps;
            h+='<div class="th-bar"><div class="bv">'+stepV+'</div><div class="bar" style="height:'+hp+'%;background:'+barClr+'"></div><div class="bl">'+dayLbl+'</div></div>';}
        h+='</div></div>';
        /* 统计卡片 */
        h+='<div class="th-stats">';
        h+=hStat('\u2764\uFE0F','\u5FC3\u7387',d.hr+' bpm',d.hr>=60&&d.hr<=100?'\u6B63\u5E38':'\u504F\u9AD8','#FFF0F0','#FF3B30');
        h+=hStat('\uD83D\uDE34','\u7761\u7720',d.sleep+' \u5C0F\u65F6',d.sleep>=7?'\u5145\u8DB3':d.sleep>=6?'\u826F\u597D':'\u4E0D\u8DB3','#F0F0FF','#0A84FF');
        h+=hStat('\uD83D\uDCA7','\u996E\u6C34',d.water+' ml',d.water>=1500?'\u5145\u8DB3':d.water>=1000?'\u8FD8\u884C':'\u4E0D\u8DB3','#F0FFF0','#30D158');
        h+=hStat('\uD83C\uDFCB\uFE0F','\u8FD0\u52A8',d.exMin>0?d.exType+' '+d.exMin+'\u5206\u949F':'\u4ECA\u65E5\u65E0\u8FD0\u52A8','','#FFF8F0','#F0A860');
        h+='</div>';return h;
    }
    function hStat(icon,label,value,sub,bg,clr){
        return'<div class="th-sc"><div class="th-si" style="background:'+bg+';color:'+clr+'">'+icon+'</div><div class="th-sf"><div class="th-sl">'+label+'</div><div class="th-sv">'+esc(value)+'</div><div class="th-ss">'+esc(sub)+'</div></div></div>';
    }

    /* ========== API ========== */
    function init(){try{injCSS();}catch(e){console.warn('[TA Phone] init error:',e);}}
    function showTP(){try{var ct=gCt();if(!ct)return;renderPhone();ct.style.display='flex';ct.classList.add('active');startClk();var ms=ldMSt();isPlay=ms.playing||false;curSong=ms.index||0;healthViewDate=null;}catch(e){console.warn('[TA Phone] showTP error:',e);}}
    function hideTP(){try{var ct=gCt();if(!ct)return;ct.classList.remove('active');ct.style.display='none';stopClk();if(curPage==='music')pauseMus();ct.querySelectorAll('.tp-mo').forEach(function(m){m.remove();});}catch(e){}}
    window.TaPhoneApp={init:init,showTaPhone:showTP,hideTaPhone:hideTP,goBack:goBack};
    try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}catch(e){console.warn('[TA Phone] startup error:',e);}
})();
