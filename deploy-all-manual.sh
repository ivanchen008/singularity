#!/bin/bash

set -e

echo "🚀 开始完整部署流程..."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'



# ==========================================
# 步骤 1: 构建项目
# ==========================================
echo -e "${BLUE}📦 步骤 1/5: 安装依赖${NC}"
npm install

echo -e "${BLUE}🏗️ 步骤 2/5: 构建生产版本 npm run build:prod(base:‘/singularity’), 开发版本 base:‘/’ ${NC}"
rm -rf dist
npm run build:prod

if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}❌ 构建失败${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 构建成功${NC}"

# ==========================================
# 步骤 2: 部署到独立仓库
# ==========================================
echo -e "${BLUE}🚀 步骤 3/5: 部署到 singularity 独立仓库${NC}"
cd dist
git init
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git push -f git@github.com:ivanchen008/singularity.git master:gh-pages
cd ..

# ==========================================
# 步骤 3: 更新主页
# ==========================================
echo -e "${BLUE}🔄 步骤 4/5: 准备主页部署${NC}"

HOMEPAGE_PATH="../ivanchen008.github.io"

if [ -d "$HOMEPAGE_PATH" ]; then
  echo "找到主页仓库"
  cd $HOMEPAGE_PATH
  git pull
  cd -
else
  echo "克隆主页仓库..."
  cd ..
  git clone git@github.com:ivanchen008/ivanchen008.github.io.git
  cd singularity
fi

# 清理并复制
echo -e "${YELLOW}🧹 清理主页的 singularity 文件夹${NC}"
rm -rf $HOMEPAGE_PATH/singularity

echo -e "${BLUE}📁 复制构建文件到主页（安全复制）${NC}"
mkdir -p $HOMEPAGE_PATH/singularity

# 方法1: 使用 rsync（推荐）
if command -v rsync &> /dev/null; then
  rsync -av --exclude='.git' dist/ $HOMEPAGE_PATH/singularity/
else
  # 方法2: 使用 find + cp（兼容性更好）
  cd dist
  find . -type f -not -path './.git/*' -exec cp --parents {} $HOMEPAGE_PATH/singularity/ \;
  cd -
fi

# 验证复制并检查是否包含 .git
echo -e "${YELLOW}🔍 检查复制结果${NC}"
if [ -d "$HOMEPAGE_PATH/singularity/.git" ]; then
  echo -e "${RED}❌ 错误：.git 目录被复制了！${NC}"
  rm -rf $HOMEPAGE_PATH/singularity/.git
  echo -e "${YELLOW}⚠️  已自动删除 .git 目录${NC}"
fi

echo -e "${GREEN}✅ 复制成功${NC}"

# ==========================================
# 步骤 4: 提交主页更新
# ==========================================
echo -e "${BLUE}📤 步骤 5/5: 推送主页更新${NC}"
cd $HOMEPAGE_PATH

# 显示详细的 git 状态
echo -e "${YELLOW}📊 Git 状态：${NC}"
git status --short

# 检查是否有变化
if git diff --quiet && git diff --cached --quiet; then
  echo -e "${YELLOW}⚠️ 没有检测到文件变化${NC}"
  echo -e "${YELLOW}这可能是因为：${NC}"
  echo -e "${YELLOW}  1. 代码没有实际修改${NC}"
  echo -e "${YELLOW}  2. 构建输出完全相同${NC}"
  echo -e "${YELLOW}如果你确实修改了代码，请检查 vite.config.js${NC}"
else
  # 有变化，提交
  git add singularity/
  
  # 显示即将提交的文件
  echo -e "${BLUE}📝 即将提交的文件：${NC}"
  git diff --cached --stat
  
  git commit -m "🔄 Update singularity: $(date +'%Y-%m-%d %H:%M:%S')"
  git push
  
  echo -e "${GREEN}✅ 主页更新成功${NC}"
fi

cd - > /dev/null

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}📍 独立页面: https://ivanchen008.github.io/singularity/${NC}"
echo -e "${GREEN}📍 主页: https://ivanchen008.github.io/${NC}"
echo -e "${YELLOW}⏱️ 请等待 1-2 分钟让 GitHub Pages 更新${NC}"