/**
 * localStorage工具函数
 * 用于统一管理localStorage操作以及清理缓存
 */

/**
 * 清理指定用户的小组进度缓存数据
 * @param {string} userId 用户ID
 * @returns {number} 清理的缓存项数量
 */
export const clearUserGroupCache = (userId) => {
    if (!userId) return 0;

    try {
        // 遍历localStorage查找当前用户的所有小组进度数据
        const keysToRemove = [];
        const userKeyPrefix = `groupInfo_${userId}_`;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(userKeyPrefix)) {
                keysToRemove.push(key);
            }
        }

        // 删除找到的所有键
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('已清理用户小组进度缓存:', key);
        });

        return keysToRemove.length;
    } catch (error) {
        console.error('清理用户小组进度缓存失败:', error);
        return 0;
    }
}

/**
 * 清理所有过期的小组进度数据
 * @param {number} expireHours 过期时间（小时），默认24小时
 * @returns {number} 清理的缓存项数量
 */
export const cleanExpiredGroupData = (expireHours = 24) => {
    try {
        const now = Date.now();
        const expireTime = expireHours * 60 * 60 * 1000;
        const keysToRemove = [];

        // 遍历localStorage查找过期的小组进度数据
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('groupInfo_')) {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        const data = JSON.parse(value);
                        if (data.data && data.data.timestamp && (now - data.data.timestamp > expireTime)) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (e) {
                    // 如果解析失败，可能是无效数据，也应该移除
                    keysToRemove.push(key);
                }
            }
        }

        // 删除过期的键
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('已清理过期小组进度缓存:', key);
        });

        return keysToRemove.length;
    } catch (error) {
        console.error('清理过期小组进度缓存失败:', error);
        return 0;
    }
}

/**
 * 生成用户特定的小组进度存储键
 * @param {Object} userInfo 用户信息对象，需包含userId、direction、group
 * @param {number} week 周数
 * @returns {string} 存储键名
 */
export const generateGroupStorageKey = (userInfo, week) => {
    const userId = userInfo.userId || 'anonymous';
    const direction = userInfo.direction || '未知方向';
    const group = userInfo.group || '未知小组';
    const weekNum = week || 1;
    return `groupInfo_${userId}_${direction}_${group}_${weekNum}`;
}

/**
 * 用户登出时的清理工作
 * 清理用户相关的所有缓存数据
 * 应该在登出操作中调用此函数
 */
export const handleUserLogout = () => {
    try {
        // 从localStorage获取当前用户ID
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) return;

        const userInfo = JSON.parse(userInfoStr);
        const userId = userInfo.userId || userInfo.number;

        if (userId) {
            // 清理该用户的小组进度缓存
            const cleanedCount = clearUserGroupCache(userId);
            console.log(`用户登出: 已清理 ${cleanedCount} 条小组进度缓存`);
        }

        // 顺便清理所有过期缓存
        cleanExpiredGroupData();
    } catch (error) {
        console.error('登出清理缓存失败:', error);
    }
} 