<template>
  <div class="upload-info">
    <div class="upload-info-header">
      <h3>{{ title }}</h3>
      <slot name="header-actions"></slot>
    </div>
    
    <div class="file-list" v-if="files && files.length > 0">
      <div v-for="(file, index) in files" :key="index" class="file-item">
        <div class="file-icon">
          <slot name="file-icon" :file="file">
            <i class="el-icon-document"></i>
          </slot>
        </div>
        
        <div class="file-details">
          <div class="file-name">{{ file.name || '未知文件' }}</div>
          <div class="file-size" v-if="file.size">{{ formatFileSize(file.size) }}</div>
        </div>
        
        <div class="file-actions">
          <slot name="file-actions" :file="file" :index="index"></slot>
        </div>
      </div>
    </div>
    
    <div class="empty-files" v-else>
      <slot name="empty">
        <p>{{ emptyText }}</p>
      </slot>
    </div>
    
    <div class="upload-info-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'UploadInfo',
  props: {
    title: {
      type: String,
      default: '上传信息'
    },
    files: {
      type: Array,
      default: () => []
    },
    emptyText: {
      type: String,
      default: '暂无文件'
    }
  },
  setup() {
    // 格式化文件大小
    const formatFileSize = (size) => {
      if (!size) return '未知大小';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let formattedSize = size;
      let unitIndex = 0;
      
      while (formattedSize >= 1024 && unitIndex < units.length - 1) {
        formattedSize /= 1024;
        unitIndex++;
      }
      
      return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
    };
    
    return {
      formatFileSize
    };
  }
});
</script>

<style scoped>
.upload-info {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.upload-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upload-info-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.file-list {
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  margin-right: 12px;
  font-size: 20px;
  color: #909399;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.file-actions {
  margin-left: 16px;
}

.empty-files {
  text-align: center;
  color: #909399;
  padding: 24px 0;
}

.upload-info-footer {
  margin-top: 16px;
}
</style> 