import { z } from "zod";
import { Id } from "./common";

export const PurchaseVip = z.object({ vipPlanId: Id });
export const PurchaseCoins = z.object({ coinPackId: Id });
export const UnlockEpisode = z.object({
  episodeId: Id,
  source: z.enum(["COINS", "VIP", "AD"]).default("COINS"),
});
