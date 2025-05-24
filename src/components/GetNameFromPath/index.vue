<template>
  <span class="filename">{{ displayName }}</span>
</template>

<script>
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'GetNameFromPath',
  props: {
    path: {
      type: String,
      default: ''
    },
    maxLength: {
      type: Number,
      default: 20
    }
  },
  setup(props) {
    // 从路径中提取文件名
    const fileName = computed(() => {
      if (!props.path) return '未知文件';
      
      // 处理不同的分隔符
      const name = props.path.split('/').pop().split('\\').pop();
      return name || '未知文件';
    });
    
    // 如果文件名过长，进行截断处理
    const displayName = computed(() => {
      if (fileName.value.length <= props.maxLength) {
        return fileName.value;
      }
      
      const ext = fileName.value.lastIndexOf('.');
      if (ext === -1) {
        return fileName.value.substring(0, props.maxLength) + '...';
      }
      
      const extension = fileName.value.substring(ext);
      const name = fileName.value.substring(0, ext);
      const maxNameLength = props.maxLength - extension.length - 3;
      
      if (maxNameLength <= 0) {
        return fileName.value.substring(0, props.maxLength) + '...';
      }
      
      return name.substring(0, maxNameLength) + '...' + extension;
    });
    
    return {
      fileName,
      displayName
    };
  }
});
</script>

<style scoped>
.filename {
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
}
</style> 