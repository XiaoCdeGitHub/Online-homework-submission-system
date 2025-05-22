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
        const downloadUrl = `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

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

/**
 * 批量下载学生作业 (前端合并下载)
 * @param userIds 学生用户ID数组
 * @param weeks 作业周数
 * @param studentNames 学生姓名数组 (与userIds一一对应)
 * @param studentData 可选的学生作业数据（如果已有数据，可以直接传入避免重复请求）
 * @returns Promise 下载结果
 */
export const batchDownloadHomework = async (
    userIds: string[],
    weeks: number,
    studentNames: string[] = [],
    studentData: SelectHomeworkDto[] = []
): Promise<void> => {
    try {
        if (!userIds || userIds.length === 0) {
            throw new Error('学生ID列表不能为空');
        }

        if (!weeks || weeks <= 0) {
            throw new Error('作业周数不合法');
        }

        // 显示进度提示
        ElMessage.info(`开始准备下载${userIds.length}个文件，请稍候...`);

        // 创建一个ZIP压缩包实例
        const zip = new JSZip();

        // 下载进度计数
        let completedCount = 0;
        let failedCount = 0;

        // 为每个用户创建一个Promise来下载文件
        const downloadPromises = userIds.map(async (userId, index) => {
            const studentName = (studentNames[index] || userId).replace(/[^\w\u4e00-\u9fa5]/g, '_');

            try {
                // 不再直接使用fileUrl，而是通过后端接口下载
                // 通过/admin/downloadHomework接口获取文件内容
                const downloadUrl = `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

                // 直接使用fetch API下载
                const response = await fetch(downloadUrl);

                if (!response.ok) {
                    failedCount++;
                    return `失败: ${studentName}的文件下载失败(${response.status} ${response.statusText})`;
                }

                // 使用文件内容创建blob
                const blob = await response.blob();

                // 获取Content-Disposition头获取文件名
                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = `作业-${userId}-第${weeks}周.zip`;

                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (fileNameMatch && fileNameMatch[1]) {
                        fileName = fileNameMatch[1];
                    }
                } else {
                    // 从传入的studentData中查找学生信息，尝试获取文件名
                    if (studentData && studentData.length > 0) {
                        const foundStudent = studentData.find(item => item.userId === userId);
                        if (foundStudent && foundStudent.fileUrl) {
                            const urlFileName = foundStudent.fileUrl.split('/').pop();
                            if (urlFileName) {
                                fileName = urlFileName;
                            }
                        }
                    }
                }

                // 确保文件名有扩展名
                if (!fileName.includes('.')) {
                    fileName += '.zip';
                }

                // 添加到zip包中，使用学生姓名作为前缀
                zip.file(`${studentName}-${fileName}`, blob);

                completedCount++;
                return `成功: ${studentName}`;
            } catch (error: any) {
                console.error(`下载${studentName}的文件失败:`, error);
                failedCount++;
                return `失败: ${studentName} - ${error.message || '未知错误'}`;
            }
        });

        // 等待所有下载完成
        const results = await Promise.all(downloadPromises);
        console.log('下载结果:', results);

        // 如果没有下载成功的文件，则报错
        if (completedCount === 0) {
            throw new Error('没有文件下载成功，请检查网络连接或文件权限');
        }

        // 显示下载进度
        ElMessage.success(`已成功处理${completedCount}个文件${failedCount > 0 ? `，${failedCount}个失败` : ''}`);

        // 生成ZIP文件内容
        const zipContent = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 6 // 压缩级别 (0-9)
            }
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(zipContent);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `第${weeks}周作业汇总.zip`);
        document.body.appendChild(link);

        // 点击链接下载
        link.click();

        // 清理DOM和URL对象
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (error: any) {
        console.error('批量下载作业失败:', error);
        ElMessage.error(`批量下载失败: ${error.message || '未知错误'}`);
        throw error;
    }
};