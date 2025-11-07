// src/Experience/Worlds/MainWorld/loaders/InitialHDRLoader.js
export default class InitialHDRLoader {
    constructor(progressiveHDRLoader) {
        this.progressiveHDRLoader = progressiveHDRLoader;
    }
    
    async loadInitialHDRs(hdrConfigs) {
        // 快速加载初始HDR（最低质量）
        console.log('Starting initial HDR loading...');
        const startTime = performance.now();
        
        const loadPromises = hdrConfigs.map(async (config) => {
            // 注册HDR集
            this.progressiveHDRLoader.registerHDRSet(config.id, config.urls);
            
            // 确定初始质量级别
            const initialQuality = this.progressiveHDRLoader.deviceCapabilities.initialQuality;
            console.log(`Loading initial HDR ${config.id} at ${initialQuality} quality`);
            
            // 加载初始质量HDR
            const texture = await this.progressiveHDRLoader.loadHDRLevel(config.id, initialQuality);
            return { id: config.id, texture };
        });
        
        const results = await Promise.all(loadPromises);
        const totalTime = performance.now() - startTime;
        
        console.log(`Initial HDR loading completed in ${totalTime.toFixed(2)}ms`);
        return results;
    }
}