// 通过 GitHub REST API 上传分支（github.com:443 不可达，git push 不可用）
// 用法：node upload2.js [main|gh-pages|all]
const fs = require("fs");
const path = require("path");

const OWNER = "QF331816";
const REPO = "yinyewan-warehouse";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) { console.error("缺少 GITHUB_TOKEN"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(p, method = "GET", body) {
  let wait = 15000;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const res = await fetch(`https://api.github.com${p}`, {
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "cangku-uploader",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return res.json();
      const text = await res.text();
      if (res.status === 403 || res.status === 429) {
        console.log(`    触发限流，等待 ${Math.round(wait / 1000)} 秒 ...`);
        await sleep(wait);
        wait = Math.min(wait * 2, 90000);
        continue;
      }
      throw new Error(`${method} ${p} -> ${res.status} ${text.slice(0, 160)}`);
    } catch (err) {
      if (attempt === 8) throw err;
      await sleep(2000 * attempt);
    }
  }
  throw new Error("重试耗尽");
}

function listFiles(root, skipDirs) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.includes(entry.name)) continue;
        walk(abs);
      } else {
        out.push({ abs, rel: path.relative(root, abs).split(path.sep).join("/") });
      }
    }
  };
  walk(root);
  return out;
}

async function uploadTree(root, files, message, branch) {
  console.log(`\n[${branch}] 上传 ${files.length} 个文件 ...`);
  const entries = [];
  let done = 0;
  for (const f of files) {
    const content = fs.readFileSync(f.abs).toString("base64");
    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, "POST", {
      content,
      encoding: "base64",
    });
    entries.push({ path: f.rel, mode: "100644", type: "blob", sha: blob.sha });
    done++;
    if (done % 40 === 0) console.log(`  ${done}/${files.length}`);
    await sleep(250);
  }

  const tree = await api(`/repos/${OWNER}/${REPO}/git/trees`, "POST", { tree: entries });
  const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message,
    tree: tree.sha,
    parents: [],
  });
  try {
    await api(`/repos/${OWNER}/${REPO}/git/refs`, "POST", {
      ref: `refs/heads/${branch}`,
      sha: commit.sha,
    });
    console.log(`[${branch}] 创建分支 ${commit.sha.slice(0, 7)}`);
  } catch {
    await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${branch}`, "PATCH", {
      sha: commit.sha,
      force: true,
    });
    console.log(`[${branch}] 更新分支 ${commit.sha.slice(0, 7)}`);
  }
  return commit.sha;
}

(async () => {
  const which = process.argv[2] || "all";
  const root = "D:/deepseek的工作文件夹/仓库管理系统/03-在线演示";

  if (which === "main" || which === "all") {
    const source = listFiles(root, ["node_modules", ".next", "out", "_preview", ".github"]);
    await uploadTree(root, source, "银叶湾幼儿园物资仓库 · 源码（演示版）", "main");
  }
  if (which === "gh-pages" || which === "all") {
    const siteDir = path.join(root, "out");
    const site = listFiles(siteDir, []);
    await uploadTree(siteDir, site, "构建产物：静态站点", "gh-pages");
  }
  console.log("\n上传完成");
})().catch((err) => {
  console.error("失败:", err.message);
  process.exit(1);
});
