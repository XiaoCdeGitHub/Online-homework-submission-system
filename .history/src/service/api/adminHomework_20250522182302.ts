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
            // 使用fetch API进行文件下载，明确指定要响应类型为blob
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/zip, application/octet-stream'
                }
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status} ${response.statusText}`);
            }

            // 获取Content-Type和Content-Disposition头
            const contentType = response.headers.get('Content-Type');
            const contentDisposition = response.headers.get('Content-Disposition');

            // 尝试从Content-Disposition获取文件名
            let fileName = `作业-${userId}-第${weeks}周.zip`;
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
 * 批量下载学生作业
 * @param userIds 学生用户ID数组
 * @param weeks 作业周数
 * @returns Promise 下载结果
 */
export const batchDownloadHomework = async (userIds: string[], weeks: number): Promise<void> => {
    try {
        if (!userIds || userIds.length === 0) {
            throw new Error('学生ID列表不能为空');
        }

        if (!weeks || weeks <= 0) {
            throw new Error('作业周数不合法');
        }

        // 创建进度提示
        ElMessage.info(`正在准备下载${userIds.length}个文件，请稍候...`);

        // 创建一个新的JSZip实例
        const zip = new JSZip();
        const fileName = `第${weeks}周作业汇总.zip`;

        // 追踪成功和失败的下载
        let successCount = 0;
        let failCount = 0;

        // 顺序下载每个学生的作业并添加到zip中
        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            try {
                // 获取学生作业信息，包含实际文件URL
                const homeworkInfo = await getStudentHomeworkInfo(userId, weeks);

                if (!homeworkInfo || !homeworkInfo.fileUrl) {
                    console.error(`学生 ${userId} 没有可下载的作业`);
                    failCount++;
                    continue;
                }

                // 构建下载URL
                const downloadUrl = homeworkInfo.fileUrl.startsWith('http')
                    ? homeworkInfo.fileUrl
                    : `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

                // 下载文件
                const response = await fetch(downloadUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/zip, application/octet-stream'
                    }
                });

                if (!response.ok) {
                    console.error(`下载学生 ${userId} 的作业失败: ${response.status} ${response.statusText}`);
                    failCount++;
                    continue;
                }

                // 获取文件blob
                const blob = await response.blob();

                // 生成文件名
                const studentName = homeworkInfo.user_name || `学生${userId}`;
                const fileExt = getFileExtension(homeworkInfo.fileUrl || '');
                const studentFileName = `${studentName}-第${weeks}周作业${fileExt}`;

                // 添加文件到zip
                zip.file(studentFileName, blob);
                successCount++;

                // 更新进度提示
                if (i % 3 === 0 || i === userIds.length - 1) {
                    ElMessage.info(`正在打包: ${i + 1}/${userIds.length}`);
                }
            } catch (error) {
                console.error(`处理学生 ${userId} 的作业时出错:`, error);
                failCount++;
            }
        }

        if (successCount === 0) {
            ElMessage.error('没有成功下载任何文件，无法创建压缩包');
            return;
        }

        // 生成zip文件
        ElMessage.info('正在生成压缩包，请稍候...');
        const content = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 5 }
        });

        // 创建下载链接
        const url = window.URL.createObjectURL(content);
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

        // 显示结果消息
        if (failCount > 0) {
            ElMessage.warning(`已完成下载！成功: ${successCount}，失败: ${failCount}`);
        } else {
            ElMessage.success(`成功下载并打包${successCount}个文件`);
        }
    } catch (error: any) {
        console.error('批量下载作业失败:', error);
        ElMessage.error('批量下载失败: ' + (error.message || '未知错误'));
        throw error;
    }
};

/**
 * 从文件URL或文件名中获取文件扩展名
 * @param fileUrl 文件URL或文件名
 * @returns 文件扩展名，包括点(.)
 */
function getFileExtension(fileUrl: string): string {
    if (!fileUrl) return '.zip';

    // 从URL或文件路径中提取文件名
    const fileName = fileUrl.split('/').pop() || '';

    // 提取扩展名
    const extMatch = fileName.match(/\.[^.]+$/);
    return extMatch ? extMatch[0] : '.zip';
}

/**
 * 获取学生作业信息（用于批量下载）
 * @param userId 学生ID
 * @param weeks 周数
 * @returns Promise 学生作业信息
 */
async function getStudentHomeworkInfo(userId: string, weeks: number): Promise<SelectHomeworkDto | null> {
    try {
        // 尝试从API获取学生作业信息
        try {
            // 首先尝试使用专门的接口获取作业信息
            const response = await fetch(`/admin/getHomeworkInfo?userId=${userId}&weeks=${weeks}`);

            if (response.ok) {
                const data = await response.json();
                if (data.code === 200 && data.data) {
                    return data.data;
                }
            }

            // 如果专门接口失败，尝试从selectCondition接口获取单个学生信息
            console.log(`尝试通过selectCondition获取学生${userId}的作业信息`);

            // 查询该学生的条件筛选
            const conditionResponse = await axios.post('/admin/selectCondition', {
                userId: userId,
                weeks: weeks
            });

            if (conditionResponse && conditionResponse.data && Array.isArray(conditionResponse.data)) {
                const studentData = conditionResponse.data.find(item => item.userId === userId);
                if (studentData) {
                    return {
                        ...studentData,
                        is_apply: studentData.finishCondition === '已完成',
                        user_name: studentData.user_name || studentData.name || `学生${userId}`
                    };
                }
            }

            // 如果还是找不到，返回基本信息
            return {
                userId: userId,
                user_name: `学生${userId}`,
                fileUrl: `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`,
                comments: '',
                submitTime: new Date().toISOString(),
                group: '',
                direction: '',
                weeks: weeks,
                finishCondition: '未知',
                is_apply: true // 假设可以下载
            };
        } catch (apiError) {
            console.error(`通过API获取学生${userId}作业信息失败:`, apiError);

            // 如果所有API都失败，使用默认URL
            return {
                userId: userId,
                user_name: `学生${userId}`,
                fileUrl: `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`,
                comments: '',
                submitTime: new Date().toISOString(),
                group: '',
                direction: '',
                weeks: weeks,
                finishCondition: '未知',
                is_apply: true // 假设可以下载
            };
        }
    } catch (error) {
        console.error(`获取学生${userId}作业信息失败:`, error);
        return null;
    }
}

