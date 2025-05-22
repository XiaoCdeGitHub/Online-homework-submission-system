<template>
  <div id="download">
    <div class="title">
      作业管理<span>Homework Management</span>
      <span style="left: 65%">完成/总人数：{{ getRate() }}</span>
    </div>

    <!-- 发布作业 -->
    <el-button type="primary" @click="showPublishDialog" style="margin-bottom: 15px">
      <el-icon>
        <Plus />
      </el-icon>发布新作业
    </el-button>

    <!-- 作业筛选区域 -->
    <div class="filter-container">
      <RightFilter @filter-applied="handleFilterApplied" @filter-change="handleFilterChange" />
    </div>

    <!-- 进度条显示区域 -->
    <div class="progress-container">
      <RightProgressBar :studentList="stufilterList" :weeks="filterParams.weeks" :direction="filterParams.direction"
        :group="filterParams.group" />
    </div>

    <!-- 学生列表 -->
    <div id="checkbox">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="stufilterList.length === 0" class="empty-state">
        <el-empty description="没有找到符合条件的学生" />
      </div>
      <ul v-else>
        <li v-for="(item, index) in stufilterList" :key="index" ref="li">
          <div class="circle">
            <el-avatar :size="35"
              :src="item.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
          </div>
          {{ item.user_name }}
          <input type="checkbox" v-model="item.isSelect" @click="checkEach()" />
          <a v-show="item.is_apply" @click="downloadHomeworkFile(item)" class="download-link">点击此处下载作业</a>
          <span v-show="!item.is_apply" class="not-finish">暂未完成</span>
          <span class="student-info">
            {{ item.direction || '未设置方向' }} | {{ item.group_name || '未分组' }}
          </span>
        </li>
      </ul>
    </div>

    <div id="line">
      <button @click="downloadSelected()" :disabled="selectedCount === 0">批量下载 ({{ selectedCount }})</button>
      <button @click="showExportDialog">下载报告</button>
      <div>
        全选<input type="checkbox" id="ckAll" v-model="isAll" @click="checkAll()" />
      </div>
    </div>

    <!-- 发布作业对话框 -->
    <el-dialog v-model="publishDialogVisible" title="发布新作业" width="40%">
      <el-form :model="publishForm" label-width="120px">
        <el-form-item label="作业说明" required>
          <el-input v-model="publishForm.notice" type="textarea" :rows="3" placeholder="请输入作业说明内容" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker v-model="publishForm.startTime" type="datetime" placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="截止时间" required>
          <el-date-picker v-model="publishForm.endTime" type="datetime" placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="周数" required>
          <el-input-number v-model="publishForm.weeks" :min="1" :max="52" />
        </el-form-item>
        <el-form-item label="方向" required>
          <el-select v-model="publishForm.direction" placeholder="请选择方向">
            <el-option label="前端" value="前端" />
            <el-option label="后端" value="后端" />
            <el-option label="全栈" value="全栈" />
            <el-option label="产品" value="产品" />
            <el-option label="设计" value="设计" />
            <el-option label="测试" value="测试" />
          </el-select>
        </el-form-item>
        <el-form-item label="作业文件" required>
          <el-upload class="homework-upload" drag :auto-upload="false" :on-change="handleFileChange" :limit="1"
            accept=".zip,.rar,.doc,.docx,.md,.jpg,.png">
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持zip、rar、doc、docx、md、jpg、png格式，文件大小不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPublishForm" :loading="publishing">
            发布
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导出报告对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出作业报告" width="30%">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="方向" required>
          <el-select v-model="exportForm.direction" placeholder="请选择方向">
            <el-option label="前端" value="前端" />
            <el-option label="后端" value="后端" />
            <el-option label="全栈" value="全栈" />
            <el-option label="产品" value="产品" />
            <el-option label="设计" value="设计" />
            <el-option label="测试" value="测试" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组" required>
          <el-input v-model="exportForm.group" placeholder="请输入分组信息" />
        </el-form-item>
        <el-form-item label="周数" required>
          <el-input-number v-model="exportForm.weeks" :min="1" :max="52" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="exportReport" :loading="exporting">
            导出
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { Plus, UploadFilled } from '@element-plus/icons-vue';
import arrayToExcel from '../../../plugins/arrayToExcel/index';
import { loadFile } from '../../../utils/brower';
import { fuzzyStudents, getFilter } from '@/service/api/admin';
import { useGroupStore } from '@/stores/group';
import { publishHomework, downloadHomework, getFinalExcel, getGroupInfo, getCurrentWeeks } from '@/service/api/adminHomework';
import RightFilter from './RightFilter.vue';
import RightProgressBar from './RightProgressBar.vue';

