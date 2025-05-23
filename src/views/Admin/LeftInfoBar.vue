<template>
  <div class="admin-content-left">
    <div class="content-container">
      <div class="current-week-settings">
        <div class="current-week-title">
          <span>当前周数设置</span>
        </div>
        <div class="current-week-selector">
          <el-select v-model="currentWeek" placeholder="选择周数">
            <el-option v-for="item in weekOptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
          <el-button type="primary" :loading="settingWeek" @click="updateCurrentWeek">
            确认设置当前周数
          </el-button>
        </div>
        <div class="current-week-tip">
          <span class="tip-text">当前设置: {{ displayCurrentWeek }}</span>
        </div>
      </div>

      <div class="work-publish">
        <div class="publish-title">任务完成周期：</div>
        <div class="publish-top">
          <div class="date-picker">
            <el-date-picker v-model="publishForm.timeRange" type="datetimerange" range-separator=" "
              start-placeholder="开始" end-placeholder="结束" format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss" align="right">
            </el-date-picker>
          </div>
          <div class="group-checkbox">
            <el-select v-model="publishForm.direction" placeholder="请选择方向">
              <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="publish-title">作业详情：</div>
        <div class="week-checkbox">
          <el-select v-model="publishForm.weeks" placeholder="请选择周数">
            <el-option v-for="item in weekOptions" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </div>

        <div class="file-upload-area">
          <el-upload class="homework-upload" drag action="#" :auto-upload="false" :on-change="handleFileChange"
            :limit="1" accept=".zip,.rar,.doc,.docx,.md,.jpg,.png" :show-file-list="true">
            <el-icon class="el-icon--upload">
              <upload-filled />
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
        </div>

        <textarea class="job-detail" placeholder="请输入作业说明和要求" v-model="publishForm.notice" cols="34" rows="4">
