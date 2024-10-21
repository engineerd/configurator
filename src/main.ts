import * as core from "@actions/core";
import * as cfg from "./configurator";

async function run() {
  try {
    await cfg.getConfig().configure();
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
