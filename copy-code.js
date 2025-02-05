const { execSync } = require("child_process");

// 获取命令行参数
const [, , sourcePath, targetRepo, targetPath, targetToken] = process.argv;

try {
  // 获取当前仓库最新的 commit sha
  const sourceCommitSha = execSync("git log -1 --pretty=format:%H")
    .toString()
    .trim();

  // 获取当前仓库最新的提交信息
  const sourceCommitMessage = execSync("git log -1 --pretty=format:%s")
    .toString()
    .trim();

  // 组合 commit sha 和提交信息
  const combinedCommitMessage = `[Source SHA: ${sourceCommitSha}] ${sourceCommitMessage}`;

  // 创建目标临时目录
  execSync(`mkdir -p temp-target/${targetPath}`);

  // 复制指定代码到目标路径
  execSync(`cp -rvf ${sourcePath} temp-target/${targetPath}`);

  // 进入目标临时目录并初始化 Git
  process.chdir("temp-target");
  execSync("git init");
  execSync(
    `git remote add origin https://x-access-token:${targetToken}@github.com/${targetRepo}.git`
  );
  execSync("git fetch origin main");
  execSync("git checkout -b temp-branch origin/main");

  // 检查是否有变更
  const changes = execSync("git status --porcelain").toString().trim();
  if (changes) {
    // 有变更，进行提交
    execSync("git add .");
    try {
      execSync(`git commit -m "${combinedCommitMessage}"`);
      // 尝试推送
      execSync("git push origin temp-branch:main");
      console.log("Code copied and pushed successfully.");
    } catch (commitError) {
      // 提交时可能遇到冲突
      if (commitError.message.includes("conflict")) {
        console.error("Conflict detected during commit. Resolving...");

        // 简单的冲突解决策略：使用源仓库的版本
        const conflictFiles = execSync("git diff --name-only --diff-filter=U")
          .toString()
          .trim()
          .split("\n");
        for (const file of conflictFiles) {
          if (file) {
            execSync(`git checkout ../${sourcePath}/${file} -- ${file}`);
            execSync(`git add ${file}`);
          }
        }

        try {
          // 再次尝试提交
          execSync(`git commit -m "${combinedCommitMessage}"`);
          execSync("git push origin temp-branch:main");
          console.log("Conflict resolved and code pushed successfully.");
        } catch (resolveError) {
          console.error("Failed to resolve conflict:", resolveError);
        }
      } else {
        console.error("Error during commit:", commitError);
      }
    }
  } else {
    // 没有变更
    console.log("No changes detected. Skipping commit and push.");
  }

  // 清理临时目录
  process.chdir("..");
  execSync("rm -rf temp-target");
} catch (error) {
  console.error("Error copying code:", error);
}
