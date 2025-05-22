import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '../../utils/brower';

// 定义接口响应类型
export interface HomeworkResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 定义学生作业提交信息
export interface StudentSubmission {
  id: string;
  userId: string;
  studentName: string;
  group: string;
  fileName: string;
  fileUrl: string;
  comments: string;
  weeks: number;
  submitTime: string;
  status: number; // 0-待审核，1-已通过，2-未通过
}

// 定义小组提交统计信息
export interface GroupSubmissionStat {
  groupName: string;
  totalCount: number;
  submittedCount: number;
  passedCount: number;
  passRate: number;
}

/**
 * 管理员发布作业
 * @param formData 包含作业文件和相关信息的FormData对象
 * @returns Promise 发布结果
 */
export const publishHomework = async (formData: FormData): Promise<HomeworkResponse> => {
  try {
    // 验证必要参数
    if (!formData.get('file')) {
      return {
        code: 400,
        message: '上传文件不能为空',
        data: null
      };
    }

    // 验证其他必要字段
    const requiredFields = ['notice', 'startTime', 'endTime', 'weeks', 'direction'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return {
          code: 400,
          message: `${field} 不能为空`,
          data: null
        };
      }
    }

    // 发送请求
    const res = await axios.post('/admin/publishHomework', formData);

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
 * 管理员下载学生提交的作业
 * @param userId 学生用户ID
 * @param weeks 作业周数
 * @param fileName 下载后的文件名（可选）
 * @returns Promise 下载结果
 */
export const downloadHomework = async (userId: string, weeks: number, fileName?: string): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('学生ID不能为空');
    }

    if (!weeks || weeks <= 0) {
      throw new Error('作业周数不合法');
    }

    // 构建下载URL
    const downloadUrl = `/admin/downloadHomework?userId=${userId}&weeks=${weeks}`;

    // 发起下载请求
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '下载失败');
    }

    // 提取服务器返回的文件名（如果存在）
    const contentDisposition = response.headers.get('Content-Disposition');
    let serverFileName = '';
    if (contentDisposition) {
      const matches = /filename=(.+)$/.exec(contentDisposition);
      if (matches && matches.length > 1) {
        serverFileName = decodeURIComponent(matches[1]);
      }
    }

    // 使用优先级：传入的文件名 > 服务器返回的文件名 > 默认文件名
    const finalFileName = fileName || serverFileName || `学生作业-${userId}-第${weeks}周.zip`;

    // 下载文件
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    loadFile(objectUrl, finalFileName);
  } catch (error) {
    console.error('下载学生作业失败:', error);
    throw error;
  }
};

/**
 * 条件查询作业提交情况
 * @param params 查询参数
 * @returns Promise 查询结果
 */
export const selectCondition = async (params: {
  direction?: string;
  group?: string;
  weeks?: number;
  status?: number;
  keyword?: string;
}): Promise<HomeworkResponse<StudentSubmission[]>> => {
  try {
    const res = await axios.post('/admin/selectCondition', params);

    return {
      code: res.code,
      message: res.msg || '查询成功',
      data: Array.isArray(res.data) ? res.data : []
    };
  } catch (error) {
    console.error('查询作业提交情况失败:', error);
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
 * 导出作业报告（Excel文件）
 * @param direction 方向
 * @param group 小组
 * @param weeks 周数
 * @returns Promise 导出结果
 */
export const getFinalExcel = async (direction: string, group: string, weeks: number): Promise<void> => {
  try {
    if (!direction) {
      throw new Error('方向不能为空');
    }

    if (!group) {
      throw new Error('小组不能为空');
    }

    if (!weeks || weeks <= 0) {
      throw new Error('作业周数不合法');
    }

    // 构建下载URL
    const downloadUrl = `/admin/getFinalExcel?direction=${encodeURIComponent(direction)}&group=${encodeURIComponent(group)}&weeks=${weeks}`;

    // 发起下载请求
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '导出失败');
    }

    // 使用预期的文件名格式
    const fileName = `${direction}${group}-作业情况统计.xlsx`;

    // 下载文件
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    loadFile(objectUrl, fileName);
  } catch (error) {
    console.error('导出作业报告失败:', error);
    throw error;
  }
};

/**
 * 获取小组作业提交统计
 * @param params 查询参数
 * @returns Promise 统计结果
 */
export const getGroupInfo = async (params: {
  direction?: string;
  weeks?: number;
}): Promise<HomeworkResponse<GroupSubmissionStat[]>> => {
  try {
    const res = await axios.post('/admin/getGroupInfo', params);

    return {
      code: res.code,
      message: res.msg || '获取统计信息成功',
      data: Array.isArray(res.data) ? res.data : []
    };
  } catch (error) {
    console.error('获取小组统计信息失败:', error);
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
 * 获取当前周数
 * @returns Promise 包含当前周数的响应
 */
export const getCurrentWeeks = async (): Promise<HomeworkResponse<number>> => {
  try {
    const res = await axios.get('/admin/getCurrentWeeks');

    return {
      code: 200,
      message: '获取当前周数成功',
      data: typeof res.data === 'number' ? res.data : 1
    };
  } catch (error) {
    console.error('获取当前周数失败:', error);
    return {
      code: 500,
      message: '获取当前周数失败，使用默认值',
      data: 1
    };
  }
}; 