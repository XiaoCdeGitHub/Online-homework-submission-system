<template>
  <div class="admin-content-left">
    <div class="work-publish">
      <span style="font-size: 16px">任务完成周期：</span>
      <div class="publish-top">
        <div class="date-picker">
          <el-date-picker v-model="value2" type="datetimerange" :picker-options="pickerOptions" range-separator=" "
            start-placeholder="开始" end-placeholder="结束" align="right">
            <el-tooltip class="box-item" effect="dark" content="Top Left prompts info"
              placement="top-start"></el-tooltip>
          </el-date-picker>
        </div>
        <div class="group-checkbox">
          <el-select v-model="value1" placeholder="请选择">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
          </el-select>
        </div>
      </div>
      <span style="position: relative; top: 10px"> 作业详情：</span>
      <div class="week-checkbox">
        <el-select v-model="weekNumber" disabled placeholder="请选择">
          <el-option v-for="item in weekOptions" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
        </el-select>
      </div>
      <label class="input-file-button" for="upload"> 点击下载文件 </label>
      <input type="file" id="upload" @change="getFile" />
      <textarea class="job-detail" placeholder="请输入备注内容" v-model="textarea" cols="34" rows="4">
      </textarea>
      <button class="publish-button" @click="submitJob()">任务提交</button>
    </div>
  </div>
</template>

<script setup>
import { ChineseTransformGreenwich } from '../../utils/date';
import { weekToBeWorkName } from '../../utils/work';
import { directionOptionList, weekStageList } from '../../data/admin';
import { publicJobs, updateStatus, deleteUser } from '@/service/api/admin'
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { getAvailableHomeworks, downloadHomeworkFile } from '@/service/api/homework';

let work = JSON.parse(localStorage.getItem('work')) || {};
console.log(work, 'work');
const value1 = ref('全栈方向')//方向选择值
const textarea = ref('这次作业大家要好好完成噢！！！') //
const value2 = ref([])//日期值
const options = directionOptionList
const weekNumber = ref('第一周')
const weekOptions = weekStageList
const file = ref('')
const color = ref('red')

// value1.value = work.direction;
console.log('value1.value', value1.value);
// textarea.value = work.notice;
if (work.direction) value1.value = work.direction;
if (work.notice) textarea.value = work.notice;
if (work.weeks) weekNumber.value = work.weeks;
if (work.file) file.value = work.file;

value2.value = JSON.parse(localStorage.getItem("jobTime")) || [];

console.log(value2.value);
// weekNumber.value = work.weeks;
// file.value = work.file;

// 加载状态
const loading = ref(true);
const downloadingId = ref(null);

// 作业列表
const homeworkList = ref([]);

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未设置';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 检查是否已过期
const isExpired = (endTime) => {
  if (!endTime) return false;
  return new Date(endTime) < new Date();
};

// 从本地存储获取用户信息
const getUserInfoFromStorage = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr && userInfoStr !== 'undefined' && userInfoStr !== 'null') {
      const userInfo = JSON.parse(userInfoStr);
      return {
        userId: userInfo.userId || userInfo.number || '',
        direction: userInfo.direction || '全栈方向'
      };
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
  return { userId: '', direction: '全栈方向' };
};

// 获取可下载作业列表
const fetchHomeworks = async () => {
  loading.value = true;
  try {
    const { userId, direction } = getUserInfoFromStorage();

    if (!userId) {
      ElMessage.warning('获取用户信息失败，请重新登录');
      homeworkList.value = [];
      return;
    }

    // 模拟数据 - 在实际开发中替换为API调用
    // const res = await getAvailableHomeworks(userId, direction);

    // 测试数据，模拟API响应
    const res = {
      code: 200,
      message: '获取作业列表成功',
      data: [
        {
          id: '1',
          title: '适应期第一周作业',
          notice: '请按照要求完成本周作业，并提交到系统中',
          fileName: '第一周-前端基础.zip',
          fileUrl: 'http://example.com/homework1.zip',
          startTime: '2023-05-01 00:00:00',
          endTime: '2023-05-07 23:59:59',
          weeks: 1,
          direction: '全栈方向',
          isSubmitted: true
        },
        {
          id: '2',
          title: '适应期第二周作业',
          notice: '本周主要内容包括Vue组件开发和状态管理',
          fileName: '第二周-Vue基础.zip',
          fileUrl: 'http://example.com/homework2.zip',
          startTime: '2023-05-08 00:00:00',
          endTime: '2023-05-14 23:59:59',
          weeks: 2,
          direction: '全栈方向',
          isSubmitted: false
        },
        {
          id: '3',
          title: '适应期第三周作业',
          notice: '本周主要内容包括后端API开发和数据库操作',
          fileName: '第三周-后端基础.zip',
          fileUrl: 'http://example.com/homework3.zip',
          startTime: '2023-05-15 00:00:00',
          endTime: new Date(Date.now() + 86400000).toISOString(), // 明天截止
          weeks: 3,
          direction: '全栈方向',
          isSubmitted: false
        }
      ]
    };

    if (res.code === 200) {
      homeworkList.value = res.data;
    } else {
      ElMessage.error(res.message || '获取作业列表失败');
      homeworkList.value = [];
    }
  } catch (error) {
    console.error('获取作业列表失败:', error);
    ElMessage.error('获取作业列表失败，请重试');
    homeworkList.value = [];
  } finally {
    loading.value = false;
  }
};

