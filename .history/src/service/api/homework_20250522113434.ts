import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '../../utils/brower';

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

// 定义任务信息类型
export interface TaskInfo {
  id: string;
  title: string;
  notice: string;
  fileName: string;
  startTime: string;
  endTime: string;
  weeks: number;
  direction: string;
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
    const res = await axios.post('/user/uploadHomework', formData);

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
      data: Array.isArray(res.data) ? res.data : []
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
export const getSubmissionCount = async (userId: string, weeks: number): Promise<HomeworkResponse<SubmissionCount | null>> => {
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
 * 获取当前方向的最新作业任务
 * @param direction 方向
 * @param weeks 周数 (可选)
 * @returns Promise 包含作业任务的响应
 */
export const getRecentTask = async (direction: string, weeks?: number): Promise<HomeworkResponse<TaskInfo | null>> => {
  try {
    if (!direction) {
      return {
        code: 400,
        message: '方向不能为空',
        data: null
      };
    }

    const requestData = { direction, weeks };
    const res = await axios.post('/user/recentTask', requestData);

    return {
      code: res.code,
      message: res.msg || '获取作业任务成功',
      data: res.data as TaskInfo
    };
  } catch (error) {
    console.error('获取最新作业任务失败:', error);
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
 * 获取方向的所有历史作业任务
 * @param direction 方向
 * @returns Promise 包含所有历史作业任务的响应
 */
export const getAllTasks = async (direction: string): Promise<HomeworkResponse<TaskInfo[]>> => {
  try {
    if (!direction) {
      return {
        code: 400,
        message: '方向不能为空',
        data: []
      };
    }

    const res = await axios.post('/user/allTask', { direction });

    return {
      code: res.code,
      message: res.msg || '获取所有作业任务成功',
      data: Array.isArray(res.data) ? res.data : []
    };
  } catch (error) {
    console.error('获取所有作业任务失败:', error);
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
 * 获取当前系统周数
 * @returns Promise 包含当前周数的响应
 */
export const getCurrentWeek = async (): Promise<HomeworkResponse<number>> => {
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

/**
 * 下载作业文件
 * @param homeworkId 作业ID
 * @param fileName 文件名 (可选)
 * @returns Promise 下载结果
 */
export const downloadHomeworkFile = async (homeworkId: string, fileName?: string): Promise<void> => {
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