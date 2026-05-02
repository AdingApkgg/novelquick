/**
 * Test seed: populate the catalog with realistic short-drama data.
 * Idempotent — safe to re-run; existing test dramas (slug starts with `test-`)
 * get cleaned up first.
 *
 *   pnpm db:seed:test
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: "../../.env" });
config({ path: "../../.env.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// A handful of free public HLS streams so the player has *something* to play.
const SAMPLE_HLS = [
  "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Big Buck Bunny (12min)
  "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
];

const COVER_W = 720;
const COVER_H = 1080;
const POSTER_W = 1280;
const POSTER_H = 1920;

function cover(seed: string) {
  return `https://picsum.photos/seed/nq-${seed}/${COVER_W}/${COVER_H}`;
}
function poster(seed: string) {
  return `https://picsum.photos/seed/nq-${seed}-p/${POSTER_W}/${POSTER_H}`;
}
function banner(seed: string) {
  return `https://picsum.photos/seed/nq-${seed}-b/1600/900`;
}

const DRAMAS: Array<{
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  categorySlugs: string[];
  tagNames: string[];
  isVip: boolean;
  freeEpisodes: number;
  unlockCoins: number;
  totalEpisodes: number;
  rating: number;
  playCount: number;
  likeCount: number;
  favoriteCount: number;
  sortWeight: number;
  releaseStatus: "ONGOING" | "COMPLETED";
  trailer?: string;
}> = [
  {
    slug: "test-rebirth-tycoon",
    title: "重生归来当首富",
    subtitle: "回到 2008，他要把整个时代攥进手心",
    description:
      "一场意外，让落魄中年陈鹏带着前世记忆回到 2008 年。这一次，他要踩着风口逆袭，让所有看不起他的人都仰望他的存在。",
    categorySlugs: ["rebirth", "revenge"],
    tagNames: ["重生", "逆袭", "都市", "战神"],
    isVip: true,
    freeEpisodes: 5,
    unlockCoins: 12,
    totalEpisodes: 30,
    rating: 9.4,
    playCount: 28_900_000,
    likeCount: 412_000,
    favoriteCount: 196_000,
    sortWeight: 100,
    releaseStatus: "COMPLETED",
    trailer: SAMPLE_HLS[0],
  },
  {
    slug: "test-ceo-contract-bride",
    title: "霸道总裁的契约新娘",
    subtitle: "三年契约，他对她始终若即若离",
    description:
      "为给奶奶治病，林晚晚签下了与帝国总裁顾沉舟的婚姻契约。三年后契约到期，她却怀了他的孩子，悄然消失……",
    categorySlugs: ["ceo", "romance"],
    tagNames: ["霸总", "甜宠", "豪门"],
    isVip: true,
    freeEpisodes: 3,
    unlockCoins: 10,
    totalEpisodes: 36,
    rating: 9.1,
    playCount: 41_200_000,
    likeCount: 538_000,
    favoriteCount: 312_000,
    sortWeight: 95,
    releaseStatus: "COMPLETED",
    trailer: SAMPLE_HLS[1],
  },
  {
    slug: "test-counterattack-life",
    title: "我的逆袭人生",
    subtitle: "曾被全公司嘲笑的废物，今天要把所有羞辱奉还",
    description:
      "三年前他被未婚妻当众羞辱，三年后顶级豪门继承人身份归来。当年所有看不起他的人，现在跪求合作。",
    categorySlugs: ["revenge"],
    tagNames: ["逆袭", "都市", "战神"],
    isVip: false,
    freeEpisodes: 30,
    unlockCoins: 0,
    totalEpisodes: 30,
    rating: 8.9,
    playCount: 18_700_000,
    likeCount: 286_000,
    favoriteCount: 134_000,
    sortWeight: 88,
    releaseStatus: "COMPLETED",
  },
  {
    slug: "test-war-god-return",
    title: "战神归来",
    subtitle: "九年戍边，归来时已是天下第一",
    description:
      "九年前他奉命戍守边境，归来时发现妻子被欺、女儿受辱。这一次，他要让所有人都记住——战神之名，不容亵渎。",
    categorySlugs: ["revenge"],
    tagNames: ["战神", "逆袭", "都市"],
    isVip: true,
    freeEpisodes: 4,
    unlockCoins: 15,
    totalEpisodes: 50,
    rating: 9.2,
    playCount: 36_800_000,
    likeCount: 478_000,
    favoriteCount: 220_000,
    sortWeight: 92,
    releaseStatus: "COMPLETED",
    trailer: SAMPLE_HLS[2],
  },
  {
    slug: "test-useless-miss",
    title: "废柴小姐请自重",
    subtitle: "穿越成废柴的她，凭一手医术艳压三国",
    description:
      "现代神医苏倾魂穿千年，醒来成了相府人人厌弃的废物三小姐。可那些欺她辱她的人不知道，她随手一针就能让人生死两难。",
    categorySlugs: ["ancient", "fantasy"],
    tagNames: ["古装", "穿越", "废柴", "重生"],
    isVip: true,
    freeEpisodes: 6,
    unlockCoins: 8,
    totalEpisodes: 42,
    rating: 8.7,
    playCount: 22_400_000,
    likeCount: 318_000,
    favoriteCount: 175_000,
    sortWeight: 80,
    releaseStatus: "ONGOING",
  },
  {
    slug: "test-luxury-wife",
    title: "我的天价老婆",
    subtitle: "他以为娶了个普通秘书，没想到是隐藏首富",
    description:
      "为完成爷爷遗愿，普通职员叶辰娶了陌生女子苏雨晴。他以为只是普通婚姻，直到发现妻子的真实身份——夏国第一豪门唯一继承人。",
    categorySlugs: ["ceo", "hidden-marriage"],
    tagNames: ["甜宠", "霸总", "都市"],
    isVip: true,
    freeEpisodes: 5,
    unlockCoins: 10,
    totalEpisodes: 40,
    rating: 8.8,
    playCount: 31_500_000,
    likeCount: 392_000,
    favoriteCount: 188_000,
    sortWeight: 85,
    releaseStatus: "COMPLETED",
  },
  {
    slug: "test-back-to-1985",
    title: "重回1985",
    subtitle: "回到改革开放黎明，他要做这个时代的弄潮儿",
    description:
      "金融大佬一觉醒来回到 1985 年的国营纺织厂。下海、办厂、抢风口，前世的记忆是他最强的武器。",
    categorySlugs: ["rebirth"],
    tagNames: ["重生", "逆袭"],
    isVip: false,
    freeEpisodes: 50,
    unlockCoins: 0,
    totalEpisodes: 50,
    rating: 9.0,
    playCount: 14_300_000,
    likeCount: 198_000,
    favoriteCount: 89_000,
    sortWeight: 70,
    releaseStatus: "COMPLETED",
  },
  {
    slug: "test-overnight-star",
    title: "一夜爆红",
    subtitle: "她只是想还债，没想到一夜成了顶流",
    description:
      "酒吧驻唱林夏夏为还家里的债，无意间一段视频火遍全网。当资本和真心同时来敲门，她该如何选择？",
    categorySlugs: ["romance"],
    tagNames: ["甜宠", "都市"],
    isVip: false,
    freeEpisodes: 24,
    unlockCoins: 0,
    totalEpisodes: 24,
    rating: 8.4,
    playCount: 9_800_000,
    likeCount: 145_000,
    favoriteCount: 62_000,
    sortWeight: 60,
    releaseStatus: "ONGOING",
  },
  {
    slug: "test-grand-merchant",
    title: "盛世锦商",
    subtitle: "她从乡野走到京城，靠的不是脸是脑子",
    description:
      "孤女沈锦凭一手刺绣手艺白手起家，开商行、斗世家、入皇商。在重男轻女的时代，她要把「商」字写到极致。",
    categorySlugs: ["ancient"],
    tagNames: ["古装", "逆袭"],
    isVip: true,
    freeEpisodes: 3,
    unlockCoins: 12,
    totalEpisodes: 38,
    rating: 8.6,
    playCount: 12_700_000,
    likeCount: 167_000,
    favoriteCount: 78_000,
    sortWeight: 65,
    releaseStatus: "ONGOING",
  },
  {
    slug: "test-missing-ceo",
    title: "失踪的女总裁",
    subtitle: "她消失了三年，再回来时整个商界都在颤抖",
    description:
      "三年前的一场车祸让顶尖女总裁苏沐然人间蒸发。三年后她带着双胞胎归来，曾经背叛她的人，一个都跑不掉。",
    categorySlugs: ["revenge", "ceo"],
    tagNames: ["逆袭", "都市", "霸总"],
    isVip: true,
    freeEpisodes: 4,
    unlockCoins: 12,
    totalEpisodes: 32,
    rating: 9.3,
    playCount: 25_600_000,
    likeCount: 354_000,
    favoriteCount: 178_000,
    sortWeight: 90,
    releaseStatus: "ONGOING",
  },
  {
    slug: "test-hidden-wife",
    title: "首席的隐婚妻",
    subtitle: "签了五年的隐婚协议，她竟动了真情",
    description:
      "为给弟弟治病，江雪签下了与神秘首席陆景深的隐婚协议。可名义上的丈夫却比她想象的更危险、更深情……",
    categorySlugs: ["hidden-marriage", "ceo"],
    tagNames: ["豪门", "甜宠", "霸总"],
    isVip: true,
    freeEpisodes: 5,
    unlockCoins: 10,
    totalEpisodes: 36,
    rating: 8.5,
    playCount: 19_200_000,
    likeCount: 251_000,
    favoriteCount: 116_000,
    sortWeight: 75,
    releaseStatus: "COMPLETED",
  },
  {
    slug: "test-mansion-mistress",
    title: "豪门第一夫人",
    subtitle: "她是被退婚的弃女，转头嫁给了他更可怕的哥哥",
    description:
      "顾家为了利益强迫退婚，许念顺势嫁给了顾家长兄——传闻中冷血又病弱的顾彻。结果发现这个「病弱大伯」才是真正的隐藏 boss。",
    categorySlugs: ["hidden-marriage", "romance"],
    tagNames: ["豪门", "甜宠"],
    isVip: false,
    freeEpisodes: 28,
    unlockCoins: 0,
    totalEpisodes: 28,
    rating: 8.3,
    playCount: 8_900_000,
    likeCount: 124_000,
    favoriteCount: 56_000,
    sortWeight: 55,
    releaseStatus: "COMPLETED",
  },
];

const EPISODE_TITLES = [
  "重生归来",
  "意外发生",
  "复仇序章",
  "初次交锋",
  "暗流涌动",
  "真相浮现",
  "情起波澜",
  "敌友难辨",
  "暗夜风起",
  "心潮涌动",
  "惊天逆转",
  "情深难却",
  "豪门暗战",
  "破局而出",
  "尘埃落定",
  "新的起点",
  "真情流露",
  "雷霆反击",
  "权谋之争",
  "心之所向",
  "惊鸿一瞥",
  "命运交错",
  "强势归来",
  "一战成名",
  "情劫难逃",
  "暗潮汹涌",
  "雪落无声",
  "光明在前",
  "终极对决",
  "完美收官",
];

async function clearTestData() {
  console.log("[seed-test] cleaning previous test data...");
  // Episodes/assets/jobs are cascaded by Drama deletion
  await prisma.drama.deleteMany({ where: { slug: { startsWith: "test-" } } });
  await prisma.feedSlotItem.deleteMany({
    where: { slot: { key: { in: ["home_banner", "home_recommend", "home_hot_section", "home_new_section"] } } },
  });
  await prisma.leaderboardItem.deleteMany({});
}

async function ensureCategoriesAndTags() {
  // The base seed (`pnpm db:seed`) already creates the canonical set.
  // Ensure they exist regardless so this script is standalone.
  const cats = [
    { slug: "all", name: "全部", sortOrder: 0 },
    { slug: "romance", name: "甜宠", sortOrder: 1 },
    { slug: "revenge", name: "逆袭", sortOrder: 2 },
    { slug: "ceo", name: "霸总", sortOrder: 3 },
    { slug: "rebirth", name: "重生", sortOrder: 4 },
    { slug: "hidden-marriage", name: "豪门", sortOrder: 5 },
    { slug: "ancient", name: "古装", sortOrder: 6 },
    { slug: "fantasy", name: "玄幻", sortOrder: 7 },
  ];
  for (const c of cats) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name }, create: c });
  }
  const tags = ["甜宠", "逆袭", "霸总", "豪门", "都市", "古装", "重生", "穿越", "废柴", "战神"];
  for (const name of tags) {
    await prisma.tag.upsert({ where: { slug: name }, update: {}, create: { slug: name, name } });
  }
}

async function seedDramas() {
  console.log("[seed-test] inserting dramas...");
  for (const d of DRAMAS) {
    const cats = await prisma.category.findMany({ where: { slug: { in: d.categorySlugs } } });
    const tags = await prisma.tag.findMany({ where: { slug: { in: d.tagNames } } });

    const drama = await prisma.drama.create({
      data: {
        slug: d.slug,
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        cover: cover(d.slug),
        poster: poster(d.slug),
        trailerUrl: d.trailer ?? null,
        status: "PUBLISHED",
        releaseStatus: d.releaseStatus,
        region: "中国大陆",
        language: "中文",
        year: 2024,
        totalEpisodes: d.totalEpisodes,
        isVip: d.isVip,
        freeEpisodes: d.freeEpisodes,
        unlockCoins: d.unlockCoins,
        rating: d.rating,
        ratingCount: Math.floor(d.playCount / 200),
        playCount: BigInt(d.playCount),
        likeCount: d.likeCount,
        favoriteCount: d.favoriteCount,
        sortWeight: d.sortWeight,
        publishedAt: new Date(Date.now() - Math.random() * 60 * 86400 * 1000),
        categories: { create: cats.map((c) => ({ categoryId: c.id })) },
        tags: { create: tags.map((t) => ({ tagId: t.id })) },
      },
    });

    // Episodes
    const epData = Array.from({ length: d.totalEpisodes }).map((_, i) => {
      const idx = i + 1;
      const isFree = idx <= d.freeEpisodes;
      // mark first 3 as READY with a sample HLS so the watch page actually plays
      const isReady = idx <= 3;
      return {
        dramaId: drama.id,
        index: idx,
        title: `第${idx}集 · ${EPISODE_TITLES[i % EPISODE_TITLES.length]}`,
        description: null,
        duration: 90 + Math.floor(Math.random() * 90), // 90-180 sec for short drama
        coverUrl: drama.cover,
        status: isReady ? ("READY" as const) : ("DRAFT" as const),
        isFree,
        unlockCoins: isFree ? 0 : d.unlockCoins,
        playCount: BigInt(Math.floor((d.playCount / d.totalEpisodes) * (1 - i * 0.012))),
        publishedAt: isReady ? new Date() : null,
      };
    });
    await prisma.episode.createMany({ data: epData });

    // For READY episodes, attach a fake HLS asset so the player works
    const readyEps = await prisma.episode.findMany({
      where: { dramaId: drama.id, status: "READY" },
      select: { id: true, index: true },
      orderBy: { index: "asc" },
    });
    for (const ep of readyEps) {
      const url = SAMPLE_HLS[ep.index % SAMPLE_HLS.length] ?? SAMPLE_HLS[0]!;
      await prisma.videoAsset.create({
        data: {
          episodeId: ep.id,
          kind: "HLS_MASTER",
          url,
          width: 1280,
          height: 720,
          durationMs: 1000 * (90 + Math.floor(Math.random() * 60)),
        },
      });
    }

    console.log(`  · ${d.title} (${d.totalEpisodes} eps, 3 ready)`);
  }
}

async function fillFeedSlots() {
  console.log("[seed-test] populating feed slots...");
  const dramas = await prisma.drama.findMany({
    where: { slug: { startsWith: "test-" } },
    orderBy: { sortWeight: "desc" },
  });

  // Banner: top 4 by sort weight
  const bannerSlot = await prisma.feedSlot.findUnique({ where: { key: "home_banner" } });
  if (bannerSlot) {
    for (let i = 0; i < Math.min(4, dramas.length); i++) {
      const d = dramas[i]!;
      await prisma.feedSlotItem.create({
        data: {
          slotId: bannerSlot.id,
          dramaId: d.id,
          bannerImg: banner(d.slug),
          title: d.title,
          sortOrder: i,
        },
      });
    }
  }

  // Recommend: 8 random
  const recommendSlot = await prisma.feedSlot.findUnique({ where: { key: "home_recommend" } });
  if (recommendSlot) {
    const picks = [...dramas].sort(() => Math.random() - 0.5).slice(0, 8);
    for (let i = 0; i < picks.length; i++) {
      await prisma.feedSlotItem.create({
        data: { slotId: recommendSlot.id, dramaId: picks[i]!.id, sortOrder: i },
      });
    }
  }

  // Hot: top 6 by playCount
  const hotSlot = await prisma.feedSlot.findUnique({ where: { key: "home_hot_section" } });
  if (hotSlot) {
    const top = [...dramas].sort((a, b) => Number(b.playCount) - Number(a.playCount)).slice(0, 6);
    for (let i = 0; i < top.length; i++) {
      await prisma.feedSlotItem.create({
        data: { slotId: hotSlot.id, dramaId: top[i]!.id, sortOrder: i },
      });
    }
  }

  // New: ongoing first
  const newSlot = await prisma.feedSlot.findUnique({ where: { key: "home_new_section" } });
  if (newSlot) {
    const fresh = dramas.filter((d) => d.releaseStatus === "ONGOING").slice(0, 6);
    for (let i = 0; i < fresh.length; i++) {
      await prisma.feedSlotItem.create({
        data: { slotId: newSlot.id, dramaId: fresh[i]!.id, sortOrder: i },
      });
    }
  }
}

async function rebuildLeaderboards() {
  console.log("[seed-test] rebuilding leaderboards...");
  const dramas = await prisma.drama.findMany({
    where: { status: "PUBLISHED" },
  });

  for (const [key, sortFn, scoreFn] of [
    ["hot", (a: any, b: any) => Number(b.playCount) - Number(a.playCount), (d: any) => Number(d.playCount)],
    ["new", (a: any, b: any) => +b.publishedAt - +a.publishedAt, (_d: any, i: number, len: number) => len - i],
    ["follow", (a: any, b: any) => b.favoriteCount - a.favoriteCount, (d: any) => d.favoriteCount],
    ["vip", (a: any, b: any) => Number(b.playCount) - Number(a.playCount), (d: any) => Number(d.playCount)],
  ] as const) {
    const lb = await prisma.leaderboard.findUnique({ where: { key } });
    if (!lb) continue;
    const list =
      key === "vip"
        ? dramas.filter((d) => d.isVip).sort(sortFn)
        : [...dramas].sort(sortFn);
    const top = list.slice(0, 30);
    for (let i = 0; i < top.length; i++) {
      const d = top[i]!;
      await prisma.leaderboardItem.create({
        data: {
          leaderboardId: lb.id,
          dramaId: d.id,
          rank: i + 1,
          score: scoreFn(d, i, top.length),
        },
      });
    }
    await prisma.leaderboard.update({ where: { id: lb.id }, data: { refreshedAt: new Date() } });
  }
}

async function main() {
  await ensureCategoriesAndTags();
  await clearTestData();
  await seedDramas();
  await fillFeedSlots();
  await rebuildLeaderboards();

  const total = await prisma.drama.count({ where: { slug: { startsWith: "test-" } } });
  const eps = await prisma.episode.count({
    where: { drama: { slug: { startsWith: "test-" } } },
  });
  const ready = await prisma.episode.count({
    where: { drama: { slug: { startsWith: "test-" } }, status: "READY" },
  });
  console.log(`\n[seed-test] done. ${total} dramas · ${eps} episodes (${ready} playable).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
