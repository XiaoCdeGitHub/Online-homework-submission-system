import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '@/utils/brower';

// 定义接口响应类型
export interface AdminHomeworkResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

// 定义学生作业信息接口
export interface SelectHomeworkDto {
    userId: string;
    user_name: string;
    fileUrl: string;
    comments: string;
    submitTime: string;
    group: string;
    direction: string;
    weeks: number;
    finishCondition: string;
    is_apply: boolean; // 是否已提交，用于界面判断
    isSelect?: boolean; // 用于UI选择状态
}

/**
 * 管理员发布作业
 * @param formData 包含作业文件和相关信息的FormData对象
 * @returns Promise 发布结果
 */
export const publishHomework = async (formData: FormData): Promise<AdminHomeworkResponse> => {
    try {
        // 确保包含必要的参数
        if (!formData.get('file')) {
            return {
                code: 400,
                message: '作业文件不能为空',
                data: null
            };
        }

        if (!formData.get('notice')) {
            return {
                code: 400,
                message: '作业说明不能为空',
                data: null
            };
        }

        if (!formData.get('startTime')) {
            return {
                code: 400,
                message: '开始时间不能为空',
                data: null
            };
        }

        if (!formData.get('endTime')) {
            return {
                code: 400,
                message: '截止时间不能为空',
                data: null
            };
        }

        if (!formData.get('weeks') || Number(formData.get('weeks')) <= 0) {
            return {
                code: 400,
                message: '周数必须大于0',
                data: null
            };
        }

        if (!formData.get('direction')) {
            return {
                code: 400,
                message: '方向不能为空',
                data: null
            };
        }

        // 发送请求
        const res = await axios.post('/admin/publishHomework', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return {
            code: res.code,
            message: res.msg || '作业发布成功',
            data: res.data
        };

    } catch (error) {
        console.error('作业发布失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: null
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: null
        };
    }
};

/**
 * 下载学生作业
 * @param userId 学生用户ID
 * @param weeks 作业周数
 * @returns Promise 下载结果
 */
export const downloadHomework = async (userId: string, weeks: number): Promise<void> => {
    try {
        if (!userId) {
            throw new Error('用户ID不能为空');
        }

        if (!weeks || weeks <= 0) {
            throw new Error('作业周数不合法');
        }

        // 构建下载URL
        const downloadUrl = `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

        // 发起请求获取文件名
        const response = await axios.get(`${downloadUrl}&getFilename=true`);
        const filename = response.data?.filename || `作业-${userId}-第${weeks}周.zip`;

        // 使用前端下载功能
        window.open(downloadUrl, '_blank');

    } catch (error) {
        console.error('作业下载失败:', error);
        throw error;
    }
};

/**
 * 导出作业报告
 * @param direction 方向
 * @param group 分组
 * @param weeks 周数
 */
export const getFinalExcel = async (direction: string, group: string, weeks: number): Promise<void> => {
    try {
        if (!direction) {
            throw new Error('方向不能为空');
        }

        if (!group) {
            throw new Error('分组不能为空');
        }

        if (!weeks || weeks <= 0) {
            throw new Error('周数不合法');
        }

        // 构建下载URL
        const downloadUrl = `/admin/getFinalExcel?direction=${encodeURIComponent(direction)}&group=${encodeURIComponent(group)}&weeks=${weeks}`;

        // 文件名格式：{direction}{group}-作业情况统计.xlsx
        const filename = `${direction}${group}-作业情况统计.xlsx`;

        // 使用封装好的loadFile函数下载
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        loadFile(objectUrl, filename);

    } catch (error) {
        console.error('导出作业报告失败:', error);
        throw error;
    }
};

/**
 * 条件查询作业提交情况
 * @param params 查询条件参数
 * @returns Promise 查询结果
 */
export const selectCondition = async (params: {
    direction?: string;
    group?: string;
    weeks?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
}): Promise<AdminHomeworkResponse<any[]>> => {
    try {
        // 发送请求
        const res = await axios.post<any, any>('/admin/selectCondition', params);

        return {
            code: res.code,
            message: res.msg || '查询作业成功',
            data: Array.isArray(res.data) ? res.data : []
        };
    } catch (error) {
        console.error('条件查询作业失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: []
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: []
        };
    }
};

/**
 * 获取小组作业提交统计
 * @param params 查询参数
 * @returns Promise 小组统计数据
 */
export const getGroupInfo = async (params: {
    direction: string;
    group: string;
    weeks?: number;
}): Promise<AdminHomeworkResponse<any>> => {
    try {
        // 验证必要参数
        if (!params.direction) {
            return {
                code: 400,
                message: '方向不能为空',
                data: null
            };
        }

        if (!params.group) {
            return {
                code: 400,
                message: '小组不能为空',
                data: null
            };
        }

        // 发送请求
        const res = await axios.post<any, any>('/admin/getGroupInfo', params);

        return {
            code: res.code,
            message: res.msg || '获取小组信息成功',
            data: res.data
        };
    } catch (error) {
        console.error('获取小组作业提交统计失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: null
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: null
        };
    }
};

/**
 * 获取当前周数
 * @returns Promise 当前周数
 */
export const getCurrentWeeks = async (): Promise<AdminHomeworkResponse<number>> => {
    try {
        // 发送请求
        const res = await axios.get<any, any>('/admin/getCurrentWeeks');

        return {
            code: res.code,
            message: res.msg || '获取当前周数成功',
            data: typeof res.data === 'number' ? res.data : 1
        };
    } catch (error) {
        console.error('获取当前周数失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: 1
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: 1
        };
    }
};

/**
 * 根据筛选条件获取学生作业信息
 * @param params 筛选条件参数
 * @returns Promise 筛选结果
 */
export const getSelectCondition = async (params: {
    direction: string;
    group: string;
    weeks: number;
}): Promise<AdminHomeworkResponse<SelectHomeworkDto[]>> => {
    try {
        // 验证必要参数
        if (!params.direction) {
            return {
                code: 400,
                message: '方向不能为空',
                data: []
            };
        }

        if (!params.group) {
            return {
                code: 400,
                message: '小组不能为空',
                data: []
            };
        }

        if (!params.weeks || params.weeks <= 0) {
            return {
                code: 400,
                message: '周数必须大于0',
                data: []
            };
        }

        // 发送请求
        const res = await axios.post('/admin/selectCondition', params);

        // 转换数据，添加是否已提交的标记
        const data = Array.isArray(res.data) ? res.data.map(item => ({
            ...item,
            // 确保user_name字段存在，如果不存在则使用name或其他可用字段
            user_name: item.user_name || item.name || item.userName || `用户${item.userId}`,
            is_apply: item.finishCondition === '已完成',
            isSelect: false
        })) : [];

        return {
            code: res.code,
            message: res.msg || '获取筛选数据成功',
            data
        };
    } catch (error) {
        console.error('筛选学生作业信息失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: []
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: []
        };
    }
};