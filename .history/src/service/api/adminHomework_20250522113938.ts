import axios from '../myAxios';
import type { AxiosError } from 'axios';
import { loadFile } from '@/utils/brower';

// 定义接口响应类型
export interface AdminHomeworkResponse<T = any> {
  code: number;
  message: string;
  data: T;
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