// 作业发布相关
const publishDialogVisible = ref(false);
const publishing = ref(false);
const publishForm = reactive({
  notice: '',
  startTime: '',
  endTime: '',
  weeks: 1,
  direction: '',
  file: null
});

// 报告导出相关
const exportDialogVisible = ref(false);
const exporting = ref(false);
const exportForm = reactive({
  direction: '',
  group: '',
  weeks: 1
});

// 筛选条件
const stufilterList = ref([]);
const originalList = ref([]); // 保存未筛选的完整列表
const filterParams = reactive({
  weeks: '',
  direction: '',
  group: ''
});
const loading = ref(false);

// 全选状态
const isAll = ref(false);
// 计算已选择的数量
const selectedCount = computed(() => {
  return stufilterList.value.filter(item => item.isSelect && item.is_apply).length;
});

// 初始化函数
onMounted(() => {
  loadStudentList();
  getCurrentWeekNumber();
});

// 获取当前周数
const getCurrentWeekNumber = async () => {
  try {
    const response = await getCurrentWeeks();
    if (response.code === 200) {
      publishForm.weeks = response.data || 1;
      exportForm.weeks = response.data || 1;
    }
  } catch (error) {
    console.error('获取当前周数失败:', error);
  }
};

// 加载学生列表
const loadStudentList = async () => {
  loading.value = true;
  try {
    // 从本地存储获取已保存的数据
    if (localStorage.getItem("groupInfo")) {
      const savedData = JSON.parse(localStorage.getItem("groupInfo"));
      if (savedData && savedData.data && Array.isArray(savedData.data)) {
        stufilterList.value = savedData.data.map(student => ({
          ...student,
          isSelect: false
        }));
        originalList.value = [...stufilterList.value];
      }
    } else {
      // 如果本地没有数据，尝试获取默认数据
      await fetchDefaultStudentList();
    }
  } catch (error) {
    console.error('加载学生列表失败:', error);
    ElMessage.error('加载学生列表失败');
  } finally {
    loading.value = false;
  }
};

// 获取默认学生列表
const fetchDefaultStudentList = async () => {
  try {
    const response = await fuzzyStudents();
    if (response.code === 200 && response.data) {
      stufilterList.value = response.data.map(student => ({
        ...student,
        isSelect: false
      }));
      originalList.value = [...stufilterList.value];
    }
  } catch (error) {
    console.error('获取默认学生列表失败:', error);
    stufilterList.value = [];
    originalList.value = [];
  }
};

// 处理筛选结果
const handleFilterApplied = (filterResult) => {
  const { params, result } = filterResult;

  // 更新筛选参数
  filterParams.weeks = params.weeks;
  filterParams.direction = params.direction;
  filterParams.group = params.group;

  // 更新学生列表
  if (result && Array.isArray(result)) {
    stufilterList.value = result.map(student => ({
      ...student,
      isSelect: false
    }));
  } else {
    stufilterList.value = [];
  }
};

// 处理筛选条件变更
const handleFilterChange = (change) => {
  // 更新对应的筛选参数
  if (change.type === 'stage') {
    filterParams.weeks = change.value;
  } else if (change.type === 'direction') {
    filterParams.direction = change.value;
  } else if (change.type === 'group') {
    filterParams.group = change.value;
  }
};

// 显示发布作业对话框
const showPublishDialog = () => {
  publishDialogVisible.value = true;
  // 重置表单
  Object.keys(publishForm).forEach(key => {
    if (key === 'weeks') {
      // 保留当前周数
    } else if (key === 'direction') {
      publishForm[key] = filterParams.direction || '';
    } else {
      publishForm[key] = '';
    }
  });
};

