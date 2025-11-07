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

echo "📁 重新复制文件..."
# 使用详细的复制方式
cp -r ../singularity/dist/* $HOMEPAGE_PATH/singularity

# ==========================================
# 步骤 4: 添加 .nojekyll 文件
# ==========================================
echo "📄 创建 .nojekyll 文件..."
touch $HOMEPAGE_PATH/singularity/.nojekyll

# ==========================================
# 步骤 5: 验证部署结果
# ==========================================
echo "🔍 验证部署结果..."
echo "部署后的文件结构:"
cd $HOMEPAGE_PATH

find singularity -type f -name "*.html" -o -name "*.js" -o -name "*.css" | head -15

# 检查关键文件
if [ ! -f "singularity/index.html" ]; then
    echo "❌ singularity/index.html 不存在"
    exit 1
fi

# 检查HTML中的资源引用
echo "📄 检查HTML中的资源引用:"
grep -o 'src="[^"]*"' singularity/index.html | head -5
grep -o 'href="[^"]*"' singularity/index.html | head -5

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