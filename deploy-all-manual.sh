#!/bin/bash

set -e

echo "🚀 开始完整部署流程..."

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ==========================================
# 步骤 1: 部署到 singularity 独立仓库
# ==========================================
echo -e "${BLUE}📦 步骤 1/4: 构建 Singularity 项目（独立部署）${NC}"

# 使用 /singularity/ 作为 base
export BASE_PATH='/singularity/'

npm install
npm run build:prod

echo -e "${BLUE}🚀 步骤 2/4: 部署到 singularity 独立仓库${NC}"
cd dist
git init
git add -A
git commit -m "Deploy: $(date +'%Y-%m-%d %H:%M:%S')"
git push -f git@github.com:ivanchen008/singularity.git master:gh-pages
cd ..

# ==========================================
# 步骤 2: 更新主页项目
# ==========================================
echo -e "${BLUE}🔄 步骤 3/4: 准备主页部署${NC}"

# 检查主页仓库
if [ -d "../ivanchen008.github.io" ]; then
  HOMEPAGE_PATH="../ivanchen008.github.io"
  echo "找到主页仓库: $HOMEPAGE_PATH"
  cd $HOMEPAGE_PATH
  git pull
  cd -
else
  echo "未找到主页仓库，正在克隆..."
  cd ..
  git clone git@github.com:ivanchen008/ivanchen008.github.io.git
  cd singularity
  HOMEPAGE_PATH="../ivanchen008.github.io"
fi

# 清理旧文件
echo -e "${YELLOW}🧹 清理主页旧的 singularity 文件夹${NC}"
rm -rf $HOMEPAGE_PATH/singularity

# 重新构建（使用相同的 base）
echo -e "${BLUE}🏗️ 为主页构建（base: /singularity/）${NC}"
rm -rf dist

# 确保使用正确的 base
export BASE_PATH='/singularity/'
npm run build

# 验证构建
if [ ! -f "dist/index.html" ]; then
  echo -e "${RED}❌ 构建失败：dist/index.html 不存在${NC}"
  exit 1
fi

echo -e "${GREEN}✅ 构建成功${NC}"

# 复制到主页
echo -e "${BLUE}📁 复制构建文件到主页${NC}"
cp -r dist $HOMEPAGE_PATH/singularity

# 验证复制
if [ ! -f "$HOMEPAGE_PATH/singularity/index.html" ]; then
  echo -e "${RED}❌ 复制失败${NC}"
  exit 1
fi

# 提交并推送
echo -e "${BLUE}📤 步骤 4/4: 推送主页更新${NC}"
cd $HOMEPAGE_PATH
git add singularity/
git commit -m "🔄 Update singularity: $(date +'%Y-%m-%d %H:%M:%S')" || echo "没有变化"
git push

cd - > /dev/null

echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}📍 独立页面: https://ivanchen008.github.io/singularity/${NC}"
echo -e "${GREEN}📍 主页集成: https://ivanchen008.github.io/singularity/${NC}"
echo -e "${GREEN}📍 主页: https://ivanchen008.github.io/${NC}"
echo -e "${YELLOW}⏱️ 请等待 1-2 分钟让 GitHub Pages 更新${NC}"