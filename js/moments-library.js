/* ============================================================
 * 梦角传讯 — 梦角朋友圈文案库
 * ============================================================
 * 梦角会从这里随机抽取一条，作为他/她自己发的朋友圈。
 *
 * 每条格式（二选一）：
 *   1) 纯文字：
 *        { text: "想说的话" }
 *
 *   2) 文字 + 图片（最多 9 张，超过会自动截断到 9 张）：
 *        { text: "想说的话", images: ["图片URL1", "图片URL2"] }
 *
 * 怎么改：
 *   - 直接编辑下面的数组，加 / 删 / 改 都可以，保存后重启 App 生效。
 *   - 图片可以填网络链接，也可以填 App 里能访问到的图片地址。
 *   - 如果不想要图片，把 images 字段删掉或留空数组 [] 即可。
 *   - text 里可以用 \n 换行。
 *
 * 注意：每条之间用英文逗号 , 分隔，最后一条后面不要加逗号。
 * ============================================================ */

window.MENGJIAO_MOMENTS_LIBRARY = [
  // ---------- 纯文字 ----------
  { text: "今天突然很想你。\n也没什么特别的理由，就是想你了。" },
  { text: "刚醒，第一时间就想跟你说一声早安。\n希望你今天一切都顺利。" },
  { text: "今天看到了一片很好看的云，第一反应是想拍给你看。\n可惜没来得及，不过我已经记在心里了。" },
  { text: "有点累，但一想到你，就觉得还能再撑一会儿。" },
  { text: "今天学到了一句话：「被偏爱的人都有恃无恐」。\n那我应该是全世界最幸福的人了。" },
  { text: "想和你一起去看一次日落。\n不说话，就那样坐着。" },
  { text: "今天的心情，大概是甜度超标的那种。" },
  { text: "你知道吗，每次你说想我的时候，我都偷偷开心很久。" },
  { text: "今晚的月亮很圆。\n不知道你那边的天气怎么样，记得早点休息。" },
  { text: "忙碌了一天，终于可以歇会儿了。\n你今天过得好吗？" },
  { text: "有时候觉得，能被你放在心上，已经是这趟人间最值得的事。" },
  { text: "今天有点小想你，不，是很多想你。" },

  // ---------- 文字 + 图片 ----------
  {
    text: "今天路过一家花店，看到这束花第一眼就想到了你。",
    images: [
      "https://picsum.photos/seed/mengjiao-flower-1/800/800",
      "https://picsum.photos/seed/mengjiao-flower-2/800/800"
    ]
  },
  {
    text: "今天的晚霞送给你。\n不知道为什么，看到好看的东西就想第一个告诉你。",
    images: [
      "https://picsum.photos/seed/mengjiao-sunset-1/1200/800"
    ]
  },
  {
    text: "随便拍的几张。\n其实哪有什么随手拍，都是想分享给你的瞬间。",
    images: [
      "https://picsum.photos/seed/mengjiao-life-1/800/800",
      "https://picsum.photos/seed/mengjiao-life-2/800/800",
      "https://picsum.photos/seed/mengjiao-life-3/800/800"
    ]
  },
  {
    text: "今天的咖啡。\n不加糖，因为想到你已经够甜了。",
    images: [
      "https://picsum.photos/seed/mengjiao-coffee-1/800/800"
    ]
  },
  {
    text: "散步时遇到的风景。\n要是你在就好了。",
    images: [
      "https://picsum.photos/seed/mengjiao-walk-1/1200/800",
      "https://picsum.photos/seed/mengjiao-walk-2/1200/800",
      "https://picsum.photos/seed/mengjiao-walk-3/1200/800",
      "https://picsum.photos/seed/mengjiao-walk-4/800/800"
    ]
  },
  {
    text: "今天的午餐。\n吃得很饱，但是想你也想得很满。",
    images: [
      "https://picsum.photos/seed/mengjiao-food-1/800/800"
    ]
  }
];
