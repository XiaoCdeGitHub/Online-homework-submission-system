import axios from '../myAxios';
import { AxiosError } from 'axios';

export interface UserInfoResponse {
    code: number;
    message: string;
    data: {
        id?: string;
        name?: string;
        number?: number;
        direction?: string;
        group?: string;
        qqnum?: string;
        period?: string;
        isAdmin?: boolean;
        [key: string]: any;
    } | null;
}

/**
 * 获取用户详细信息
 * @param userId 用户ID或学号
 * @returns 用户详细信息，包括组别等
 */
export const getUserInfo = async (userId: string | number): Promise<UserInfoResponse> => {
    try {
        if (!userId) {
            return {
                code: 400,
                message: '用户ID不能为空',
                data: null
            };
        }

        const response = await axios.get(`/user/info/${userId}`);

        return {
            code: response.code,
            message: response.msg || '获取用户信息成功',
            data: response.data
        };
    } catch (error) {
        console.error('获取用户信息失败:', error);
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