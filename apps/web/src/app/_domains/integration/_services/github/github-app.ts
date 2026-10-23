import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

import { isCloud } from "@/utils/environment/env";
import { requireEnv } from "@/utils/environment/require-env";

let privateKey: string | undefined;
function getPrivateKey() {
  return (privateKey ??= requireEnv(
    "GITHUB_PRIVATE_KEY",
    process.env.GITHUB_PRIVATE_KEY,
  ).replace(/\\n/g, "\n"));
}

if (isCloud()) getPrivateKey();

function getAppAuth() {
  return {
    appId: requireEnv("GITHUB_APP_ID", process.env.GITHUB_APP_ID),
    privateKey: getPrivateKey(),
  };
}

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: getAppAuth(),
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { ...getAppAuth(), installationId },
  });
}
