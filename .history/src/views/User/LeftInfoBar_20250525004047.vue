<template>
  <div class="admin-content-left">
    <div class="work-publish">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 16px">可下载作业：</span>
        <el-button type="primary" size="small" @click="showHistoryHomeworksDialog" plain>
          查看历史作业
        </el-button>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="homeworkList.length === 0" class="empty-state">
        <el-empty description="暂无可下载作业" />
      </div>

      <div v-else class="homework-list">
        <div v-for="item in homeworkList" :key="item.id" class="homework-item"
          :class="{ 'is-expired': isExpired(item.endTime) }">
          <div class="homework-title">
            <span>{{ item.title || `第${item.weeks}周作业` }}</span>
            <el-tag size="small" :type="item.isSubmitted ? 'success' : (isExpired(item.endTime) ? 'danger' : 'info')">
              {{ item.isSubmitted ? '已提交' : (isExpired(item.endTime) ? '已截止' : '未提交') }}
            </el-tag>
          </div>

          <div class="homework-info">
            <p class="notice">{{ item.notice || '暂无说明' }}</p>
            <p class="time-info">
              <span>截止时间: {{ formatDate(item.endTime) }}</span>
            </p>
          </div>

          <div class="homework-actions">
            <el-button type="primary" size="small" @click="downloadHomework(item)" :loading="downloadingId === item.id"
              :disabled="isExpired(item.endTime) && !item.isSubmitted">
              下载作业
            </el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && homeworkList.length > 0" class="refresh-action">
        <el-button type="info" size="small" plain @click="fetchHomeworks" :loading="loading">
          <el-icon>
            <Refresh />
          </el-icon> 刷新列表
        </el-button>
      </div>
    </div>

    <!-- 登出按钮 -->
    <div class="logout-container">
      <el-button type="danger" @click="handleLogout" class="logout-button">
        <el-icon>
          <SwitchButton />
        </el-icon>
        退出登录
      </el-button>
    </div>

    <!-- 登出确认对话框 -->
    <el-dialog v-model="logoutConfirmVisible" title="确认退出" width="30%" center>
      <span>确定要退出系统吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="logoutConfirmVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmLogout">确认退出</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 历史作业对话框 -->
    <el-dialog v-model="historyDialogVisible" title="历史作业" width="70%" destroy-on-close>
      <div v-if="allHomeworksLoading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="allHomeworkList.length === 0" class="empty-state">
        <el-empty description="暂无历史作业" />
      </div>
      <div v-else>
        <el-table :data="allHomeworkList" style="width: 100%">
          <el-table-column prop="title" label="作业标题" />
          <el-table-column prop="weeks" label="周数" width="80" />
          <el-table-column prop="notice" label="说明" show-overflow-tooltip />
          <el-table-column label="截止时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.isSubmitted ? 'success' : (isExpired(scope.row.endTime) ? 'danger' : 'info')">
                {{ scope.row.isSubmitted ? '已提交' : (isExpired(scope.row.endTime) ? '已截止' : '未提交') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="primary" size="small" @click="downloadHomework(scope.row)"
                :disabled="isExpired(scope.row.endTime) && !scope.row.isSubmitted">
                下载
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ChineseTransformGreenwich } from '../../utils/date';
import { weekToBeWorkName } from '../../utils/work';
import { directionOptionList, weekStageList } from '../../data/admin';
import { publicJobs, updateStatus, deleteUser } from '@/service/api/admin'
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, SwitchButton } from '@element-plus/icons-vue';
import { downloadHomeworkFile, getRecentTask, getAllTasks, getSubmissionCount } from '@/service/api/homework';
import { getCurrentWeeks } from '@/service/api/adminHomework';
import { handleUserLogout } from '@/utils/localStorage';
import { useRouter } from 'vue-router';

// 获取路由器实例
const router = useRouter();
// 登出确认对话框状态
const logoutConfirmVisible = ref(false);

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
const showAllHomeworks = ref(false); // 是否显示所有作业
const viewMode = ref('current'); // 视图模式：'current' - 当前周，'all' - 所有周

// 作业列表
const homeworkList = ref([]);
const allHomeworkList = ref([]); // 所有作业列表
const historyDialogVisible = ref(false);
const allHomeworksLoading = ref(false);

