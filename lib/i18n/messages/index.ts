/**
 * Chinese message dictionary (key = English source text).
 * Split into namespaces so parallel translation work does not collide;
 * merged here into the single lookup table used by translate().
 */

import common from "./common";
import layout from "./layout";
import auth from "./auth";
import catalog from "./catalog";
import commerce from "./commerce";
import insights from "./insights";
import operations from "./operations";
import admin from "./admin";
import portal from "./portal";

export const ZH_MESSAGES: Record<string, string> = {
  ...common,
  ...layout,
  ...auth,
  ...catalog,
  ...commerce,
  ...insights,
  ...operations,
  ...admin,
  ...portal,
};