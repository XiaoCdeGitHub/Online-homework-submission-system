<template>
  <div class="admin-content-middle">
    <!-- ... 现有代码保持不变 ... -->
    <div class="middle-body">
      <div class="file-upload">
        <img src="@/assets/img/user/fileUpload.png" alt="">
        <div class="text">
          点击此处提交文件<br>
          <span>（或者将文件拖拽到此处）<br></span>
          <span>支持格式：zip、rar、doc、docx、md、jpg、png</span>
        </div>
        <div class="upload-module">
          <el-upload
            class="upload-box"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :data="uploadParams"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :on-progress="uploadProgress"
            accept=".zip,.rar,.doc,.docx,.md,.jpg,.png"
            multiple
          >
            <template #trigger>
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                拖拽文件到此处或 <em>点击上传</em>
              </div>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持zip、rar、doc、docx、md、jpg、png格式，文件大小不超过10MB
              </div>
            </template>
          </el-upload>
        </div>
      </div>
      <div class="user-form">
        <div class="main-form">
          <!-- ... 现有表单代码保持不变 ... -->
        </div>
        <div class="remark-form">
          <el-input
            v-model="comments"
            type="textarea"
            placeholder="备注 (选填):"
            :rows="4"
          />
        </div>
      </div>
      <div class="button-submit" @click="submitHomework">
        <p>确认提交&nbsp;<el-icon>
            <SuccessFilled />
          </el-icon></p>
      </div>
      <!-- 上传状态对话框 -->
      <el-dialog
        v-model="uploadDialogVisible"
        title="上传状态"
        width="30%"
        center
        :close-on-click-modal="false"
      >
        <div class="upload-status">
          <el-progress 
            :percentage="uploadPercentage" 
            :status="uploadStatus" 
            :stroke-width="20"
            striped
            striped-flow
          />
          <div class="status-text">{{uploadStatusText}}</div>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="uploadDialogVisible = false" :disabled="uploading">关闭</el-button>
            <el-button type="primary" @click="viewHistory" :disabled="uploading">
              查看历史提交
            </el-button>
          </span>
        </template>
      </el-dialog>
      
      <!-- 上传历史对话框 -->
      <el-dialog
        v-model="historyDialogVisible"
        title="提交历史"
        width="60%"
      >
        <el-table :data="submissionHistory" style="width: 100%">
          <el-table-column prop="fileName" label="文件名" />
          <el-table-column prop="submitTime" label="提交时间" />
          <el-table-column prop="weeks" label="周数" />
          <el-table-column prop="comments" label="备注" />
          <el-table-column label="状态">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" effect="plain">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </div>
    <!-- ... 其他现有代码保持不变 ... -->
  </div>
</template>

<script setup>
import {
  Location, Flag, Finished, Document, User, SuccessFilled, UploadFilled
} from '@element-plus/icons-vue'
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadHomework, getHistorySubmit, getSubmissionCount } from '@/service/api/homework'

// 用户数据，初始化为默认值
const userData = ref({
  period: '适应期第一周',
  direction: '全栈方向',
  group: '第二组',
  name: '测试用户', 
  id: '测试学号'    
})

// 上传相关状态
const comments = ref('')
const uploading = ref(false)
const uploadPercentage = ref(0)
const uploadStatus = ref('')
const uploadStatusText = ref('')
const uploadDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const submissionHistory = ref([])
const currentWeek = ref(1) // 可通过API获取当前周数

// 上传URL和参数
const uploadUrl = '/user/uploadHomework'
const uploadHeaders = computed(() => {
  return {
    'x-access-token': localStorage.getItem('token') || ''
  }
})
const uploadParams = computed(() => {
  return {
    userId: userData.value.userId || '',
    weeks: currentWeek.value,
    submitTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0]
  }
})

// 获取状态标签类型
const getStatusTagType = (status) => {
  switch (status) {
    case 0: return 'info'    // 待审核
    case 1: return 'success' // 已通过
    case 2: return 'danger'  // 未通过
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '未通过'
    default: return '未知'
  }
}

// 从本地存储获取用户信息
const getUserInfoFromStorage = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    console.log('Storage user info:', userInfoStr)

    if (userInfoStr && userInfoStr !== 'undefined' && userInfoStr !== 'null') {
      const userInfo = JSON.parse(userInfoStr)

      // 更新用户数据
      userData.value = {
        period: userInfo.period || '适应期第一周',
        direction: userInfo.direction || '全栈方向',
        group: userInfo.group || '第二组',
        name: userInfo.name || '未知用户',
        id: userInfo.number || userInfo.userId || '未知ID',
        userId: userInfo.userId || userInfo.number || ''
      }
      return true
    } else {
      console.warn('本地存储中没有有效用户信息')
      return false
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
}

// 文件上传前的验证
const beforeUpload = (file) => {
  // 验证文件类型
  const validTypes = ['application/zip', 'application/x-rar-compressed', 'application/msword', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                   'text/markdown', 'image/jpeg', 'image/png']
  const isValidType = validTypes.includes(file.type)
  
  if (!isValidType) {
    ElMessage.error('不支持的文件类型，请上传zip、rar、doc、docx、md、jpg或png格式的文件')
    return false
  }
  
  // 验证文件大小，限制10MB
  const maxSize = 10 * 1024 * 1024 // 10MB
  const isValidSize = file.size <= maxSize
  
  if (!isValidSize) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  
  uploadDialogVisible.value = true
  uploading.value = true
  uploadPercentage.value = 0
  uploadStatus.value = ''
  uploadStatusText.value = '准备上传...'
  
  return isValidType && isValidSize
}

