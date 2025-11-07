// HDR质量等级定义
const HDR_QUALITY_LEVELS = {
    THUMBNAIL: {
        name: 'thumbnail',
        size: '64x32',  // 极低分辨率
        priority: 1,
        loadTime: '< 100ms'
    },
    LOW: {
        name: 'low',
        size: '256x128', // 低分辨率
        priority: 2,
        loadTime: '< 500ms'
    },
    MEDIUM: {
        name: 'medium',
        size: '512x256', // 中等分辨率
        priority: 3,
        loadTime: '< 1s'
    },
    HIGH: {
        name: 'high',
        size: '1024x512', // 高分辨率
        priority: 4,
        loadTime: '< 2s'
    },
    ORIGINAL: {
        name: 'original',
        size: '2048x1024', // 原始分辨率
        priority: 5,
        loadTime: '< 5s'
    }
};

export { HDR_QUALITY_LEVELS };