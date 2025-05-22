import { defineStore } from 'pinia';

export const useGroupStore = defineStore('group', () => {
  const groupInfo = ref([]);
  return { groupInfo };
});
