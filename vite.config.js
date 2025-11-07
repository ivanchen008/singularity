import restart from 'vite-plugin-restart'
import glsl from 'vite-plugin-glsl'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'
import Terminal from 'vite-plugin-terminal'
//import obfuscatorPlugin from "vite-plugin-javascript-obfuscator";

import { loadEnv } from 'vite'

const dirname = path.resolve()

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

export default ({ mode }) => {
    // 获取 base 路径并验证
    const env = loadEnv(mode, process.cwd(), '')
    let base = env.VITE_BASE_PATH || '/singularity/'
    
    // 🛡️ 安全检查：防止错误的值
    if (base === 'true' || base === 'false') {
        console.warn(`⚠️ Warning: VITE_BASE_PATH is set to "${base}", using default "/singularity/"`)
        base = '/singularity/'
    }
    
    // 确保以 / 开头和结尾
    if (!base.startsWith('/')) base = '/' + base
    if (!base.endsWith('/')) base = base + '/'
    console.log(`🚀 Building with base path: ${base} ${String(env.VITE_BASE_PATH)}`)
    
  return {
    root: 'src/',
    publicDir: '../static/',
    base: base,
    resolve:
        {
            alias:
                {
                    '@experience' : path.resolve(dirname, './src/Experience/'),
                }
        },
    server:
    {
        host: true,
        open: !isCodeSandbox, // Open if it's not a CodeSandbox
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    build:
    {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: mode !== 'production',
        // 滚轮配置
        rollupOptions: {
            output: {
                // Vite处理的文件带哈希
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: (assetInfo) => {
                const extType = assetInfo.name.split('.')[1]
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                        return 'assets/images/[name]-[hash][extname]'
                    }
                    if (/css/i.test(extType)) {
                        return 'assets/css/[name]-[hash][extname]'
                    }
                    return 'assets/[name]-[hash][extname]'
                }
            }
        }
    },
    plugins:
    [
        restart({ restart: [ '../static/**', ] }), // Restart server on static file change
        glsl(),
        basicSsl(),
        // Terminal({
        //     console: 'terminal',
        //     output: ['terminal', 'console']
        // })
        // obfuscatorPlugin({
        //     options: {
        //         //include: ["src/path/to/file.js", "path/anyjs/**/*.js", /foo.js$/],
        //         exclude: [/node_modules/],
        //         apply: "build",
        //         debugger: true,
        //         // your javascript-obfuscator options
        //         debugProtection: true,
        //         // ...  [See more options](https://github.com/javascript-obfuscator/javascript-obfuscator)
        //     },
        // }),
    ]
}}
