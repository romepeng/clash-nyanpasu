import { execSync } from "child_process";
import fs from "fs-extra";
import path from "node:path";
import packageJson from "../package.json";
import { resolveUpdateLog } from "./updatelog";
import { TAURI_APP_DIR, cwd } from "./utils/env";
import { consola } from "./utils/logger";

const TAURI_APP_CONF_PATH = path.join(TAURI_APP_DIR, "tauri.conf.json");
const PACKAGE_JSON_PATH = path.join(cwd, "package.json");

// publish
async function resolvePublish() {
  const flag = process.argv[2] ?? "patch";
  const tauriJson = await fs.readJSON(TAURI_APP_CONF_PATH);

  let [a, b, c] = packageJson.version.split(".").map(Number);

  if (flag === "major") {
    a += 1;
    b = 0;
    c = 0;
  } else if (flag === "minor") {
    b += 1;
    c = 0;
  } else if (flag === "patch") {
    c += 1;
  } else throw new Error(`invalid flag "${flag}"`);

  const nextVersion = `${a}.${b}.${c}`;
  packageJson.version = nextVersion;
  tauriJson.package.version = nextVersion;

  // 发布更新前先写更新日志
  const nextTag = `v${nextVersion}`;
  await resolveUpdateLog(nextTag);

  await fs.writeJSON(PACKAGE_JSON_PATH, packageJson, {
    spaces: 2,
  });
  await fs.writeJSON(TAURI_APP_CONF_PATH, tauriJson, {
    spaces: 2,
  });

  execSync("git add ./package.json");
  execSync(`git add ${TAURI_APP_CONF_PATH}`);
  execSync(`git commit -m "v${nextVersion}"`);
  execSync(`git tag -a v${nextVersion} -m "v${nextVersion}"`);
  execSync(`git push`);
  execSync(`git push origin v${nextVersion}`);
  consola.success(`Publish Successfully...`);
}

resolvePublish();