</textarea>
        <button class="publish-button" @click="submitPublishForm" :disabled="publishing">
          {{ publishing ? '发布中...' : '任务发布' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { ChineseTransformGreenwich } from '../../utils/date';
import { weekToBeWorkName } from '../../utils/work';
import { directionOptionList, weekStageList } from '../../data/admin';
import { publicJobs, updateStatus, deleteUser } from '@/service/api/admin';
import { publishHomework, setCurrentWeeks, getCurrentWeeks } from '@/service/api/adminHomework';

// 作业发布表单
const publishing = ref(false);
const publishForm = reactive({
  notice: '',
  timeRange: [],
  direction: '',
  weeks: '',
  file: null
});

// 选项数据
const options = directionOptionList;
const weekOptions = weekStageList;

// 当前周数设置相关
const currentWeek = ref(1)
const displayCurrentWeek = ref('第1周')
const settingWeek = ref(false)

// 获取当前设置的周数
const fetchCurrentWeek = async () => {
  try {
    const res = await getCurrentWeeks()
    if (res.code === 200) {
      currentWeek.value = res.data
      displayCurrentWeek.value = `第${res.data}周`
    } else {
      ElMessage.warning('获取当前周数失败，请稍后重试')
    }
  } catch (error) {
    console.error('获取当前周数异常:', error)
    ElMessage.warning('获取当前周数失败，请稍后重试')
  }
}

// 更新当前周数
const updateCurrentWeek = async () => {
  if (!currentWeek.value || currentWeek.value < 1) {
    ElMessage.warning('请选择一个有效的周数')
    return
  }

  settingWeek.value = true
  try {
    const res = await setCurrentWeeks(currentWeek.value)
    if (res.code === 200) {
      displayCurrentWeek.value = `第${currentWeek.value}周`
      ElMessage.success(`成功将当前周数设置为第${currentWeek.value}周`)
    } else {
      ElMessage.error(res.message || '设置周数失败，请稍后重试')
    }
  } catch (error) {
    console.error('设置周数异常:', error)
    ElMessage.error('设置周数失败，请稍后重试')
  } finally {
    settingWeek.value = false
  }
}

// 组件挂载时获取当前周数
onMounted(() => {
  fetchCurrentWeek()
})

// 处理文件选择
const handleFileChange = (file) => {
  console.log('选择文件:', file);
  publishForm.file = file.raw;

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
  if (!publishForm.timeRange || publishForm.timeRange.length !== 2) {
    ElMessage.error('请选择作业日期范围');
    return;
  }

  if (!publishForm.direction) {
    ElMessage.error('请选择方向');
    return;
  }

  if (!publishForm.weeks) {
    ElMessage.error('请选择周数');
    return;
  }

  if (!publishForm.file) {
    ElMessage.error('请上传作业文件');
    return;
  }

  if (!publishForm.notice) {
    ElMessage.error('请填写作业说明');
    return;
  }

  publishing.value = true;

  try {
    const [startTime, endTime] = publishForm.timeRange;

    // 解析周数 - 修复match不是一个函数的错误
    let weeksNumber = 1;

    // 检查weeks的类型和格式
    if (typeof publishForm.weeks === 'string') {
      // 如果是字符串，尝试从"第X周"格式提取数字
      const weeksMatch = publishForm.weeks.match(/第(\d+)周/);
      if (weeksMatch) {
        weeksNumber = parseInt(weeksMatch[1]);
      } else {
        // 尝试直接将字符串转为数字
        const parsedNum = parseInt(publishForm.weeks);
        if (!isNaN(parsedNum)) {
          weeksNumber = parsedNum;
        }
      }
    } else if (typeof publishForm.weeks === 'number') {
      // 如果已经是数字，直接使用
      weeksNumber = publishForm.weeks;
    } else if (publishForm.weeks.value) {
      // 处理可能是响应式对象的情况
      weeksNumber = parseInt(publishForm.weeks.value);
    }

    console.log('解析后的周数:', weeksNumber);


    // 创建FormData
    const formData = new FormData();
    formData.append('file', publishForm.file);
    formData.append('notice', publishForm.notice);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('weeks', weeksNumber);
    formData.append('direction', publishForm.direction);

    // 调用API发布作业
    const response = await publishHomework(formData);

    if (response.code === 200) {
      ElMessage.success('作业发布成功');

      // 保存到本地存储以兼容现有功能
      const work = {
        file: publishForm.file.name,
        startTime: startTime,
        endTime: endTime,
        notice: publishForm.notice,
        direction: publishForm.direction,
        weeks: publishForm.weeks,
      };
      localStorage.setItem('work', JSON.stringify(work));
      localStorage.setItem("jobTime", JSON.stringify(publishForm.timeRange));

      // 重置表单
      publishForm.notice = '';
      publishForm.timeRange = [];
      publishForm.file = null;
    } else {
      ElMessage.error(response.message || '作业发布失败');
    }
  } catch (error) {
    console.error('发布作业失败:', error);
    ElMessage.error('发布作业失败，请重试: ' + (error.message || '未知错误'));
  } finally {
    publishing.value = false;
  }
};
</script>

<style lang="less" scoped>
.job-detail {
  position: relative;
  border: #c2c7f4 solid 2px;
  background: #c2c7f4;
  border-radius: 8px;
  font-family: '黑体', Courier, monospace;
  display: inline-block;
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  box-sizing: border-box;
  color: #4a1691;
  font-size: 14px;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;

  &:focus {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(107, 90, 216, 0.2);
    outline: none;
    border-color: #6B5AD8;
  }

  &::placeholder {
    color: #8e85b9;
    opacity: 0.8;
  }
}

.admin-content-left {
  width: 22%;
  height: 94vh;
  background-image: url('@/assets/img/admin/leftback.png');
  background-size: 100% 100%;
  border-radius: 20px;
  position: relative;
  overflow-y: auto;
  /* 添加滚动条以防内容溢出 */
  padding-bottom: 30px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(194, 199, 244, 0.8);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
}

.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.current-week-settings,
.work-publish {
  width: 85%;
  min-height: 100px;
  padding: 20px;
  position: relative;
  background-color: #f1f0f5;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

.current-week-settings {
  margin-top: 20px;
  margin-bottom: 20px;
}

.work-publish {
  margin-bottom: 20px;
}

.publish-title {
  font-size: 16px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 30px;
  font-weight: bold;
  margin-bottom: 10px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #4a1691, #c2c7f4);
  }
}

.publish-top {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 5px;
  margin-bottom: 16px;
}

.file-upload-area {
  margin: 15px 0;

  :deep(.el-upload-dragger) {
    transition: all 0.3s ease;
    box-shadow: none;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(107, 90, 216, 0.2);
    }
  }
}

.homework-upload {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100% !important;
  height: auto !important;
  padding: 10px;
  border: 2px dashed #c2c7f4;
  background-color: rgba(240, 236, 252, 0.5);

  &:hover {
    border-color: #6B5AD8;
  }

  .el-icon {
    color: #4a1691;
  }

  .el-upload__text {
    color: #4a1691;

    em {
      color: #6B5AD8;
      font-style: normal;
      font-weight: bold;
    }
  }
}

.work-publish span {
  font-size: 14px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 28px;
}

:deep(.el-date-editor) {
  width: 100% !important;
}

:deep(.el-input__wrapper) {
  --el-input-bg-color: #c2c7f4;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 2px 6px rgba(107, 90, 216, 0.2);
    transform: translateY(-1px);
  }
}

