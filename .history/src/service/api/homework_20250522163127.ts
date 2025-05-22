import axios from '../myAxios';
import type { AxiosError, AxiosProgressEvent } from 'axios';

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
  submissionCount: number;     // 总提交次数
  isSubmittedThisWeek: number; // 是否已提交本周作业 (0或1)
  comments: string;            // 提交备注
  submitTime: string;          // 提交时间
}

/**
 * 上传作业
 * @param formData 包含作业文件和相关信息的FormData对象
 * @returns Promise 上传结果
 */
export const uploadHomework = async (formData: FormData): Promise<HomeworkResponse> => {
  try {
    // 获取FormData中的数据
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const comments = formData.get('comments') as string;
    const weeks = formData.get('weeks') as string;
    const submitTime = formData.get('submitTime') as string;

    // 验证必要的字段
    if (!file) {
      return {
        code: 400,
        message: '请选择要上传的文件',
        data: null
      };
    }

    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: null
      };
    }

    if (!weeks) {
      return {
        code: 400,
        message: '作业周数不能为空',
        data: null
      };
    }

    // 构建请求数据
    const reqData = new FormData();
    reqData.append('file', file);
    reqData.append('userId', userId);
    reqData.append('weeks', weeks);
    reqData.append('submitTime', submitTime || new Date().toISOString());

    // 始终添加comments字段，如果为空则使用默认值
    reqData.append('comments', comments?.trim() || '无备注');

    // 发送上传请求
    const res = await axios.post('/user/uploadHomework', reqData);

    return {
      code: res.code,
      message: res.msg || '上传成功',
      data: res.data
    };

  } catch (error) {
    console.error('作业上传失败:', error);
    const axiosError = error as AxiosError<any>;

    // 改进错误提示，特别是404错误
    if (axiosError.response) {
      if (axiosError.response.status === 404) {
        return {
          code: 404,
          message: '上传接口不存在，请联系管理员检查服务器配置',
          data: null
        };
      }

      if (axiosError.response?.data?.message) {
        return {
          code: axiosError.response.status,
          message: axiosError.response.data.message,
          data: null
        };
      }
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

    const res = await axios.post<any, any>('/user/historySubmit', { userId });

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
 * 获取提交统计信息
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

    console.log(`请求提交统计 - 用户ID: ${userId}, 周数: ${weeks}`);
    const res = await axios.post<any, any>('/user/getCount', { userId, weeks });
    console.log('原始API响应:', res);

    // 如果返回数据格式不一致，尝试适配
    let data: SubmissionCount = {
      submissionCount: 0,
      isSubmittedThisWeek: 0,
      comments: '',
      submitTime: ''
    };

    if (res.data) {
      // 直接使用API返回的字段
      data = {
        submissionCount: res.data.submissionCount ?? 0,
        isSubmittedThisWeek: res.data.isSubmittedThisWeek ?? 0,
        comments: res.data.comments ?? '',
        submitTime: res.data.submitTime ?? ''
      };

      // 如果返回的格式不完全一致，尝试使用替代字段
      if (data.isSubmittedThisWeek === undefined && res.data.status !== undefined) {
        data.isSubmittedThisWeek = res.data.status === 'submitted' ? 1 : 0;
      }

      if (data.submissionCount === undefined && res.data.total !== undefined) {
        data.submissionCount = res.data.total;
      }

      console.log('转换后的数据:', data);
    }

    return {
      code: res.code,
      message: res.msg || '获取统计信息成功',
      data
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

// 定义作业项目接口
export interface HomeworkItem {
  id: string;
  title: string;
  notice: string;
  fileName: string;
  fileUrl: string;
  startTime: string;
  endTime: string;
  weeks: number;
  direction: string;
  isSubmitted: boolean;
}

// 定义文件响应接口
interface FileResponse {
  filename?: string;
  [key: string]: any;
}

/**
 * 获取可用的作业列表
 * @param userId 用户ID
 * @param direction 方向（如前端、后端等）
 * @returns Promise 包含作业列表的响应
 */
export const getAvailableHomeworks = async (userId: string, direction: string): Promise<HomeworkResponse<HomeworkItem[]>> => {
  try {
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: []
      };
    }

    if (!direction) {
      return {
        code: 400,
        message: '方向不能为空',
        data: []
      };
    }

    // 使用/user/allTask接口获取所有任务
    const res = await axios.post<any, any>('/user/allTask', {
      userId,
      direction
    });

    return {
      code: res.code,
      message: res.msg || '获取作业列表成功',
      data: Array.isArray(res.data) ? res.data : []
    };
  } catch (error) {
    console.error('获取作业列表失败:', error);
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
 * @param fileName 文件名（可选）
 * @returns Promise 下载结果
 */
export const downloadHomeworkFile = async (homeworkId: string, fileName?: string): Promise<void> => {
  try {
    if (!homeworkId) {
      throw new Error('作业ID不能为空');
    }

    // 构建下载URL
    const downloadUrl = `/user/downloadHomework?id=${homeworkId}`;

    // 如果没有提供文件名，从后端获取
    let finalFileName = fileName;
    if (!finalFileName) {
      try {
        const response = await axios.get<FileResponse, any>(`${downloadUrl}&getFilename=true`);
        if (response && response.data) {
          finalFileName = response.data.filename || `作业-${homeworkId}.zip`;
        } else {
          finalFileName = `作业-${homeworkId}.zip`;
        }
      } catch (error) {
        console.error('获取文件名失败，使用默认文件名:', error);
        finalFileName = `作业-${homeworkId}.zip`;
      }
    }

    // 使用浏览器下载文件
    try {
      // 使用fetch API进行文件下载
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // 创建下载链接
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalFileName);
      document.body.appendChild(link);
      link.click();

      // 清理DOM和URL对象
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('文件下载失败，尝试使用window.open方式:', downloadError);
      // 备用下载方式
      window.open(downloadUrl, '_blank');
    }

  } catch (error) {
    console.error('下载作业失败:', error);
    throw error;
  }
};

// 定义任务类型
export interface HomeworkTask {
  id: string;
  title: string;
  notice: string;
  fileName: string;
  fileUrl: string;
  startTime: string;
  endTime: string;
  weeks: number;
  direction: string;
  isActive: boolean;
}

/**
 * 获取该方向的本周任务
 * @param userId 用户ID（实际不需要发送到服务器）
 * @param direction 方向（如前端、后端等）
 * @param weeks 当前周数，不传则获取最新周数的任务
 * @returns Promise 包含本周任务的响应
 */
export const getRecentTask = async (userId: string, direction: string, weeks?: number): Promise<HomeworkResponse<HomeworkTask | null>> => {
  try {
    // 只检查direction是否为空，userId不再使用
    if (!direction) {
      return {
        code: 400,
        message: '方向不能为空',
        data: null
      };
    }

    // 构建请求参数，按照正确的格式
    const requestData: any = {
      direction
    };

    // 如果提供了周数且大于0，添加到请求参数中
    if (weeks !== undefined && weeks > 0) {
      requestData.weeks = weeks;
    }

    console.log('发送请求到/user/recentTask，参数:', requestData);

    try {
      const res = await axios.post<any, any>('/user/recentTask', requestData);

      // 确保响应中的msg字段被映射到message
      return {
        code: res.code,
        message: res.msg || '获取本周任务成功', // 只使用msg字段
        data: res.data
      };
    } catch (innerError) {
      console.error('API请求失败:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('获取本周任务失败:', error);
    const axiosError = error as AxiosError<any>;
    if (axiosError.response?.data?.message || axiosError.response?.data?.msg) {
      return {
        code: axiosError.response.status,
        message: axiosError.response.data.message || axiosError.response.data.msg || '请求失败',
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
 * 获取该方向的全部任务
 * @param userId 用户ID
 * @param direction 方向（如前端、后端等）
 * @returns Promise 包含全部任务的响应
 */
export const getAllTasks = async (userId: string, direction: string): Promise<HomeworkResponse<HomeworkTask[]>> => {
  try {
    if (!userId) {
      return {
        code: 400,
        message: '用户ID不能为空',
        data: []
      };
    }

    if (!direction) {
      return {
        code: 400,
        message: '方向不能为空',
        data: []
      };
    }

    const res = await axios.post<any, any>('/user/allTask', {
      userId,
      direction
    });

    return {
      code: res.code,
      message: res.msg || '获取全部任务成功',
      data: Array.isArray(res.data) ? res.data : []
    };
  } catch (error) {
    console.error('获取全部任务失败:', error);
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