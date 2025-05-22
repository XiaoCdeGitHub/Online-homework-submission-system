/*
 * @Author: cuiding cuiding@kingsoft.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding cuiding@kingsoft.com
 * @LastEditTime: 2025-05-22 17:07:50
 * @FilePath: /YunJiaoYunJi-master/src/stores/group.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

// 定义筛选参数接口
interface FilterParams {
  direction?: string;
  group?: string;
  weeks?: number;
}

export const useGroupStore = defineStore('group', () => {
  // 分组信息
  const groupInfo = ref([]);

  // 筛选参数
  const direction = ref('');
  const group = ref('');
  const weeks = ref(0);

  // 设置筛选参数
  const setFilterParams = (params: FilterParams) => {
    if (params.direction) direction.value = params.direction;
    if (params.group) group.value = params.group;
    if (params.weeks) weeks.value = params.weeks;
  };

  return {
    groupInfo,
    direction,
    group,
    weeks,
    setFilterParams
  };
});
