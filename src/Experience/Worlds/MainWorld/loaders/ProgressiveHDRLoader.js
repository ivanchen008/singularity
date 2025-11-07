// src/Experience/Worlds/MainWorld/loaders/ProgressiveHDRLoader.js
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
import { HDR_QUALITY_LEVELS } from './HDRQualityLevels.js';

export default class ProgressiveHDRLoader {
    constructor(renderer) {
        this.renderer = renderer;
        this.rgbeLoader = new RGBELoader();
        this.pmremGenerator = new PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        this.hdrSets = new Map();
        this.deviceCapabilities = this.detectDeviceCapabilities();
    }
    
    detectDeviceCapabilities() {
        // 设备能力检测实现
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        
        return {
            isMobile,
            memory,
            cores,
            initialQuality: isMobile || memory < 4 ? 'THUMBNAIL' : 'LOW',
            maxQuality: memory >= 8 ? 'ORIGINAL' : 'HIGH'
        };
    }
    
    registerHDRSet(id, urls) {
        // 注册HDR集合
        this.hdrSets.set(id, {
            id,
            urls, // {THUMBNAIL: 'url1', LOW: 'url2', ...}
            currentLevel: null,
            levels: new Map(),
            sceneReference: null
        });
    }
    
    getCurrentHDR(id) {
        // 获取当前最佳HDR纹理
        const hdrSet = this.hdrSets.get(id);
        if (!hdrSet) return null;
        
        // 按优先级返回最高质量的已加载纹理
        const sortedLevels = Array.from(hdrSet.levels.entries())
            .filter(([level, data]) => data.loaded)
            .sort((a, b) => HDR_QUALITY_LEVELS[b[0]].priority - HDR_QUALITY_LEVELS[a[0]].priority);
        
        return sortedLevels.length > 0 ? sortedLevels[0][1].texture : null;
    }
    
    async loadHDRLevel(hdrId, qualityLevel) {
        // 加载指定质量级别的HDR
        const hdrSet = this.hdrSets.get(hdrId);
        const qualityInfo = HDR_QUALITY_LEVELS[qualityLevel];
        
        if (!hdrSet || !qualityInfo || !hdrSet.urls[qualityLevel]) {
            return null;
        }
        
        // 如果已加载或正在加载，则返回
        if (hdrSet.levels.has(qualityLevel)) {
            const levelData = hdrSet.levels.get(qualityLevel);
            if (levelData.loaded || levelData.loading) {
                return levelData.loaded ? levelData.texture : null;
            }
        }
        
        // 标记为正在加载
        hdrSet.levels.set(qualityLevel, {
            loaded: false,
            loading: true,
            texture: null
        });
        
        try {
            console.log(`Loading HDR ${hdrId} at ${qualityLevel} quality`);
            const startTime = performance.now();
            
            // 加载HDR文件
            const texture = await new Promise((resolve, reject) => {
                this.rgbeLoader.load(hdrSet.urls[qualityLevel], resolve, undefined, reject);
            });
            
            const loadTime = performance.now() - startTime;
            console.log(`HDR ${hdrId} ${qualityLevel} loaded in ${loadTime.toFixed(2)}ms`);
            
            // 生成PMREM纹理
            const pmremStartTime = performance.now();
            const pmremRT = this.pmremGenerator.fromEquirectangular(texture);
            const pmremTime = performance.now() - pmremStartTime;
            console.log(`PMREM generation for ${hdrId} ${qualityLevel} took ${pmremTime.toFixed(2)}ms`);
            
            // 清理原始纹理
            texture.dispose();
            
            // 更新状态
            hdrSet.levels.set(qualityLevel, {
                loaded: true,
                loading: false,
                texture: pmremRT.texture,
                loadTime: loadTime + pmremTime
            });
            
            hdrSet.currentLevel = qualityLevel;
            
            // 如果有场景引用，更新环境贴图
            if (hdrSet.sceneReference) {
                this.updateSceneEnvironment(hdrSet);
            }
            
            return pmremRT.texture;
            
        } catch (error) {
            console.error(`Failed to load HDR ${hdrId} at ${qualityLevel} quality:`, error);
            hdrSet.levels.set(qualityLevel, {
                loaded: false,
                loading: false,
                texture: null,
                error: error
            });
            return null;
        }
    }
    
    updateSceneEnvironment(hdrSet) {
        // 更新场景环境贴图
        const bestTexture = this.getCurrentHDR(hdrSet.id);
        if (bestTexture && hdrSet.sceneReference) {
            hdrSet.sceneReference.environment = bestTexture;
            console.log(`Updated scene environment with ${hdrSet.currentLevel} quality HDR`);
        }
    }
    
    bindToScene(hdrId, scene) {
        // 将HDR集关联到场景
        const hdrSet = this.hdrSets.get(hdrId);
        if (hdrSet) {
            hdrSet.sceneReference = scene;
            this.updateSceneEnvironment(hdrSet);
        }
    }
}