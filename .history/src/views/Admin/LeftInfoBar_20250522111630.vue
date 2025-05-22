<template>
  <div class="admin-content-left">
    <div class="work-publish">
      <span style="font-size: 16px">任务完成周期：</span>
      <div class="publish-top">
        <div class="date-picker">
          <el-date-picker
            v-model="publishForm.timeRange"
            type="datetimerange"
            range-separator=" "
            start-placeholder="开始"
            end-placeholder="结束"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            align="right"
          >
          </el-date-picker>
        </div>
        <div class="group-checkbox">
          <el-select v-model="publishForm.direction" placeholder="请选择方向">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
      </div>
      <span style="position: relative; top: 10px"> 作业详情：</span>
      <div class="week-checkbox">
        <el-select v-model="publishForm.weeks" placeholder="请选择周数">
          <el-option
            v-for="item in weekOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </div>

      <div class="file-upload-area">
        <el-upload
          class="homework-upload"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="1"
          accept=".zip,.rar,.doc,.docx,.md,.jpg,.png"
          :show-file-list="true"
        >
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

      <textarea
        class="job-detail"
        placeholder="请输入作业说明和要求"
        v-model="publishForm.notice"
        cols="34"
        rows="4"
      >
      </textarea>
      <button class="publish-button" @click="submitPublishForm" :disabled="publishing">
        {{ publishing ? '发布中...' : '任务发布' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { ChineseTransformGreenwich } from '../../utils/date';
import { weekToBeWorkName } from '../../utils/work';
import { directionOptionList, weekStageList } from '../../data/admin';
import { publicJobs, updateStatus, deleteUser } from '@/service/api/admin';
import { publishHomework } from '@/service/api/adminHomework';

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
    
    // 解析周数 (例如 "第一周" -> 1)
    const weeksMatch = publishForm.weeks.match(/第(\d+)周/);
    const weeksNumber = weeksMatch ? parseInt(weeksMatch[1]) : 1;

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
    ElMessage.error('发布作业失败，请重试');
  } finally {
    publishing.value = false;
  }
};
</script>

<style lang="less" scoped>
.job-detail {
  position: relative;
  top: 10px;
  border: #c2c7f4 solid 2px;
  background: #c2c7f4; //  背景透明
  border-radius: 5px;
  font-family: '黑体', Courier, monospace;
  display: inline-block;
  width: 100%;
}

.admin-content-left {
  width: 22%;
  height: 94vh;
  background-image: url('@/assets/img/admin/leftback.png');
  background-size: 100% 100%;
  border-radius: 20px;
  position: relative;
}

.work-publish {
  height: auto;
  width: 80%;
  position: absolute;
  left: 30px;
  top: 15vh;
  opacity: 0.8;
}

.publish-top {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-upload-area {
  margin: 15px 0;
}

.homework-upload {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100% !important;
  height: auto !important;
  padding: 10px;
}

:deep(.el-icon--upload) {
  margin: 0 0 10px;
}

.work-publish span {
  font-size: 16px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 40px;
  font-weight: bold;
}

:deep(.el-date-editor) {
  width: 100% !important;
}

:deep(.el-input__wrapper) {
  --el-input-bg-color: #c2c7f4;
}

:deep(.el-textarea) {
  --el-input-bg-color: #c2c7f4;
  --el-border-radius-base: 8px;
}

:deep(.el-textarea__inner) {
  --el-input-bg-color: #c2c7f4;
  --el-border-radius-base: 8px;
}

.publish-button {
  cursor: pointer;
  width: 100%;
  height: 5vh;
  margin-top: 15px;
  margin-bottom: 15px;
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
  transition: 0.5s;
}

.publish-button:hover:not([disabled]) {
  opacity: 0.8;
  transform: scale(0.97);
}

.publish-button[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}

.group-checkbox {
  width: 100%;
}

.week-checkbox {
  position: relative;
  width: 70%;
  margin-top: 15px;
  margin-bottom: 15px;
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
}
</style>
