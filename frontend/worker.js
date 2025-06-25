import { serveStatic } from "@cloudflare/kv-asset-handler";

export default {
  async fetch(request, env, ctx) {
    return serveStatic(request, env.ASSETS, { mapRequestToAsset: req => req });
  },
};