// 处理文件选择
const handleFileChange = (file) => {
  console.log('选择文件:', file);
  publishForm.file = file.raw;

  // 验证文件类型
  const validTypes = ['application/zip', 'application/x-rar-compressed', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown', 'image/jpeg', 'image/png'];

  // 获取文件扩展名（不区分大小写）
  const fileName = file.name.toLowerCase();
  const isValidExtension = /\.(zip|rar|doc|docx|md|jpg|png)$/.test(fileName);

  // 验证文件类型
  if (!isValidExtension) {
    ElMessage.error('不支持的文件类型，请上传zip、rar、doc、docx、md、jpg或png格式的文件');
    publishForm.file = null;
    return false;
  }

  // 验证文件大小，限制10MB
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    ElMessage.error('文件大小不能超过10MB');
    publishForm.file = null;
    return false;
  }

  return true;
};

// 提交作业发布表单
const submitPublishForm = async () => {
  // 表单验证
  if (!publishForm.notice) {
    ElMessage.error('请填写作业说明');
    return;
  }
  if (!publishForm.startTime) {
    ElMessage.error('请选择开始时间');
    return;
  }
  if (!publishForm.endTime) {
    ElMessage.error('请选择截止时间');
    return;
  }
  if (!publishForm.direction) {
    ElMessage.error('请选择方向');
    return;
  }
  if (!publishForm.file) {
    ElMessage.error('请上传作业文件');
    return;
  }

  publishing.value = true;
  try {
    // 创建FormData
    const formData = new FormData();
    formData.append('file', publishForm.file);
    formData.append('notice', publishForm.notice);
    formData.append('startTime', publishForm.startTime);
    formData.append('endTime', publishForm.endTime);
    formData.append('weeks', publishForm.weeks);
    formData.append('direction', publishForm.direction);

    // 调用API发布作业
    const response = await publishHomework(formData);
    if (response.code === 200) {
      ElMessage.success('作业发布成功');
      publishDialogVisible.value = false;

      // 保存到本地存储以兼容现有功能
      const work = {
        file: publishForm.file.name,
        startTime: publishForm.startTime,
        endTime: publishForm.endTime,
        notice: publishForm.notice,
        direction: publishForm.direction,
        weeks: publishForm.weeks,
      };
      localStorage.setItem('work', JSON.stringify(work));
      localStorage.setItem("jobTime", JSON.stringify([publishForm.startTime, publishForm.endTime]));
    } else {
      ElMessage.error(response.message || '作业发布失败');
    }
  } catch (error) {
    console.error('发布作业失败:', error);
    ElMessage.error('发布作业失败，请重试');
  } finally {
    publishing.value = false;
  }
};

// 单选框
const checkEach = () => {
  let count = 0;
  stufilterList.value.forEach((item) => {
    if (item.isSelect === true) {
      count++;
    }
  });
  isAll.value = count === stufilterList.value.length;
};

// 全选框
const checkAll = () => {
  stufilterList.value.forEach((item) => {
    item.isSelect = isAll.value;
  });
};

