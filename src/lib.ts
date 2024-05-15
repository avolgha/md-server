import TimedCache from "@avolgha/timed-cache";
import fastify from "fastify";
import fs from "fs";
import { MdServerOptions } from "./types.js";
import { getUserStyles } from "./get-user-styles.js";
import { getNotFoundPage } from "./get-not-found-page.js";
import { routeHandler } from "./route-handler.js";

// TODO(avolgha): sidebar on website for navigation between markdown files.

export async function startServer({
  workingDir = process.cwd(),
  port = 5173,
}: Partial<MdServerOptions>) {
  if (!fs.existsSync(workingDir)) {
    throw new Error(
      `Server cannot be created in a non-existing directory. (${workingDir})`
    );
  }

  const markdownCache = new TimedCache<string>(600_000); // 600_000s == 10 minutes
  const userStyles = await getUserStyles(workingDir);
  const notFoundPage = getNotFoundPage(workingDir);

  const app = fastify({
    logger: {
      transport: {
        target: "@fastify/one-line-logger",
      },
    },
  });

  app.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  });
  app.register(import("@fastify/cors"));

  app.get(
    "*",
    routeHandler(markdownCache, workingDir, userStyles, notFoundPage)
  );

  await app.listen({
    port,
  });
}
