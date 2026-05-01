export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
  total?: number;
};

export type DanmakuMessage = {
  id: string;
  episodeId: string;
  userId: string;
  timeMs: number;
  text: string;
  color: string;
  fontSize: number;
  mode: "SCROLL" | "TOP" | "BOTTOM";
};

export type FeedItem = {
  id: string;
  drama: {
    id: string;
    title: string;
    cover: string | null;
    poster: string | null;
    description: string | null;
    isVip: boolean;
    rating: number;
    playCount: number;
    totalEpisodes: number;
  };
  trailerUrl: string | null;
  firstEpisodeId: string | null;
};

export type WatchPayload = {
  drama: {
    id: string;
    title: string;
    description: string | null;
    cover: string | null;
    isVip: boolean;
    freeEpisodes: number;
    unlockCoins: number;
    totalEpisodes: number;
    likeCount: number;
    favoriteCount: number;
    liked: boolean;
    favorited: boolean;
    followed: boolean;
  };
  episode: {
    id: string;
    index: number;
    title: string;
    duration: number;
    isFree: boolean;
    locked: boolean;
    hlsUrl: string | null;
    posterUrl: string | null;
  };
  positionMs: number;
  episodes: Array<{
    id: string;
    index: number;
    title: string;
    isFree: boolean;
    locked: boolean;
  }>;
};
