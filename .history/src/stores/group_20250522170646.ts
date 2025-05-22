import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGroupStore = defineStore('group', () => {
  // 分组信息
  const groupInfo = ref([]);
  
  // 筛选参数
  const direction = ref('');
  const group = ref('');
  const weeks = ref(0);
  
  // 设置筛选参数
  const setFilterParams = (params) => {
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
