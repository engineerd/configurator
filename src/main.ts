import * as core from "@actions/core";
import * as cfg from "./configurator";

async function run() {
  try {
    let c = cfg.getConfig();
    if (c.fromGitHubReleases) {
      console.log(c);
      console.log(c.urlTemplate);
    }
    //await c.configure();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
