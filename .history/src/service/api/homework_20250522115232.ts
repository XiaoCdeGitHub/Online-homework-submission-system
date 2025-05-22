import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '@/utils/brower';

// 定义接口响应类型
export interface HomeworkResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
// 定义上传历史记录类型
export interface SubmissionHistory {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  comments: string;
  weeks: number;
  submitTime: string;
  status: number; // 0-待审核，1-已通过，2-未通过
}

// 定义提交统计类型
export interface SubmissionCount {
  total: number;     // 总提交次数
  accepted: number;  // 已通过数量
  rejected: number;  // 未通过数量
  pending: number;   // 待审核数量
  lastSubmitTime: string; // 最后提交时间
}
// 定义可下载的作业类型
export interface AvailableHomework {
  id: string;       // 作业ID
  title: string;    // 作业标题
  notice: string;   // 作业说明
  fileName: string; // 文件名
  fileUrl: string;  // 文件URL
  startTime: string; // 开始时间
  endTime: string;   // 截止时间
  weeks: number;     // 周数
  direction: string; // 方向
  isSubmitted: boolean; // 是否已提交
}
/**
 * 上传作业
 * @param formData 包含作业文件和相关信息的FormData对象
 * @returns Promise 上传结果
 */
export const uploadHomework = async (formData: FormData): Promise<HomeworkResponse> => {
  try {
    // 确保包含必要的参数
    if (!formData.get('file')) {
      return {
        code: 400,
        message: '上传文件不能为空',
        data: null
      };
    }

    if (!formData.get('userId')) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      };
    }

    if (!formData.get('weeks')) {
      return {
        code: 400,
        message: '作业周数不能为空',
        data: null
      };
    }

    // 发送上传请求
    const res = await axios.post('/user/uploadHomework', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return {
      code: res.code,
      message: res.msg || '上传成功',
      data: res.data
    };

  } catch (error) {
    console.error('作业上传失败:', error);
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
 * 获取历史提交记录
 * @param userId 用户ID
 * @returns Promise 包含历史提交记录的响应
 */
export const getHistorySubmit = async (userId: string): Promise<HomeworkResponse<SubmissionHistory[]>> => {
  try {
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: []
      };
    }

    const res = await axios.post('/user/historySubmit', { userId });

    return {
      code: res.code,
      message: res.msg || '获取历史记录成功',
      data: res.data as SubmissionHistory[]
    };
  } catch (error) {
    console.error('获取历史提交记录失败:', error);
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
 * 获取作业提交统计信息
 * @param userId 用户ID
 * @param weeks 周数
 * @returns Promise 包含提交统计信息的响应
 */
export const getSubmissionCount = async (userId: string, weeks: number): Promise<HomeworkResponse<SubmissionCount>> => {
  try {
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      };
    }

    if (!weeks || weeks <= 0) {
      return {
        code: 400,
        message: '作业周数不合法',
        data: null
      };
    }

    const res = await axios.post('/user/getCount', { userId, weeks });

    return {
      code: res.code,
      message: res.msg || '获取统计信息成功',
      data: res.data as SubmissionCount
    };
  } catch (error) {
    console.error('获取提交统计信息失败:', error);
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
 * 获取可下载的作业列表
 * @param userId 用户ID
 * @param direction 用户方向
 * @returns Promise 包含作业列表的响应
 */
export const getAvailableHomeworks = async (userId: string, direction: string): Promise<HomeworkResponse<AvailableHomework[]>> => {
  try {
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: []
      };
    }

    // 发送请求获取可下载的作业
    const res = await axios.get(`/user/availableHomeworks?userId=${userId}&direction=${encodeURIComponent(direction)}`);

    return {
      code: res.code,
      message: res.msg || '获取作业列表成功',
      data: res.data || []
    };
  } catch (error) {
    console.error('获取可下载作业列表失败:', error);
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
 * 下载作业文件
 * @param homeworkId 作业ID
 * @param fileName 文件名
 * @returns Promise 下载结果
 */
export const downloadHomeworkFile = async (homeworkId: string, fileName: string): Promise<void> => {
  try {
    if (!homeworkId) {
      throw new Error('作业ID不能为空');
    }

    // 构建下载URL
    const downloadUrl = `/user/downloadHomework?homeworkId=${homeworkId}`;
    
    // 使用前端下载功能，获取文件二进制流并触发下载
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '下载失败');
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    loadFile(objectUrl, fileName || `作业-${homeworkId}.zip`);
    
  } catch (error) {
    console.error('作业下载失败:', error);
    throw error;
  }
}; 