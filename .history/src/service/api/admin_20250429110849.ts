/*
 * @Author: cuiding 1692338302@qq.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding 1692338302@qq.com
 * @LastEditTime: 2025-04-11 21:22:22
 * @FilePath: /YunJiaoYunJi-master/src/service/api/admin.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from '../myAxios';
import type { AxiosError } from 'axios';

// 定义接口类型
export interface AdminResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface UserInfo {
  created_at: string | null;
  deleted: number;
  direction: string | null;
  group: string | null;
  isSubmittedThisWeek: boolean | null;
  name: string;
  number: number | null;
  password: string | null;
  qqnum: string | null;
  status: number;
  submissionCount: number | null;
  update_at: string | null;
  userId: string;
  version: number | null;
}

export interface JobsParams {
  title: string;
  content: string;
  deadline: string;
}

export interface NewsReqForm {
  any: any;
}
export interface DeNewReqForm {
  params: {
    article_id: any;
  };
}
export interface Jobs {
  params: any;
}

export const publicJobs = async (params: JobsParams): Promise<AdminResponse> => {
  const res = await axios.post('/admin/publishHomework', params);
  return {
    code: res.code,
    message: res.msg || '操作成功',
    data: res.data
  };
}
// //拉取所有注册信息 ok

export const getUserData = async (): Promise<AdminResponse<UserInfo[]>> => {
  const res = await axios.get('/admin/selectAllUsers');
  return {
    code: res.code,
    message: res.msg || '操作成功',
    data: res.data as UserInfo[]
  };
}
// //通过注册申请 ok

export const updateStatus = async (userIds: string[]): Promise<AdminResponse> => {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        code: 400,
        message: '请选择要审核的用户',
        data: null
      };
    }

    // 确保所有ID都是非空字符串
    const validIds = userIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) {
      return {
        code: 400,
        message: '没有有效的用户ID',
        data: null
      };
    }

    // 直接发送 ID 数组
    const res = await axios.post('/admin/passRequest', validIds);

    return {
      code: res.code,
      message: res.msg || '审核成功',
      data: res.data
    };
  } catch (error) {
    console.error('审核用户失败:', error);
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
      message: axiosError.message || '系统错误，请稍后重试',
      data: null
    };
  }
}

/**
 * 删除用户
 * @param userIds 用户ID列表
 * @returns Promise
 */
export const deleteUser = async (userIds: string[]): Promise<AdminResponse> => {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        code: 400,
        message: '请选择要删除的用户',
        data: null
      };
    }

    // 确保所有ID都是非空字符串
    const validIds = userIds.filter(id => typeof id === 'string' && id.trim().length > 0);
    if (validIds.length === 0) {
      return {
        code: 400,
        message: '没有有效的用户ID',
        data: null
      };
    }

    // 使用与updateStatus相同的模式
    const res = await axios.post('/admin/deleteUsers', validIds);

    return {
      code: res.code,
      message: res.msg || '删除成功',
      data: res.data
    };
  } catch (error) {
    console.error('删除用户失败:', error);
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
      message: axiosError.message || '系统错误，请稍后重试',
      data: null
    };
  }
}
// //获取搜索到的结果
export const getSearchList = async (params: { word: string }): Promise<AdminResponse<UserInfo[]>> => {
  const res = await axios.post('user/fuzzy/student', params);
  return {
    code: res.code,
    message: res.msg || '操作成功',
    data: res.data as UserInfo[]
  };
}
// //获取过滤结果

export const getFilter = async (params: { direction?: string; group?: string }): Promise<AdminResponse<UserInfo[]>> => {
  const res = await axios.post('/admin/selectCondition', params);
  return {
    code: res.code,
    message: res.msg || '操作成功',
    data: res.data as UserInfo[]
  };
}

export const fuzzyStudents = async (params: { word: string }): Promise<AdminResponse<UserInfo[]>> => {
  const res = await axios.post('user/fuzzy/student', params);
  return {
    code: res.code,
    message: res.msg || '操作成功',
    data: res.data as UserInfo[]
  };
}

/**
 * 模糊搜索用户
 * @param information 搜索关键词
 * @returns Promise 返回搜索结果
 */
export const likeSearch = async (information: string): Promise<AdminResponse<UserInfo[]>> => {
  try {
    if (!information || information.trim() === '') {
      return {
        code: 400,
        message: '搜索关键词不能为空',
        data: []
      };
    }

    const res = await axios.get('/admin/likeSearch', {
      params: { information }
    });

    return {
      code: res.code,
      message: res.msg || '搜索成功',
      data: res.data as UserInfo[]
    };
  } catch (error) {
    console.error('搜索用户失败:', error);
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
      message: axiosError.message || '系统错误，请稍后重试',
      data: []
    };
  }
}

// export const download = async (params: { fileId: string }): Promise<AdminResponse<Blob>> => {
//   const res = await axios({
//     method: 'post',
//     url: '/download',
//     data: params,
//     responseType: 'blob',
//     headers: { 'Content-Type': 'application/json' }
//   });
//   return {
//     code: res.code,
//     message: res.msg || '操作成功',
//     data: res.data instanceof Blob ? res.data : new Blob([res.data as BlobPart])
//   };
// }