// 上传进度处理
const uploadProgress = (event, file, fileList) => {
  uploadPercentage.value = Math.round(event.percent)
  uploadStatusText.value = `上传中... ${uploadPercentage.value}%`
}

// 上传成功处理
const handleUploadSuccess = (response, file, fileList) => {
  uploading.value = false
  
  if (response.code === 200) {
    uploadPercentage.value = 100
    uploadStatus.value = 'success'
    uploadStatusText.value = '上传成功！'
    ElMessage.success('文件上传成功')
  } else {
    uploadStatus.value = 'exception'
    uploadStatusText.value = `上传失败: ${response.message || '未知错误'}`
    ElMessage.error(response.message || '上传失败')
  }
  
  // 刷新提交历史
  loadSubmissionHistory()
}

// 上传错误处理
const handleUploadError = (error, file, fileList) => {
  uploading.value = false
  uploadStatus.value = 'exception'
  uploadStatusText.value = '上传失败！'
  
  console.error('文件上传失败:', error)
  ElMessage.error('文件上传失败，请重试')
}

// 手动提交作业
const submitHomework = async () => {
  // 如果没有选择文件，提示用户
  const uploadInput = document.querySelector('.upload-box input[type="file"]')
  if (!uploadInput || !uploadInput.files || uploadInput.files.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  // 添加备注
  if (comments.value) {
    uploadParams.value.comments = comments.value
  }
  
  // 触发上传
  const uploadButton = document.querySelector('.upload-box .el-upload__input')
  if (uploadButton) {
    uploadButton.dispatchEvent(new MouseEvent('click'))
  }
}

// 查看历史提交
const viewHistory = async () => {
  historyDialogVisible.value = true
  await loadSubmissionHistory()
}

// 加载提交历史
const loadSubmissionHistory = async () => {
  try {
    const userId = userData.value.userId
    if (!userId) {
      ElMessage.warning('获取用户ID失败，无法加载提交历史')
      return
    }
    
    const res = await getHistorySubmit(userId)
    if (res.code === 200) {
      submissionHistory.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取提交历史失败')
    }
  } catch (error) {
    console.error('获取提交历史失败:', error)
    ElMessage.error('获取提交历史失败，请重试')
  }
}

// 加载提交统计信息
const loadSubmissionStats = async () => {
  try {
    const userId = userData.value.userId
    if (!userId) {
      return
    }
    
    const res = await getSubmissionCount(userId, currentWeek.value)
    if (res.code === 200 && res.data) {
      // 可以在这里处理统计信息，例如显示提交次数等
      console.log('提交统计信息:', res.data)
    }
  } catch (error) {
    console.error('获取提交统计信息失败:', error)
  }
}

//轮播图内容
const carousel = ref([
  'https://cd-mapbed.oss-cn-beijing.aliyuncs.com/640.jpg',
  'https://cd-mapbed.oss-cn-beijing.aliyuncs.com/640%20(2).jpg',
  'https://cd-mapbed.oss-cn-beijing.aliyuncs.com/640%20(1).jpg',
  'https://cd-mapbed.oss-cn-beijing.aliyuncs.com/fdb9787da22ec174a16ae3ee29230a2.jpg',
  'https://cd-mapbed.oss-cn-beijing.aliyuncs.com/4f00dc307b594c9c33b0a89be4b9d53.jpg',
])

// 创建一个表示当前日期的Date对象
let currentDate = new Date();
// 获取年份
let year = currentDate.getFullYear();
// 获取月份（注意：返回的月份是从0开始的，所以需要加1）
let month = currentDate.getMonth() + 1;
// 获取日期
let day = currentDate.getDate();
const nowDate = year + '-' + month + '-' + day;
// 打印当前日期
console.log(nowDate, 'nowDate');

function getCurrentTime() {
  let currentTime = new Date();
  let hours = currentTime.getHours();
  let minutes = currentTime.getMinutes();
  let seconds = currentTime.getSeconds();
  // 格式化小时、分钟和秒，以确保始终为两位数
  if (hours < 10) {
    hours = '0' + hours;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (seconds < 10) {
    seconds = '0' + seconds;
  }
  let timeString = hours + ':' + minutes + ':' + seconds;
  return timeString;
}

const currentTime = ref('')
// 每秒更新当前时间
setInterval(function() {
  currentTime.value = getCurrentTime();
}, 1000);

// 组件挂载时获取用户信息和提交统计
onMounted(() => {
  getUserInfoFromStorage()
  loadSubmissionStats()
})
</script>

<style lang="less" scoped>
/* 在这里添加新的样式或保留现有样式 */
.remark-form {
  width: 80%;
  height: 35%;
  margin-top: 10px;
  margin-left: auto;
  margin-right: auto;
}

.upload-status {
  text-align: center;
  
  .status-text {
    margin-top: 16px;
    font-size: 16px;
    font-weight: bold;
  }
}

/* 保留现有样式 */
/* ... */
</style>