// 下载选中的作业
const downloadSelected = async () => {
  const selectedStudents = stufilterList.value.filter(item => item.isSelect && item.is_apply);

  if (selectedStudents.length === 0) {
    ElMessage.warning('请选择至少一个已完成作业的学生');
    return;
  }

  // 批量下载
  const loadingInstance = ElLoading.service({
    text: '正在准备下载...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    for (const student of selectedStudents) {
      await downloadHomeworkFile(student, false);
      // 延迟一下，避免浏览器同时触发太多下载
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    ElMessage.success(`已开始下载${selectedStudents.length}个文件`);
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载失败，请重试');
  } finally {
    loadingInstance.close();
  }
};

// 下载单个学生作业
const downloadHomeworkFile = async (student, showMessage = true) => {
  try {
    if (!student.userId) {
      if (showMessage) ElMessage.error('用户ID不存在，无法下载');
      return;
    }

    // 使用作业周数或当前筛选的周数
    const weeks = filterParams.weeks || publishForm.weeks;

    await downloadHomework(student.userId, weeks);
    if (showMessage) ElMessage.success('开始下载作业');
  } catch (error) {
    console.error('下载作业失败:', error);
    if (showMessage) ElMessage.error(error.message || '下载作业失败');
  }
};

// 打开导出报告对话框
const showExportDialog = () => {
  exportDialogVisible.value = true;
  // 使用当前筛选条件预填表单
  if (filterParams.direction) {
    exportForm.direction = filterParams.direction;
  }
  if (filterParams.group) {
    exportForm.group = filterParams.group;
  }
  if (filterParams.weeks) {
    exportForm.weeks = filterParams.weeks;
  }
};

// 导出Excel报告
const exportReport = async () => {
  if (!exportForm.direction) {
    ElMessage.error('请选择方向');
    return;
  }
  if (!exportForm.group) {
    ElMessage.error('请输入分组信息');
    return;
  }

  exporting.value = true;
  try {
    await getFinalExcel(exportForm.direction, exportForm.group, exportForm.weeks);
    ElMessage.success('报告导出成功');
    exportDialogVisible.value = false;
  } catch (error) {
    console.error('导出报告失败:', error);
    ElMessage.error(error.message || '导出报告失败');
  } finally {
    exporting.value = false;
  }
};

// 计算完成率
const getRate = () => {
  if (stufilterList.value.length > 0) {
    const finished = stufilterList.value.filter((item) => {
      return item.is_apply;
    });
    return `${finished.length}/${stufilterList.value.length}`;
  }
  return '0/0';
};
</script>

<style lang="less" scoped>
/* 作业下载开始 */
#download {
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
}

/* 标题 */
#download .title {
  height: 40px;
  font-size: 20px;
  line-height: 20px;
  font-weight: 700;
  position: relative;
  border-bottom: 3px solid #000;
  margin-bottom: 15px;
}

/* 英文 */
#download .title span {
  font-size: 13px;
  color: #666666;
  position: absolute;
  font-weight: 400;
  left: 25%;
  top: 8px;
}

/* 筛选和进度区域 */
.filter-container {
  margin-bottom: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.progress-container {
  margin-bottom: 20px;
}

/* 学生列表 */
#checkbox {
  height: calc(100% - 210px);
  /* 调整高度以适应筛选和进度区域 */
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 15px;
}

#download ul {
  height: 100%;
  overflow-y: auto;
}

/* 滚动条 */
#download ul::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 4px;
  /*高宽分别对应横竖滚动条的尺寸*/
  height: 20px;
  border-radius: 5px;
}

#download ul::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  background: #7453e7;
}

#download ul::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  border-radius: 5px;
  background: #c2c7f4;
}

/* 滚动条结束 */
#checkbox ul li {
  height: 50px;
  font-weight: 700;
  line-height: 50px;
  position: relative;
  color: #666666;
  margin: 0 auto;
  display: flex;
  align-items: center;
  border-bottom: 1px dashed #eee;
}

/* 头像 */
#checkbox ul li .circle {
  display: inline-block;
  width: 35px;
  height: 35px;
  margin-top: 5px;
  margin-left: 10px;
  margin-right: 15px;
}

/* 学生信息 */
.student-info {
  margin-left: auto;
  margin-right: 10px;
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

/* 多选框 */
#checkbox ul li input[type='checkbox'] {
  margin-left: 15px;
  margin-right: 10px;
  margin-top: 0;
}

/* 下载链接 */
.download-link {
  margin-left: 10px;
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

/* 未完成标记 */
.not-finish {
  margin-left: 10px;
  color: #f56c6c;
}

/* 底部按钮栏 */
#line {
  height: 50px;
  display: flex;
  align-items: center;
}

#line button {
  height: 35px;
  padding: 0 20px;
  border: none;
  background-color: #6B5AD8;
  color: #fff;
  border-radius: 5px;
  margin-right: 15px;
  cursor: pointer;
  font-size: 14px;
}

#line button:disabled {
  background-color: #b5b1e2;
  cursor: not-allowed;
}

#line button:not(:disabled):hover {
  opacity: 0.9;
}

#line button:not(:disabled):active {
  opacity: 0.8;
}

#line div {
  margin-left: auto;
  display: flex;
  align-items: center;
}

#line div input {
  margin-left: 5px;
}

/* 文件上传 */
.homework-upload {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  padding: 20px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