// 获取所有历史作业列表
const fetchAllHomeworks = async () => {
  try {
    const { userId, direction } = getUserInfoFromStorage();

    if (!userId) {
      ElMessage.warning('获取用户信息失败，请重新登录');
      allHomeworkList.value = [];
      return;
    }

    // 调用获取所有作业的API
    const res = await getAllTasks(userId, direction);
    console.log('获取所有作业响应:', res);

    if (res.code === 200 && res.data && res.data.length > 0) {
      // 处理作业数据
      const homeworks = res.data.map(homework => {
        const weekNumber = homework.weeks || 0;

        return {
          id: homework.id || `homework-${new Date().getTime()}-${Math.random()}`,
          title: homework.title || `第${homework.weeks}周作业`,
          notice: homework.notice || '暂无说明',
          fileName: homework.fileName || '',
          fileUrl: homework.fileUrl || '',
          startTime: homework.startTime || '',
          endTime: homework.endTime || '',
          weeks: weekNumber,
          direction: homework.direction || direction,
          isSubmitted: false, // 默认设为未提交，稍后更新
          isActive: homework.isActive
        };
      });

      // 按周数排序，最新的排在前面
      homeworks.sort((a, b) => b.weeks - a.weeks);

      // 逐个查询每周作业的提交状态
      for (const homework of homeworks) {
        try {
          const statusRes = await getSubmissionCount(userId, homework.weeks);
          if (statusRes.code === 200 && statusRes.data) {
            homework.isSubmitted = statusRes.data.isSubmittedThisWeek === 1;

            // 同时从isActive判断是否已提交
            if (homework.isActive === false) {
              homework.isSubmitted = true;
            }
          }
        } catch (error) {
          console.error(`获取第${homework.weeks}周作业提交状态失败:`, error);
        }
      }

      // 更新数据
      allHomeworkList.value = homeworks;
      console.log('所有作业数据(含提交状态):', allHomeworkList.value);
    } else {
      ElMessage.info('没有找到历史作业');
      allHomeworkList.value = [];
    }
  } catch (error) {
    console.error('获取所有作业失败:', error);
    ElMessage.error('获取作业列表失败，请重试');
    allHomeworkList.value = [];
  }
};

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
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr && userInfoStr !== 'undefined' && userInfoStr !== 'null') {
      const userInfo = JSON.parse(userInfoStr)
      return {
        userId: userInfo.userId || userInfo.number || '',
        direction: userInfo.direction || '全栈方向',
        group: userInfo.group || '第二组' // 确保返回默认组别
      }
    } else {
      // console.warn('本地存储中没有有效用户信息')
      return { userId: '', direction: '全栈方向', group: '第二组' }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { userId: '', direction: '全栈方向', group: '第二组' }
  }
}

// 根据提交统计信息检查某周作业是否已提交
const checkSubmissionStatus = async (userId, currentWeek) => {
  try {
    // 使用专门的API获取提交状态
    const res = await getSubmissionCount(userId, currentWeek);
    console.log(`第${currentWeek}周作业提交统计响应:`, res);

    if (res.code === 200 && res.data) {
      // isSubmittedThisWeek 为 1 表示已提交，0 表示未提交
      const hasSubmitted = res.data.isSubmittedThisWeek === 1;
      const submissionCount = res.data.submissionCount || 0;
      const submitTime = res.data.submitTime || '';
      const comments = res.data.comments || '';

      console.log(`第${currentWeek}周作业提交状态:`, {
        hasSubmitted,
        submissionCount,
        submitTime,
        comments
      });

      return hasSubmitted;
    }

    return false;
  } catch (error) {
    console.error('检查提交状态失败:', error);
    return false;
  }
};

