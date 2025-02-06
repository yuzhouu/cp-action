#!/bin/sh

# 获取命令行参数
source_path=$1
target_repo=$2
target_path=$3
target_token=$4

# 获取当前仓库最新的 commit sha
source_commit_sha=$(git log -1 --pretty=format:%H)

# 获取当前仓库最新的提交信息
source_commit_message=$(git log -1 --pretty=format:%s)

# 组合 commit sha 和提交信息
combined_commit_message="[Source SHA: $source_commit_sha] $source_commit_message"

# 创建目标临时目录
mkdir -p temp-target/$target_path

# 复制指定代码到目标路径
cp -r $source_path temp-target/$target_path

# 进入目标临时目录并初始化 Git
cd temp-target
git init
git remote add origin "https://x-access-token:$target_token@github.com/$target_repo.git"
git fetch origin main
git checkout -b temp-branch origin/main

# 检查是否有变更
changes=$(git status --porcelain)
if [ -n "$changes" ]; then
    # 有变更，进行提交
    git add .
    set +e
    git commit -m "$combined_commit_message"
    commit_status=$?
    set -e
    if [ $commit_status -ne 0 ]; then
        # 提交时可能遇到冲突
        if echo "$(git status)" | grep -q "conflict"; then
            echo "Conflict detected during commit. Resolving..."
            conflict_files=$(git diff --name -only --diff-filter=U)
            for file in $conflict_files; do
                if [ -n "$file" ]; then
                    git checkout ../$source_path/$file -- $file
                    git add $file
                fi
            done
            set +e
            git commit -m "$combined_commit_message"
            resolve_status=$?
            set -e
            if [ $resolve_status -eq 0 ]; then
                git push origin temp-branch:main
                echo "Conflict resolved and code pushed successfully."
            else
                echo "Failed to resolve conflict."
            fi
        else
            echo "Error during commit."
        fi
    else
        # 尝试推送
        git push origin temp-branch:main
        echo "Code copied and pushed successfully."
    fi
else
    # 没有变更
    echo "No changes detected. Skipping commit and push."
fi

# 清理临时目录
cd ..
rm -rf temp-target