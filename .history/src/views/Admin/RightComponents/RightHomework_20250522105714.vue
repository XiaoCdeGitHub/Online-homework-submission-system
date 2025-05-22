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

    <div id="checkbox">
      <ul>
        <li v-for="(item, index) in stufilterList" :key="index" ref="li">
          <div class="circle"></div>
          {{ item.user_name }}
          <input type="checkbox" value="false" v-model="item.isSelect" @click="checkEach()" ref="ck" />
          <a v-show="item.is_apply" @click="downloadHomeworkFile(item)" class="download-link">点击此处下载作业</a>
          <span v-show="!item.is_apply" class="not-finish">暂未完成</span>
        </li>
      </ul>
    </div>
    <div id="line">
      <button @click="downloadSelected()">批量下载</button>
      <button @click="downloadExcel">下载报告</button>
      <div>
        全选<input type="checkbox" id="ckAll" v-model="isAll" ref="ckAll" @click="checkAll()" />
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { Plus, UploadFilled } from '@element-plus/icons-vue';
import arrayToExcel from '../../../plugins/arrayToExcel/index';
import { loadFile } from '../../../utils/brower';
import { fuzzyStudents } from '@/service/api/admin';
import { useGroupStore } from '@/stores/group';
import { publishHomework, downloadHomework, getFinalExcel } from '@/service/api/adminHomework';

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
const stufilterList = ref([
  { id: 1, user_name: '小鱼', group_name: '开发', is_active: 0, userId: 'user1' },
  { id: 2, user_name: '李李好', group_name: '开发', is_active: 0, userId: 'user2' },
  { id: 3, user_name: '脆脆鲨', group_name: '秘书处', is_active: 1, userId: 'user3' },
  { id: 4, user_name: '崔东山', group_name: '设计', is_active: 1, userId: 'user4' },
]);

// 全选状态
const isAll = ref(false);

// 初始化函数
onMounted(() => {
  if (JSON.parse(localStorage.getItem("groupInfo"))) {
    stufilterList.value = JSON.parse(localStorage.getItem("groupInfo")).data;
    console.log(stufilterList.value, 'stufilterList');
  }
  // 可以在这里加载更多数据
});

// 显示发布作业对话框
const showPublishDialog = () => {
  publishDialogVisible.value = true;
  // 重置表单
  Object.keys(publishForm).forEach(key => {
    if (key === 'weeks') {
      publishForm[key] = 1;
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

  if (!validTypes.includes(file.raw.type)) {
    ElMessage.error('不支持的文件类型，请上传zip、rar、doc、docx、md、jpg或png格式的文件');
    publishForm.file = null;
    return false;
  }

  // 验证文件大小，限制10MB
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.raw.size > maxSize) {
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

    // 假设当前周数是1，这里应该根据实际情况获取
    const weeks = 1;

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
  // 重置表单
  exportForm.direction = '';
  exportForm.group = '';
  exportForm.weeks = 1;
};

// 导出Excel报告
const downloadExcel = () => {
  if (stufilterList.value.length === 0) {
    ElMessage({ message: '暂时没有生成报告的数据', type: 'warning' });
    return;
  }

  // 显示导出对话框
  showExportDialog();
};

// 确认导出报告
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

/* 学生列表 */
#checkbox {
  height: calc(100% - 150px);
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
}

/* 头像 */
#checkbox ul li .circle {
  display: inline-block;
  width: 35px;
  height: 35px;
  background-color: #fff;
  background-size: cover;
  background-position: center;
  background-image: url('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');
  border-radius: 50%;
  box-shadow: 1px 1px 10px 1px #e2e1ed;
  margin-top: 5px;
  margin-left: 10px;
  margin-right: 15px;
}

/* 多选框 */
#checkbox ul li input[type='checkbox'] {
  margin-left: auto;
  margin-right: 10px;
  margin-top: 18px;
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

#line button:hover {
  opacity: 0.9;
}

#line button:active {
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
</style>
