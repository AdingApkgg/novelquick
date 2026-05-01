import { router } from "../trpc";
import { feedRouter } from "./feed";
import { dramaRouter } from "./drama";
import { episodeRouter } from "./episode";
import { commentRouter } from "./comment";
import { danmakuRouter } from "./danmaku";
import { interactRouter } from "./interact";
import { historyRouter } from "./history";
import { meRouter } from "./me";
import { searchRouter } from "./search";
import { billingRouter } from "./billing";
import { adminRouter } from "./admin/index";

export const appRouter = router({
  feed: feedRouter,
  drama: dramaRouter,
  episode: episodeRouter,
  comment: commentRouter,
  danmaku: danmakuRouter,
  interact: interactRouter,
  history: historyRouter,
  me: meRouter,
  search: searchRouter,
  billing: billingRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
