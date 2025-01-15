import type { Tool } from "../index.ts";
import { env } from "../../../lib/utils.ts";
import { tool } from "ai";
import { Octokit } from "octokit";
import { z } from "zod";
import logger from "../../../lib/logger.ts";
import { getFileContent, getRepositoryTree } from "../utils/github.ts";

export const repo_tree = {
  dependency() {
    const envPresent = !!env.GITHUB_PAT;
    return envPresent ? null : "Missing GITHUB_PAT";
  },
  core: tool({
    description: "Get GitHub repository tree",
    parameters: z.object({
      owner: z.string().describe("The owner of the repository"),
      repo: z.string().describe("The repository name"),
      branch: z.string().optional().describe("The branch to fetch the tree from"),
    }),
    async execute({ owner, repo, branch }) {
      try {
        const octokit = new Octokit({
          auth: env.GITHUB_PAT,
        });
        return await getRepositoryTree(octokit, owner, repo, branch);
      } catch(e) {
        if(e instanceof Error) {
          logger.error("Encountered an error during execution of the tool", e);
          return e.message;
        }
      }
    },
  }),
} satisfies Tool;

export const repo_file = {
  dependency() {
    return repo_tree.dependency();
  },
  core: tool({
    description: "Get file from GitHub repository",
    parameters: z.object({
      owner: z.string().describe("The owner of the repository"),
      repo: z.string().describe("The repository name"),
      path: z.string().describe("The path to the file (e.g src/index.ts)"),
      branch: z.string().optional().describe("The branch to fetch the file from"),
    }),
    async execute({ owner, repo, path, branch }) {
      try {
        const octokit = new Octokit({
          auth: env.GITHUB_PAT,
        });
        return await getFileContent(octokit, owner, repo, path, branch);
      } catch(e) {
        if(e instanceof Error) {
          logger.error("Encountered an error during execution of the tool", e);
          return e.message;
        }
      }
    },
  }),
} satisfies Tool;