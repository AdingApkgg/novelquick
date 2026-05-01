export const APP = {
  name: "NovelQuick",
  cnName: "短剧速看",
  description: "竖屏短剧 / 沉浸式播放 / 海量精品剧集",
  version: "0.1.0",
} as const;

export const FEED_KEYS = {
  HOME_BANNER: "home_banner",
  HOME_RECOMMEND: "home_recommend",
  HOME_HOT: "home_hot_section",
  HOME_NEW: "home_new_section",
} as const;

export const LEADERBOARD_KEYS = {
  HOT: "hot",
  NEW: "new",
  FOLLOW: "follow",
  VIP: "vip",
} as const;

export const PAGE_SIZE = {
  DEFAULT: 20,
  FEED: 10,
  COMMENT: 20,
  DANMAKU: 200,
  EPISODE: 50,
} as const;

export const VIDEO_VARIANTS = [
  { name: "360p", width: 640, height: 360, bitrate: 600 },
  { name: "540p", width: 960, height: 540, bitrate: 1200 },
  { name: "720p", width: 1280, height: 720, bitrate: 2400 },
  { name: "1080p", width: 1920, height: 1080, bitrate: 4800 },
] as const;

export const COIN_DEFAULTS = {
  PER_EPISODE: 10,
  AD_REWARD: 5,
  CHECK_IN: 2,
} as const;

export const PLAYER = {
  PROGRESS_REPORT_MS: 5000,
  AUTO_NEXT_THRESHOLD_MS: 1500,
  PRELOAD_NEXT_AT_PROGRESS: 0.6,
} as const;

export const ROUTES = {
  home: "/",
  recommend: "/",
  follow: "/follow",
  category: (slug: string) => `/c/${slug}`,
  drama: (id: string) => `/d/${id}`,
  watch: (dramaId: string, ep?: number) => (ep ? `/watch/${dramaId}/${ep}` : `/watch/${dramaId}`),
  search: "/search",
  history: "/me/history",
  profile: "/me",
  vip: "/vip",
  coin: "/me/coin",
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;