:deep(.el-textarea) {
  --el-input-bg-color: #c2c7f4;
  --el-border-radius-base: 8px;
}

:deep(.el-textarea__inner),
:deep(.el-input__inner) {
  font-family: '黑体', Arial, sans-serif;
  color: #4a1691;

  &::placeholder {
    color: #8e85b9;
    opacity: 0.8;
  }
}

.publish-button {
  cursor: pointer;
  width: 100%;
  height: 5vh;
  margin-top: 20px;
  margin-bottom: 10px;
  background-color: #f0ecfc;
  background-image: linear-gradient(315deg, #f0ecfc 0%, #c2c7f4 74%);
  line-height: 42px;
  border-radius: 8px;
  border: 0px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 35px;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover:not([disabled]) {
    opacity: 0.9;
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(107, 90, 216, 0.3);
  }

  &:active:not([disabled]) {
    transform: scale(0.95);
  }

  &[disabled] {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.group-checkbox {
  width: 100%;
  margin-bottom: 16px;

  :deep(.el-select) {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.week-checkbox {
  position: relative;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 16px;

  :deep(.el-select) {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

:deep(.el-select),
:deep(.el-input),
:deep(.el-input__inner) {
  background-color: #c1caf3;
  color: grey;
}

/* 上传提示文字样式 */
:deep(.el-upload__tip) {
  color: #4a1691;
  font-size: 12px;
  line-height: 1.4;
}

/* 上传文件列表样式 */
:deep(.el-upload-list) {
  margin-top: 10px;
}

/* 日期选择器样式调整 */
.date-picker {
  width: 100%;
  margin-bottom: 10px;

  :deep(.el-date-editor) {
    width: 100% !important;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }
}

.current-week-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 20px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -5px;
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, #4a1691, #c2c7f4);
  }
}

.current-week-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;

  :deep(.el-select) {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }

  :deep(.el-button) {
    background-color: #f0ecfc;
    background-image: linear-gradient(315deg, #f0ecfc 0%, #c2c7f4 74%);
    color: #4a1691;
    font-weight: bold;
    border: none;
    transition: all 0.3s ease;

    &:hover {
      opacity: 0.9;
      transform: scale(0.98);
      box-shadow: 0 2px 6px rgba(107, 90, 216, 0.3);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.current-week-tip {
  font-size: 14px;
  color: #6C6FA3;
  margin-top: 10px;

  .tip-text {
    font-weight: bold;
  }
}

/* 统一所有按钮和输入框的动效 */
.el-button,
.el-select,
.el-input,
.el-textarea,
.job-detail,
.publish-button,
:deep(.el-upload-dragger) {
  transition: all 0.3s ease;

  &:hover,
  &:focus {
    transform: translateY(-2px);
  }
}

/* 修复上传图标被隐藏的问题 */
:deep(.el-icon--upload) {
  margin: 0 0 10px;
  color: #4a1691;
}

/* 调整textarea背景色 */
:deep(.el-textarea__inner) {
  --el-input-bg-color: #c2c7f4;
  --el-border-radius-base: 8px;
}

/* 统一按钮样式 */
:deep(.el-button) {
  --el-button-bg-color: #c2c7f4;
  --el-button-hover-bg-color: #a5abd8;
  --el-button-hover-text-color: #4a1691;
  --el-button-border-color: transparent;
  --el-button-hover-border-color: transparent;
  --el-button-active-bg-color: #8f95c4;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(74, 22, 145, 0.15);
  }
}

/* 调整日期选择器样式 */
:deep(.el-date-editor) {
  --el-input-bg-color: #c2c7f4;
  --el-border-radius-base: 8px;

  .el-input__wrapper {
    transition: all 0.3s ease;

    &:hover,
    &.is-focus {
      box-shadow: 0 0 0 1px #4a1691;
    }
  }
}

/* 上传区样式增强 */
.file-upload-area {
  &:hover {
    background-color: rgba(194, 199, 244, 0.5);
    border-color: #4a1691;
    transform: translateY(-2px);
  }
}

/* 统一字体颜色 */
.publish-title,
.current-week-title {
  color: #4a1691;
}
</style>