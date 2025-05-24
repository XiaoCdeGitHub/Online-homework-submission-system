import axios from 'axios';
import type {
  AxiosInstance,
  AxiosError,
  AxiosRequestHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { ElMessage } from 'element-plus';
import { showMessage } from './status';
// 数据返回的接口
// 定义请求响应参数，不含data
interface Result {
  code: number;
  msg: string;
}

// 请求响应参数，包含data
interface ResultData<T = any> extends Result {
  data?: T;
}
const isProduction = import.meta.env.MODE === 'production';
console.log(import.meta.env.MODE);
const URL: string = isProduction ? import.meta.env.VITE_AXIOS_URL : '/api';
// const URL: string = 'http://yjyjtop.natapp1.cc/';

enum RequestEnums {
  TIMEOUT = 20000,
  OVERDUE = 600, // 登录失效
  FAIL = 999, // 请求失败
  SUCCESS = 200, // 请求成功
}
const config = {
  // 默认地址
  baseURL: URL as string,
  // 设置超时时间
  timeout: RequestEnums.TIMEOUT as number,
  // 跨域时候允许携带凭证
  // withCredentials: true
};
console.log('config', config);
class RequestHttp {
  // 定义成员变量并指定类型
  service: AxiosInstance;
  public constructor(config: AxiosRequestConfig) {
    // 实例化axios
    this.service = axios.create(config);
    /**
     * 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     * token校验(JWT) : 接受服务器返回的token,存储到vuex/pinia/本地储存当中
     */
    // interface AxiosConfig extends AxiosRequestConfig {
    //   params?: {};
    // }
    // interface Config extends AxiosConfig {
    //   headers?: AxiosRequestHeaders;
    // }
    interface Headers extends AxiosRequestHeaders {
      'x-access-token'?: string;
    }

    this.service.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const token = localStorage.getItem('token') || '';
        return {
          ...config,
          headers: {
            'x-access-token': token, // 请求头中携带token信息
          } as Headers,
        };
      },
      (error: AxiosError) => {
        // 请求报错
        Promise.reject(error);
      },
    );

    /**
     * 响应拦截器
     * 服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data, config } = response; // 解构
        console.log('config', config);
        if (data.code === RequestEnums.OVERDUE) {
          //登录信息失效，应跳转到登录页面，并清空本地的token
          localStorage.setItem('token', '');
          //router.replace({
          //path: '/login'
          //})
          return Promise.reject(data);
        }
        // 全局错误信息拦截（防止下载文件得时候返回数据流，没有code，直接报错）
        if (data.code && data.code !== RequestEnums.SUCCESS) {
          // ElMessage.error(data); // 此处也可以使用组件提示报错信息
          return Promise.reject(data);
        }
        return data;
      },
      (error: AxiosError) => {
        const { response } = error;
        if (response) {
          showMessage(response.status);
          return Promise.reject(error);
        }
        if (!window.navigator.onLine) {
          ElMessage.error('网络连接失败');
          return Promise.reject(new Error('网络连接失败'));
        }
        return Promise.reject(error);
      },
    );
  }

  // 常用方法封装
  get<T, V>(url: string, params?: V): Promise<ResultData<T>> {
    return this.service.get(url, { params })
      .catch((error: AxiosError) => {
        // 处理常见错误情况
        if (error.response) {
          if (error.response.status === 404) {
            ElMessage.error(`请求的接口 [${url}] 不存在，请联系管理员检查系统配置`);
            console.error(`接口不存在: ${url}`, error);
          } else if (error.response.status === 400) {
            ElMessage.error('请求参数错误，请检查您的输入');
            console.error(`请求参数错误: ${url}`, error);
          } else if (error.response.status === 401) {
            ElMessage.error('您的登录已过期，请重新登录');
            localStorage.removeItem('token');
            // 可以在这里添加跳转到登录页的逻辑
          } else if (error.response.status === 500) {
            ElMessage.error('服务器内部错误，请稍后再试');
            console.error(`服务器错误: ${url}`, error);
          }
        } else if (error.request) {
          ElMessage.error('网络请求失败，请检查您的网络连接');
          console.error(`网络请求失败: ${url}`, error);
        } else {
          ElMessage.error('请求配置错误');
          console.error(`请求配置错误: ${url}`, error);
        }
        
        // 继续抛出错误，由业务代码处理
        throw error;
      });
  }
  
  post<T, D>(url: string, params?: D): Promise<ResultData<T>> {
    return this.service.post(url, params)
      .catch((error: AxiosError) => {
        // 处理常见错误情况
        if (error.response) {
          if (error.response.status === 404) {
            ElMessage.error(`请求的接口 [${url}] 不存在，请联系管理员检查系统配置`);
            console.error(`接口不存在: ${url}`, error);
          } else if (error.response.status === 400) {
            ElMessage.error('请求参数错误，请检查您的输入');
            console.error(`请求参数错误: ${url}`, error);
          } else if (error.response.status === 401) {
            ElMessage.error('您的登录已过期，请重新登录');
            localStorage.removeItem('token');
            // 可以在这里添加跳转到登录页的逻辑
          } else if (error.response.status === 500) {
            ElMessage.error('服务器内部错误，请稍后再试');
            console.error(`服务器错误: ${url}`, error);
          }
        } else if (error.request) {
          ElMessage.error('网络请求失败，请检查您的网络连接');
          console.error(`网络请求失败: ${url}`, error);
        } else {
          ElMessage.error('请求配置错误');
          console.error(`请求配置错误: ${url}`, error);
        }
        
        // 继续抛出错误，由业务代码处理
        throw error;
      });
  }
  
  put<T, D>(url: string, params?: D): Promise<ResultData<T>> {
    return this.service.put(url, params)
      .catch((error: AxiosError) => {
        // 也可以在这里处理错误
        if (error.response && error.response.status === 404) {
          ElMessage.error(`请求的接口 [${url}] 不存在，请联系管理员`);
        }
        throw error;
      });
  }
  
  delete<T, D>(url: string, params?: D): Promise<ResultData<T>> {
    return this.service.delete(url, { params })
      .catch((error: AxiosError) => {
        // 也可以在这里处理错误
        if (error.response && error.response.status === 404) {
          ElMessage.error(`请求的接口 [${url}] 不存在，请联系管理员`);
        }
        throw error;
      });
  }
}

// 导出一个实例对象
export default new RequestHttp(config);
