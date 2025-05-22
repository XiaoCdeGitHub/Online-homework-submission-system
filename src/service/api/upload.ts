/*
 * @Author: cuiding cuiding@kingsoft.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding cuiding@kingsoft.com
 * @LastEditTime: 2025-05-22 10:50:30
 * @FilePath: /YunJiaoYunJi-master/src/service/api/upload.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from '../myAxios';

export const uploadImg = (params: any): Promise<any> => {
  return axios.post('/upload', params);
};