// 下载作业
const downloadHomework = async (homework) => {
  if (!homework || !homework.id) {
    ElMessage.warning('无效的作业信息');
    return;
  }

  downloadingId.value = homework.id;

  try {
    // 实际开发中使用API调用
    // await downloadHomeworkFile(homework.id, homework.fileName);

    // 模拟下载延时
    await new Promise(resolve => setTimeout(resolve, 1000));

    ElMessage.success('作业文件下载成功');

  } catch (error) {
    console.error('下载作业失败:', error);
    ElMessage.error(error.message || '下载作业文件失败');
  } finally {
    downloadingId.value = null;
  }
};

// 组件挂载时获取作业列表
onMounted(() => {
  fetchHomeworks();
});
</script>

<style lang="less" scoped>
.box-item {
  width: 110px;
  margin-top: 10px;
}

.job-detail {
  position: relative;
  top: 15px;
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
  // background-color:blue;
  background-image: url('@/assets/img/admin/leftback.png');
  background-size: 100% 100%;
  border-radius: 20px;
  position: relative;
}

.work-publish {
  // background-color: red;
  height: 44vh;
  width: 80%;
  position: absolute;
  left: 30px;
  top: 15vh;
  opacity: 0.8;
}

.publish-top {
  // background-color: red;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.input-file-button {
  position: relative;
  // color: #4a1691;
  color: grey;
  background-color: #f0ecfc;
  background-image: linear-gradient(315deg, #f0ecfc 0%, #c2c7f4 74%);
  padding: 6px 25px;
  border-radius: 4px;
  cursor: pointer;
}

input {
  display: none;
}

.work-publish span {
  font-size: 16px;
  color: #4a1691;
  font-family: 黑体;
  line-height: 40px;
  font-weight: bold;
}

:deep(.el-date-editor) {
  --el-date-editor-datetimerange-width: 80%;
}

:deep(.el-input__wrapper) {
  --el-input-bg-color: #c2c7f4;
  // --el-border-radius-base: 8px;
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
  margin-top: 30px;
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

.publish-button:hover {
  opacity: 0.8;
  transform: scale(0.9);
}

.group-checkbox {
  width: 100%;
}

.week-checkbox {
  position: relative;
  // top: -20px;
  width: 36%;
  margin-top: 15px;
  margin-bottom: 15px;
}

:deep(.el-select),
:deep(.el-input),
:deep(.el-input__inner) {
  // background-color: #c1caf3;
  color: grey;
  border: 2px;
  // border-radius: 30px;
  text-align: center;
}

//修改单个的选项的样式
:deep(.el-select-dropdown__item) {
  background-color: #c1caf3;
  color: #c1caf3;
}

//item选项的hover样式
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  color: #409eff;
}

//修改的是下拉框选项内容上方的尖角
/* /deep/ .el-popper .popper__arrow, .el-popper .popper__arrow::after{

  } */
:deep(.el-input) {
  --el-fill-color-blank: #c1caf3;
}

:deep(.el-popper) {
  --el-color-primary: #c1caf3;
}

.loading-container {
  margin-top: 20px;
}

.empty-state {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.homework-list {
  margin-top: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.homework-item {
  background-color: #f1f0f5;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }

  &.is-expired {
    opacity: 0.8;
  }
}

.homework-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
  font-size: 15px;
}

.homework-info {
  margin-bottom: 15px;

  .notice {
    font-size: 13px;
    color: #666;
    margin: 5px 0;
    line-height: 1.4;
  }

  .time-info {
    font-size: 12px;
    color: #888;
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
  }
}

.homework-actions {
  display: flex;
  justify-content: flex-end;
}

.refresh-action {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

/* 滚动条样式 */
.homework-list::-webkit-scrollbar {
  width: 4px;
}

.homework-list::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: #7453e7;
}

.homework-list::-webkit-scrollbar-track {
  border-radius: 4px;
  background: #e2e1ed;
}
</style>
