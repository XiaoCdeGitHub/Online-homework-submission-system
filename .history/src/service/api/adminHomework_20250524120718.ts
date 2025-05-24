import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '../../utils/brower';
import JSZip from 'jszip';
import { ElMessage } from 'element-plus';

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
        const res = await axios.post<any, any>('/admin/publishHomework', formData);

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
 * @param fileUrl 直接文件链接（如果存在则直接下载该链接）
 * @returns Promise 下载结果
 */
export const downloadHomework = async (userId: string, weeks: number, fileUrl?: string): Promise<void> => {
    try {
        if (!userId) {
            throw new Error('用户ID不能为空');
        }

        if (!weeks || weeks <= 0) {
            throw new Error('作业周数不合法');
        }

        // 如果提供了直接文件URL，则直接下载该文件
        if (fileUrl) {
            try {
                // 从URL获取文件名
                let fileName = fileUrl.split('/').pop() || `作业-${userId}-第${weeks}周`;

                // 如果不是以.开头的扩展名，添加默认扩展名
                if (!fileName.includes('.')) {
                    fileName += '.zip';
                }

                // 使用a标签直接下载
                const link = document.createElement('a');
                link.href = fileUrl;
                link.target = '_blank';
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                return;
            } catch (directDownloadError) {
                console.error('直接下载文件失败，尝试使用压缩包下载:', directDownloadError);
                // 如果直接下载失败，继续使用压缩包下载
            }
        }

        // 构建下载URL (压缩包下载)
        const downloadUrl = `/api/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

        try {
            // 使用fetch API进行文件下载
            const response = await fetch(downloadUrl);

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            // 获取Content-Type和Content-Disposition头
            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            // 尝试从Content-Disposition获取文件名
            let fileName = `作业-${userId}-第${weeks}周.zip`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1];
                }
            }

            const blob = await response.blob();

            // 确保设置正确的MIME类型
            const fileBlob = new Blob([blob], {
                type: contentType || 'application/zip'
            });

            const url = window.URL.createObjectURL(fileBlob);

            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // 清理DOM和URL对象
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (downloadError) {
            console.error('文件下载失败，尝试使用window.open方式:', downloadError);
            // 备用下载方式
            window.open(downloadUrl, '_blank');
        }
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
        const downloadUrl = `/api/admin/getFinalExcel?direction=${encodeURIComponent(direction)}&group=${encodeURIComponent(group)}&weeks=${weeks}`;

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
    weeks: number;  // 确保weeks为必填参数
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

        if (!params.weeks || params.weeks <= 0) {
            return {
                code: 400,
                message: '周数必须大于0',
                data: null
            };
        }

        // 发送请求 - 确保使用POST请求且Content-Type为application/json
        const res = await axios.post<any, any>('/admin/getGroupInfo', params);

        // 如果响应中没有studentList，尝试包装为适当的格式
        if (res.code === 200 && res.data) {
            // 检查是否是数组，但没有studentList属性
            if (Array.isArray(res.data) && !('studentList' in res.data)) {
                // 包装为适当的格式
                return {
                    code: res.code,
                    message: res.msg || '获取小组信息成功',
                    data: {
                        studentList: res.data,
                        direction: params.direction,
                        group: params.group
                    }
                };
            }
        }

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
 * 设置当前周数
 * @param {number} weekNumber - 要设置的周数
 * @returns Promise 设置结果
 */
export const setCurrentWeeks = async (weekNumber: number): Promise<AdminHomeworkResponse<number>> => {
    try {
        if (!weekNumber || weekNumber <= 0 || weekNumber > 20) {
            return {
                code: 400,
                message: '周数必须为1-20之间的正整数',
                data: 0
            };
        }

        // 发送请求
        const res = await axios.post<any, any>('/admin/setCurrentWeeks', { weeks: weekNumber });

        return {
            code: res.code,
            message: res.msg || `成功设置当前周数为${weekNumber}`,
            data: typeof res.data === 'number' ? res.data : weekNumber
        };
    } catch (error) {
        console.error('设置当前周数失败:', error);
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data?.message) {
            return {
                code: axiosError.response.status,
                message: axiosError.response.data.message,
                data: 0
            };
        }
        return {
            code: 500,
            message: axiosError.message || '系统异常，请稍后重试',
            data: 0
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
            // 修改逻辑：判断fileUrl是否为有效的URL，排除"无文件URL"等占位符
            is_apply: !!item.fileUrl && item.fileUrl !== '无文件URL' && item.fileUrl !== '无' && item.fileUrl !== '无记录',
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

/**
 * 批量下载学生作业
 * @param params 批量下载请求参数
 * @returns Promise 下载结果
 */
export const batchDownloadHomework = async (params: {
    direction: string;
    group: string;
    weeks: number;
    userIds?: string[];  // 可选参数，兼容旧调用方式
}): Promise<void> => {
    try {
        if (!params.direction) {
            throw new Error('方向不能为空');
        }

        if (!params.group) {
            throw new Error('组别不能为空');
        }

        if (!params.weeks || params.weeks <= 0) {
            throw new Error('作业周数不合法');
        }

        // 构建请求数据 - SelectHomeworkForm
        const requestData = {
            direction: params.direction,
            group: params.group,
            weeks: params.weeks
        };

        // API URL - 使用与其他下载函数一致的路径格式
        const apiUrl = `/api/admin/batchDownloadHomework`;

        try {
            // 使用fetch API发送POST请求，明确指定要响应类型为blob
            ElMessage.info('正在准备批量下载作业，请稍候...');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/zip, application/octet-stream',
                    // 添加认证令牌
                    'x-access-token': localStorage.getItem('token') || ''
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                // 提供更详细的错误信息
                let errorMsg = `批量下载失败: ${response.status} ${response.statusText}`;
                try {
                    // 尝试解析错误响应
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMsg = `批量下载失败: ${errorData.message}`;
                    }
                } catch (e) {
                    // 无法解析JSON，使用默认错误信息
                }
                throw new Error(errorMsg);
            }

            // 获取Content-Type和Content-Disposition头
            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            // 设置默认文件名
            let fileName = `第${params.weeks}周作业汇总-${params.direction}-${params.group}.zip`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"|filename=([^;]+)/);
                if (fileNameMatch) {
                    fileName = fileNameMatch[1] || fileNameMatch[2] || fileName;
                }
            }

            // 直接使用响应的blob，不进行二次封装
            const blob = await response.blob();

            // 创建对象URL
            const url = window.URL.createObjectURL(blob);

            // 创建下载链接
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // 清理DOM和URL对象
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            ElMessage.success('批量下载成功');
        } catch (downloadError: any) {
            console.error('批量下载文件失败:', downloadError);

            // 如果是404错误，给出更友好的提示
            if (downloadError.message && downloadError.message.includes('404')) {
                ElMessage.error('批量下载接口不存在，请联系管理员确认接口是否已部署');
            } else {
                ElMessage.error(`批量下载失败: ${downloadError.message || '未知错误'}`);
            }
            throw downloadError;
        }
    } catch (error: any) {
        console.error('批量下载作业失败:', error);
        ElMessage.error('批量下载失败: ' + (error.message || '未知错误'));
        throw error;
    }
};

/**
 * 获取学生作业信息（用于批量下载）
 * @param userId 学生ID
 * @param weeks 周数
 * @returns Promise 学生作业信息
 */
async function getStudentHomeworkInfo(userId: string, weeks: number): Promise<SelectHomeworkDto | null> {
    try {
        // 尝试从已有数据中查找
        // 这里可以接入缓存逻辑，避免重复请求

        // 查询作业信息
        const response = await fetch(`/api/admin/getHomeworkInfo?userId=${userId}&weeks=${weeks}`);

        if (!response.ok) {
            console.error(`获取学生${userId}作业信息失败: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.code !== 200 || !data.data) {
            console.error(`获取学生${userId}作业信息失败:`, data.message);
            return null;
        }

        return data.data;
    } catch (error) {
        console.error(`获取学生${userId}作业信息失败:`, error);
        return null;
    }
}

