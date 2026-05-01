import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: "../../.env" });
config({ path: "../../.env.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { slug: "all", name: "全部", sortOrder: 0 },
  { slug: "romance", name: "甜宠", sortOrder: 1 },
  { slug: "revenge", name: "逆袭", sortOrder: 2 },
  { slug: "ceo", name: "霸总", sortOrder: 3 },
  { slug: "rebirth", name: "重生", sortOrder: 4 },
  { slug: "hidden-marriage", name: "豪门", sortOrder: 5 },
  { slug: "ancient", name: "古装", sortOrder: 6 },
  { slug: "fantasy", name: "玄幻", sortOrder: 7 },
];

const TAGS = ["甜宠", "逆袭", "霸总", "豪门", "都市", "古装", "重生", "穿越", "废柴", "战神"];

async function main() {
  console.log("seeding categories...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: c,
    });
  }

  console.log("seeding tags...");
  for (const name of TAGS) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { slug: name, name },
    });
  }

  console.log("seeding feed slots...");
  for (const slot of [
    { key: "home_banner", name: "首页 Banner", position: "banner" },
    { key: "home_recommend", name: "首页推荐流", position: "section" },
    { key: "home_hot_section", name: "热播榜", position: "section" },
    { key: "home_new_section", name: "新剧上线", position: "section" },
  ]) {
    await prisma.feedSlot.upsert({
      where: { key: slot.key },
      update: { name: slot.name, position: slot.position },
      create: slot,
    });
  }

  console.log("seeding leaderboards...");
  for (const lb of [
    { key: "hot", name: "热播榜" },
    { key: "new", name: "新剧榜" },
    { key: "follow", name: "追剧榜" },
    { key: "vip", name: "VIP 专区" },
  ]) {
    await prisma.leaderboard.upsert({
      where: { key: lb.key },
      update: { name: lb.name },
      create: lb,
    });
  }

  console.log("seeding VIP plans...");
  for (const p of [
    { slug: "monthly", name: "月度会员", durationDays: 30, priceCents: 1900, bonusCoins: 100, sortOrder: 1 },
    { slug: "quarterly", name: "季度会员", durationDays: 90, priceCents: 4900, bonusCoins: 400, sortOrder: 2 },
    { slug: "yearly", name: "年度会员", durationDays: 365, priceCents: 14900, bonusCoins: 2000, sortOrder: 3 },
  ]) {
    await prisma.vipPlan.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log("seeding coin packs...");
  for (const p of [
    { slug: "coin-30", name: "30 金币", coins: 30, priceCents: 600, sortOrder: 1 },
    { slug: "coin-100", name: "100 金币", coins: 100, bonusCoins: 10, priceCents: 1900, sortOrder: 2 },
    { slug: "coin-500", name: "500 金币", coins: 500, bonusCoins: 80, priceCents: 8800, sortOrder: 3 },
    { slug: "coin-1000", name: "1000 金币", coins: 1000, bonusCoins: 200, priceCents: 16800, sortOrder: 4 },
  ]) {
    await prisma.coinPack.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  console.log("seeding ad slots...");
  for (const s of [
    { key: "rewarded_unlock", name: "广告解锁", type: "REWARDED" as const },
    { key: "splash", name: "开屏广告", type: "SPLASH" as const },
    { key: "feed", name: "信息流广告", type: "IN_FEED" as const },
  ]) {
    await prisma.adSlot.upsert({
      where: { key: s.key },
      update: { name: s.name, type: s.type },
      create: s,
    });
  }

  console.log("done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
