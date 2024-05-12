#!/usr/bin/env node
import { startServer } from "../dist/lib.js";

(async () => {
  const args = process.argv.slice(2);
  let port = undefined;
  if (args.length > 0) {
    try {
      port = parseInt(args.shift());
    } catch (error) {
      console.error("error: specified port has to be an integer.");
      console.error({ error });
      process.exit(1);
    }
  }

  await startServer({
    port,
  });
})();