// 获取当前周数的辅助函数
const getCurrentWeek = async () => {
  try {
    // 优先通过API获取最新周数
    const response = await getCurrentWeeks();
    if (response.code === 200 && response.data) {
      // 获取成功后，更新到localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      userInfo.currentWeek = response.data;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('API获取当前周数成功:', response.data);
      return response.data;
    }

    // API获取失败，尝试从localStorage读取
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const weekFromStorage = userInfo.currentWeek || userInfo.weeks;
    if (weekFromStorage) {
      console.log('从localStorage获取周数:', weekFromStorage);
      return weekFromStorage;
    }

    console.warn('无法获取当前周数，使用默认值1');
    return 1; // 默认值仍然保留，作为最后的后备选项
  } catch (error) {
    console.error('获取当前周数失败:', error);
    // 尝试从localStorage读取
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.currentWeek || userInfo.weeks || 1;
    } catch (e) {
      return 1; // 发生错误时默认返回第1周
    }
  }
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

    // 获取当前周数 - 修改为await异步调用
    const currentWeekNum = await getCurrentWeek();

    // 先检查用户是否已提交当前周作业
    const hasSubmitted = await checkSubmissionStatus(userId, currentWeekNum);

    // 使用新的接口获取本周作业
    const res = await getRecentTask(userId, direction, currentWeekNum);
    console.log('获取本周作业响应:', res);

    // 无论状态码是什么，只要有数据就显示
    if (res.code === 200 && res.data) {
      // 适配服务器返回的数据格式
      const data = res.data;

      // 记录原始数据用于调试
      console.log('原始作业数据:', data);

      // 检查可能的提交状态字段
      const submittedStatus =
        data.isActive === false ||
        data.submitted === true ||
        data.isSubmitted === true ||
        data.status === 'submitted' ||
        hasSubmitted; // 使用从提交历史中获取的状态

      console.log('提交状态检查:', {
        isActive: data.isActive,
        submitted: data.submitted,
        isSubmitted: data.isSubmitted,
        status: data.status,
        hasSubmitted: hasSubmitted,
        finalStatus: submittedStatus
      });

      // 从homeworkUrl中提取文件名
      let fileName = '';
      let id = '';

      if (data.homeworkUrl) {
        // 提取URL最后的文件名部分
        const urlParts = data.homeworkUrl.split('/');
        fileName = urlParts[urlParts.length - 1];

        // 如果有文件ID (UUID格式)，提取作为ID
        const idMatch = fileName.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
        id = idMatch ? idMatch[1] : `homework-${new Date().getTime()}`;
      } else {
        // 生成一个临时ID
        id = `homework-${new Date().getTime()}`;
      }

      // 构建完整的作业对象
      homeworkList.value = [{
        id: id,
        title: `第${currentWeekNum}周作业`, // 使用当前周数作为标题
        notice: data.notice || '暂无说明',
        fileName: fileName,
        fileUrl: data.homeworkUrl,
        startTime: data.startTime,
        endTime: data.endTime,
        weeks: currentWeekNum, // 使用当前周数
        direction: direction,
        isSubmitted: submittedStatus // 从submittedStatus判断是否已提交
      }];

      console.log('处理后的作业数据:', homeworkList.value);
    } else {
      // 处理没有作业的情况
      console.log('没有查到本周作业:', res.message);
      homeworkList.value = [];

      // 区分不同错误情况的提示
      if (res.code === -1 && res.message === '没有查到最新作业') {
        ElMessage.info('本周暂无作业');
      } else {
        ElMessage.warning(res.message || '本周暂无作业');
      }
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
  if (!homework || (!homework.id && !homework.fileUrl)) {
    ElMessage.warning('无效的作业信息');
    return;
  }

  downloadingId.value = homework.id;

  try {
    // 显示下载开始提示
    ElMessage.info('开始下载作业文件，请稍候...');

    // 如果直接有fileUrl，使用它直接下载
    if (homework.fileUrl) {
      const fileName = homework.fileName || '作业.zip';

      // 直接打开链接下载文件
      const link = document.createElement('a');
      link.href = homework.fileUrl;
      link.setAttribute('download', fileName);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      ElMessage.success('作业文件下载成功');
    } else {
      // 使用API调用通过ID下载作业
      await downloadHomeworkFile(homework.id, homework.fileName);
      ElMessage.success('作业文件下载成功');
    }
  } catch (error) {
    console.error('下载作业失败:', error);
    ElMessage.error(error.message || '下载作业文件失败，请重试');
  } finally {
    downloadingId.value = null;
  }
};

// 组件挂载时获取作业列表
onMounted(() => {
  fetchHomeworks();
});

// 显示历史作业对话框
const showHistoryHomeworksDialog = () => {
  historyDialogVisible.value = true;
  allHomeworksLoading.value = true;
  fetchAllHomeworks().finally(() => {
    allHomeworksLoading.value = false;
  });
};

// 处理登出点击
const handleLogout = () => {
  logoutConfirmVisible.value = true;
};

// 确认登出
const confirmLogout = () => {
  try {
    // 调用登出工具函数清理缓存
    handleUserLogout();

    // 清除用户信息
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');

    // 清除所有与小组相关的缓存
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 清除组相关的缓存
        if (key.includes('group') || key.includes('Group') ||
          key.startsWith('groupInfo_')) {
          keysToRemove.push(key);
        }

        // 清除提交相关的缓存
        if (key.includes('submission') || key.includes('Submission')) {
          keysToRemove.push(key);
        }
      }
    }

    // 删除收集的键
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('登出时清除本地缓存:', key);
    });

    // 显示消息
    ElMessage.success('已成功退出登录');

    // 关闭确认对话框
    logoutConfirmVisible.value = false;

    // 重定向到登录页面
    router.push('/login');
  } catch (error) {
    console.error('登出失败:', error);
    ElMessage.error('退出登录失败，请重试');
  }
};
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
    font-size: 18px;
    color: #4a1691;
    margin: 5px 0;
    line-height: 1.4;
    line-height: 40px;
    font-weight: bold;
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

.logout-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 30px;
}

.logout-button {
  width: 80%;
  height: 5vh;
  background-color: #fff;
  color: #f56c6c;
  border: 1px solid #f56c6c;
  
  font-weight: bold;
  transition: all 0.3s ease;

  &:hover {
    background-color: #f56c6c;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(245, 108, 108, 0.3);
  }

  .el-icon {
    margin-right: 5px;
  }
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
