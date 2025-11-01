How to install and run this template? \
It's simple, just run the following commands: 
```
npm i
npm run dev
```

https://github.com/user-attachments/assets/e7810d45-6113-4dfc-8884-5c9fbdeca65d

## Tauri (desktop) 支持

已经在仓库中加入了最小的 `src-tauri` scaffold，你可以在本地完成以下步骤来运行桌面版：

1. 安装 Rust toolchain（如未安装）

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default stable
```

2. 在 Windows 上安装 MSVC 编译工具（如果需要），或使用 `rustup` 的说明

3. 安装 Tauri CLI（全局或项目）并安装 Node 依赖：

```bash
npm install
npm install --save-dev @tauri-apps/cli
```

4. 本地开发（会启动 vite dev server，然后用 Tauri 打包为桌面应用窗口）：

```bash
npm run tauri:dev
```

5. 构建桌面发行版：

```bash
npm run tauri:build
```

注意：如果遇到构建/链接错误，先确认你的 Rust toolchain 与平台工具（Visual Studio Build Tools）已正确安装。

### 在中国大陆使用 crates.io 镜像（可选）

如果你位于中国大陆并且下载 Rust crate 较慢，可以在项目内添加 Cargo 的镜像配置以使用中科大（USTC）稀疏索引。该配置要求 Cargo 版本 >= 1.68.0。

1. 在项目根创建（或确认存在）目录 `.cargo`，并在其中添加 `config.toml`，内容如下：

```toml
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"

[net]
git-fetch-with-cli = true
```

2. 说明与注意：
- `replace-with = 'ustc'` 会把默认的 crates.io 索引替换为中科大镜像的稀疏索引；
- `git-fetch-with-cli = true` 可以在某些平台上绕过内建 git 客户端的问题，提高兼容性；
- 该镜像通常能明显加速依赖解析与下载，但请确保你信任镜像源；如果遇到问题，只需删除或重命名 `.cargo/config.toml` 即可恢复默认行为。

3. 验证：保存后运行 `cargo update` 或再次运行 `npm run tauri:dev`（cargo 将使用新的索引）。
