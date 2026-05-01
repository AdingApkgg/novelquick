import { router } from "../../trpc";
import { adminDramaRouter } from "./drama";
import { adminEpisodeRouter } from "./episode";
import { adminUserRouter } from "./user";
import { adminCommentRouter } from "./comment";
import { adminFeedRouter } from "./feed";
import { adminTaxonomyRouter } from "./taxonomy";
import { adminMonetizationRouter } from "./monetization";
import { adminStatsRouter } from "./stats";

export const adminRouter = router({
  drama: adminDramaRouter,
  episode: adminEpisodeRouter,
  user: adminUserRouter,
  comment: adminCommentRouter,
  feed: adminFeedRouter,
  taxonomy: adminTaxonomyRouter,
  monetization: adminMonetizationRouter,
  stats: adminStatsRouter,
});
