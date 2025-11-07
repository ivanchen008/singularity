// HDR质量等级定义
import { HDR_QUALITY_LEVELS } from './HDRQualityLevels.js';

// src/Experience/Worlds/MainWorld/loaders/BackgroundHDRLoader.js
export default class BackgroundHDRLoader {
    constructor(progressiveHDRLoader, experience) {
        this.progressiveHDRLoader = progressiveHDRLoader;
        this.experience = experience;
        this.loadQueue = [];
        this.isLoading = false;
        this.idleTimer = null;
        this.userActive = false;
    }
    
    setupUserActivityListeners() {
        // 设置用户活动监听
        const userEvents = ['pointermove', 'scroll', 'keydown', 'touchmove', 'mousedown'];
        
        const setUserActive = () => {
            this.userActive = true;
            clearTimeout(this.idleTimer);
            
            // 用户停止活动2秒后开始后台加载
            this.idleTimer = setTimeout(() => {
                this.userActive = false;
                this.startBackgroundLoading();
            }, 2000);
        };
        
        userEvents.forEach(event => {
            window.addEventListener(event, setUserActive, { passive: true });
        });
        
        // 页面加载完成后安排后台加载
        if (document.readyState === 'complete') {
            this.scheduleBackgroundLoading();
        } else {
            window.addEventListener('load', () => {
                this.scheduleBackgroundLoading();
            });
        }
    }
    
    scheduleBackgroundLoading() {
        // 安排后台加载
        // 5秒后开始后台加载
        setTimeout(() => {
            if (!this.userActive) {
                this.startBackgroundLoading();
            }
        }, 5000);
    }
    
    startBackgroundLoading() {
        // 开始后台加载
        if (this.isLoading) return;
        
        console.log('Starting background HDR loading...');
        this.buildLoadQueue();
        this.processLoadQueue();
    }
    
    buildLoadQueue() {
        // 构建加载队列
        this.loadQueue = [];
        
        for (const [id, hdrSet] of this.progressiveHDRLoader.hdrSets.entries()) {
            const currentLevel = hdrSet.currentLevel;
            const currentPriority = HDR_QUALITY_LEVELS[currentLevel]?.priority || 0;
            const maxPriority = HDR_QUALITY_LEVELS[this.progressiveHDRLoader.deviceCapabilities.maxQuality].priority;
            
            // 添加所有未加载的更高级别到队列
            Object.entries(HDR_QUALITY_LEVELS).forEach(([levelName, levelInfo]) => {
                if (levelInfo.priority > currentPriority && levelInfo.priority <= maxPriority) {
                    const existing = hdrSet.levels.get(levelName);
                    if (!existing || (!existing.loaded && !existing.loading)) {
                        this.loadQueue.push({
                            hdrId: id,
                            qualityLevel: levelName,
                            priority: levelInfo.priority
                        });
                    }
                }
            });
        }
        
        // 按优先级排序
        this.loadQueue.sort((a, b) => a.priority - b.priority);
        console.log(`Built background load queue with ${this.loadQueue.length} items`);
    }
    
    async processLoadQueue() {
        // 处理加载队列
        if (this.loadQueue.length === 0) {
            console.log('Background HDR loading queue is empty');
            return;
        }
        
        this.isLoading = true;
        console.log(`Processing ${this.loadQueue.length} HDR loading tasks`);
        
        for (const loadItem of this.loadQueue) {
            // 检查是否应该暂停加载（性能或用户活动）
            if (this.shouldPauseLoading()) {
                console.log('Pausing background HDR loading due to user activity or performance');
                this.isLoading = false;
                return;
            }
            
            try {
                console.log(`Background loading HDR ${loadItem.hdrId} at ${loadItem.qualityLevel} quality`);
                await this.loadHDRWithThrottling(loadItem.hdrId, loadItem.qualityLevel);
                
                // 小间隔避免阻塞主线程
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.warn(`Background HDR load failed for ${loadItem.hdrId} ${loadItem.qualityLevel}:`, error);
            }
        }
        
        this.isLoading = false;
        console.log('Background HDR loading completed');
    }
    
    shouldPauseLoading() {
        // 判断是否应暂停加载
        // 如果用户正在交互，暂停加载
        if (this.userActive) return true;
        
        // 如果帧率过低，暂停加载
        if (this.experience?.time?.fps && this.experience.time.fps < 30) {
            return true;
        }
        
        return false;
    }
    
    async loadHDRWithThrottling(hdrId, qualityLevel) {
        // 带节流的HDR加载
        // 检查页面性能，如果帧率过低则延迟加载
        if (this.experience?.time?.fps && this.experience.time.fps < 30) {
            // 等待性能恢复
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!this.experience.time || this.experience.time.fps >= 30) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 500);
            });
        }
        
        // 执行实际加载
        return await this.progressiveHDRLoader.loadHDRLevel(hdrId, qualityLevel);
    }
}