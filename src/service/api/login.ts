import axios from '../myAxios';
// 用户登录表单

export interface LoginReqForm {
  number: number;
  password: string;
}

// 注册请求表单
export interface RegisterReqForm {
  number: number;
  password: string;
  name: string;
  direction: string;
  qqnum: string;
  group: string;
}

// 用户登录
export const login = (params: LoginReqForm): Promise<any> => {
  return axios.post('/login', params);
};

// 用户注册
export const register = (params: RegisterReqForm): Promise<any> => {
  return axios.post('/register', params);
};
