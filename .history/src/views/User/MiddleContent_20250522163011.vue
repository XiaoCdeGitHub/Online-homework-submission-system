<template>
  <div class="admin-content-middle">
    <div class="middle-header">
      <div class="top-left-part">
        <div class="morning-user">
          <div class="user-photo">
            <img src="https://cd-mapbed.oss-cn-beijing.aliyuncs.com/preview.gif" alt="" />
          </div>
          <p>{{ greeting }}，{{ userData.name }}!</p>
        </div>
        <div class="fly1">
          <img src="" alt="" />
        </div>
      </div>
      <div class="human-photos">
        <img src="@/assets/img/admin/p1.png" alt="" />
        <img src="@/assets/img/admin/p2.png" alt="" />
        <img src="@/assets/img/admin/p3.png" alt="" />
        <img src="@/assets/img/admin/p4.png" alt="" />
      </div>
      <div class="progress">
        <div class="progress-header">
          <p>{{ progressTitle }}</p>
          <el-button type="primary" size="small" circle @click="refreshSubmissionStatus" :loading="refreshingStatus">
            <el-icon>
              <Refresh />
            </el-icon>
          </el-button>
        </div>
        <el-progress :percentage="progressPercentage" :stroke-width="15" striped striped-flow :duration="10" />
        <div class="progress-stats">
          <span v-if="submissionStats.submissionCount > 0">提交次数: {{ submissionStats.submissionCount }}</span>
          <span v-if="submissionStats.isSubmittedThisWeek === 1" class="success">已通过: 1</span>
          <span v-if="submissionStats.submissionCount > 0 && submissionStats.isSubmittedThisWeek === 0"
            class="pending">待审核: 1</span>
        </div>
      </div>
    </div>
    <div class="middle-body">
      <div class="file-upload">
        <img src="@/assets/img/user/fileUpload.png" alt="">
        <div class="text">
          点击此处提交文件<br>
          <span>（或者将文件拖拽到此处）<br></span>
          <span>支持格式：zip、rar、doc、docx、md、jpg、png</span>
        </div>
        <div class="upload-module">
          <el-upload class="upload-box" drag action="#" :auto-upload="false" :on-change="beforeUpload"
            accept=".zip,.rar,.doc,.docx,.md,.jpg,.png" multiple>
            <template #trigger>
              <el-icon class="el-icon--upload">
                <UploadFilled />
              </el-icon>
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
          <el-descriptions>
            <el-descriptions-item>
              <template #label>
                <div class="cell-item">
                  <el-icon color="#6B5AD8">
                    <Location />
                  </el-icon>
                  阶段:
                </div>
              </template>
              <el-tag size="small">{{ userData.period }}</el-tag></el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="cell-item">
                  <el-icon color="#6B5AD8">
                    <Flag />
                  </el-icon>
                  方向:
                </div>
              </template>
              <el-tag size="small">{{ userData.direction }}</el-tag></el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="cell-item">
                  <el-icon color="#6B5AD8">
                    <Finished />
                  </el-icon>
                  组别:
                </div>
              </template>
              <el-tag size="small">{{ userData.group }}</el-tag></el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="cell-item">
                  <el-icon color="#6B5AD8" :style="iconStyle">
                    <user />
                  </el-icon>
                  姓名：
                </div>
              </template>
              <el-tag size="small">{{ userData.name }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="cell-item">
                  <el-icon color="#6B5AD8">
                    <Document />
                  </el-icon>
                  学号:
                </div>
              </template>
              <el-tag size="small">{{ userData.id }}</el-tag></el-descriptions-item>
          </el-descriptions>

        </div>
        <div class="remark-form">
          <el-input v-model="comments" type="textarea" :rows="4"
            :placeholder="'请输入作业备注 (推荐填写):\n• 简要描述你完成的内容\n• 遇到的问题或需要帮助的地方\n• 其他想告诉老师的信息'">
            <template #prepend>
              <div class="remark-label">
                <el-icon color="#6B5AD8">
                  <ChatDotRound />
                </el-icon>
                <span>作业备注</span>
              </div>
            </template>
          </el-input>
        </div>
      </div>
      <div class="button-submit" @click="submitHomework">
        <p>确认提交&nbsp;<el-icon>
            <SuccessFilled />
          </el-icon></p>
      </div>
      <!-- 上传状态对话框 -->
      <el-dialog v-model="uploadDialogVisible" title="上传状态" width="30%" center :close-on-click-modal="false">
        <div class="upload-status">
          <el-progress :percentage="uploadPercentage" :status="uploadStatus" :stroke-width="20" striped striped-flow />
          <div class="status-text">{{ uploadStatusText }}</div>
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
      <el-dialog v-model="historyDialogVisible" title="提交历史" width="60%">
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

      <!-- 备注确认对话框 -->
      <el-dialog v-model="commentConfirmVisible" title="提交确认" width="30%" center>
        <div class="comment-confirm-content">
          <el-icon class="warning-icon" color="#E6A23C" :size="24">
            <Warning />
          </el-icon>
          <span>您没有添加任何备注，建议添加备注以便老师了解您的作业情况。是否继续提交？</span>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="commentConfirmVisible = false">返回添加备注</el-button>
            <el-button type="primary" @click="confirmSubmitWithoutComment">
              继续提交
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
    <div class="middle-footer">
      <div class="little-boy">
        <span class="date">
          {{ nowDate }}
        </span>
        <span class="time">
          {{ currentTime }}
        </span>
        <span>

        </span>
        <img src="@/assets/img/user/little-boy.png" alt="">
      </div>
      <div class="carousel">

        <el-carousel :interval="4000" type="card" height="220px">
          <el-carousel-item v-for="(item, index) in carousel" :key="index">
            <img :src="item" alt="">
          </el-carousel-item>
        </el-carousel>

      </div>
    </div>

  </div>
</template>

<script setup>
import {
  Location, Flag, Finished, Document, User, SuccessFilled, UploadFilled, Warning,
  ChatDotRound, Refresh
} from '@element-plus/icons-vue'
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadHomework, getHistorySubmit, getSubmissionCount, getRecentTask } from '@/service/api/homework'
import { getCurrentWeeks } from '@/service/api/adminHomework'

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
const selectedFile = ref(null) // 添加选中文件的引用

// 使用手动上传模式，不再使用 action
const uploadUrl = '#' // 设置为 # 表示不使用自动上传

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

// 提交统计数据
const submissionStats = ref({
  submissionCount: 0,         // 总提交次数
  isSubmittedThisWeek: 0,     // 是否提交本周作业(0或1)
  comments: '',               // 备注
  submitTime: ''              // 提交时间
})

// 计算时段问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

// 计算提交进度
const progressPercentage = computed(() => {
  if (submissionStats.value.submissionCount === 0) return 0
  if (submissionStats.value.isSubmittedThisWeek === 1) return 100
  return submissionStats.value.submissionCount > 0 ? 50 : 0 // 如果有提交但本周未提交，显示50%
})

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
      return {
        userId: userInfo.userId || userInfo.number || '',
        direction: userInfo.direction || '全栈方向'
      }
    } else {
      console.warn('本地存储中没有有效用户信息')
      return { userId: '', direction: '全栈方向' }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return { userId: '', direction: '全栈方向' }
  }
}

// 文件上传前的验证
const beforeUpload = (uploadFile) => {
  const file = uploadFile.raw || uploadFile;

  // 验证文件类型
  const validTypes = ['application/zip', 'application/x-rar-compressed', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown', 'image/jpeg', 'image/png']

  // 获取文件扩展名（不区分大小写）
  const fileName = file.name.toLowerCase()
  const isValidExtension = /\.(zip|rar|doc|docx|md|jpg|png)$/.test(fileName)

  // 验证文件类型
  if (!isValidExtension) {
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

  // 存储选中的文件，以便后续手动上传
  selectedFile.value = file

  // 返回 false 阻止自动上传
  return false
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

// 添加备注确认对话框的状态控制
const commentConfirmVisible = ref(false)

// 手动提交作业
const submitHomework = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  const { userId } = getUserInfoFromStorage()
  if (!userId) {
    ElMessage.warning('获取用户信息失败，请重新登录')
    return
  }

  // 提醒用户添加备注
  if (!comments.value || comments.value.trim() === '') {
    // 显示自定义备注确认对话框
    commentConfirmVisible.value = true
  } else {
    // 有备注，直接提交
    proceedWithSubmission()
  }
}

// 确认不添加备注继续提交
const confirmSubmitWithoutComment = () => {
  commentConfirmVisible.value = false
  proceedWithSubmission()
}

// 执行提交操作
const proceedWithSubmission = async () => {
  uploading.value = true
  uploadDialogVisible.value = true
  uploadPercentage.value = 0
  uploadStatus.value = ''
  uploadStatusText.value = '准备上传...'

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('userId', getUserInfoFromStorage().userId)

    // 确保备注有值，即使是空字符串
    const commentText = comments.value?.trim() || '无备注'
    formData.append('comments', commentText)

    formData.append('weeks', currentWeek.value)

    // 提交时间格式化: yyyy-MM-dd HH:mm:ss
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const submitTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

    formData.append('submitTime', submitTime)

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadPercentage.value < 90) {
        uploadPercentage.value += 10
        uploadStatusText.value = `上传中... ${uploadPercentage.value}%`
      }
    }, 300)

    // 调用API上传作业
    const response = await uploadHomework(formData)
    console.log('上传作业响应:', response)

    clearInterval(progressInterval)

    if (response.code === 200) {
      uploadPercentage.value = 100
      uploadStatus.value = 'success'
      uploadStatusText.value = '上传成功！'
      ElMessage.success('作业上传成功')
      selectedFile.value = null // 清空选中的文件
      comments.value = '' // 清空备注

      // 手动更新提交状态，确保UI立即反映上传成功
      submissionStats.value = {
        submissionCount: submissionStats.value.submissionCount + 1,
        isSubmittedThisWeek: 1, // 设置为已提交本周作业
        comments: commentText,
        submitTime: submitTime
      }

      console.log('手动更新后的提交统计:', submissionStats.value)
      console.log('更新后进度百分比:', progressPercentage.value)

      // 立即更新标题
      updateProgressTitle()

      // 上传成功后刷新提交统计
      setTimeout(() => {
        loadSubmissionStats()
        // 并检查历史记录以双重确认
        setTimeout(checkSubmissionHistory, 500)
      }, 1000)
    } else {
      uploadStatus.value = 'exception'

      // 针对常见错误优化提示信息
      if (response.code === 404) {
        uploadStatusText.value = '上传失败：服务器接口未找到，请联系管理员'
        ElMessage.error('服务器接口未找到，请联系管理员检查系统配置')
      } else {
        uploadStatusText.value = `上传失败：${response.message || '未知错误'}`
        ElMessage.error(response.message || '上传失败，请稍后重试')
      }
    }
  } catch (error) {
    uploadStatus.value = 'exception'

    // 改进错误提示
    if (error.message && error.message.includes('404')) {
      uploadStatusText.value = '上传失败：服务器接口未找到，请联系管理员'
      ElMessage.error('服务器接口未找到，请联系管理员检查系统配置')
    } else {
      uploadStatusText.value = `上传失败：${error.message || '未知错误'}`
      ElMessage.error(error.message || '上传失败，请重试')
    }

    console.error('上传作业失败:', error)
  } finally {
    uploading.value = false
  }
}

// 查看历史提交
const viewHistory = async () => {
  const { userId } = getUserInfoFromStorage()
  if (!userId) {
    ElMessage.warning('获取用户信息失败，请重新登录')
    return
  }

  try {
    const response = await getHistorySubmit(userId)

    if (response.code === 200) {
      submissionHistory.value = response.data || []
      historyDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取历史记录失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '获取历史记录失败，请重试')
    console.error('获取历史提交失败:', error)
  }
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

// 加载提交统计数据
const loadSubmissionStats = async () => {
  try {
    const { userId } = getUserInfoFromStorage()
    if (!userId) return

    console.log(`正在获取第${currentWeek.value}周的提交统计数据...`)
    const response = await getSubmissionCount(userId, currentWeek.value)
    console.log('提交统计API响应:', response)

    if (response.code === 200 && response.data) {
      // 更新提交统计数据
      submissionStats.value = {
        submissionCount: response.data.submissionCount || 0,
        isSubmittedThisWeek: response.data.isSubmittedThisWeek || 0,
        comments: response.data.comments || '',
        submitTime: response.data.submitTime || ''
      }

      console.log('提交统计数据已更新:', submissionStats.value)
      console.log('进度百分比:', progressPercentage.value)

      // 强制触发UI更新
      updateProgressTitle()
    } else {
      console.warn('获取提交统计失败，使用默认值')

      // 检查历史提交记录 - 如果有当前周的提交记录，手动设置状态
      checkSubmissionHistory()
    }
  } catch (error) {
    console.error('获取提交统计失败:', error)

    // 发生错误时，检查历史提交记录作为备选方案
    checkSubmissionHistory()
  }
}

// 从历史记录检查是否有当前周的提交
const checkSubmissionHistory = async () => {
  try {
    const { userId } = getUserInfoFromStorage()
    if (!userId) return

    console.log('尝试从历史记录确认提交状态...')
    const response = await getHistorySubmit(userId)

    if (response.code === 200 && response.data && response.data.length > 0) {
      // 查找当前周的提交记录
      const currentWeekSubmission = response.data.find(item =>
        parseInt(item.weeks) === parseInt(currentWeek.value)
      )

      if (currentWeekSubmission) {
        console.log('在历史记录中找到当前周提交:', currentWeekSubmission)

        // 手动更新提交状态
        submissionStats.value = {
          submissionCount: 1,
          isSubmittedThisWeek: 1, // 在历史记录中找到，则设为已提交
          comments: currentWeekSubmission.comments || '',
          submitTime: currentWeekSubmission.submitTime || ''
        }

        console.log('根据历史记录更新统计数据:', submissionStats.value)
        updateProgressTitle()
      }
    }
  } catch (error) {
    console.error('获取历史提交失败:', error)
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
setInterval(function () {
  currentTime.value = getCurrentTime();
}, 1000);

// 获取当前周数
const fetchCurrentWeek = async () => {
  try {
    const response = await getCurrentWeeks()
    if (response.code === 200) {
      currentWeek.value = response.data || 1
    }
  } catch (error) {
    console.error('获取当前周数失败:', error)
    // 失败时默认使用第一周
    currentWeek.value = 1
  }
}

// 获取当前任务信息
const fetchCurrentTask = async () => {
  try {
    const { userId, direction } = getUserInfoFromStorage()
    if (!userId) return

    // 使用当前周数作为参数
    const weeks = currentWeek.value || 1;
    console.log('MiddleContent请求作业数据:', { direction, weeks });

    const response = await getRecentTask(userId, direction, weeks)
    if (response.code === 200 && response.data) {
      // 设置进度信息
      progressTitle.value = `第${response.data.weeks || weeks}周 进度`
    } else if (response.code === -1 && response.message === '没有查到最新作业') {
      // 没有作业时显示当前周数
      progressTitle.value = `第${weeks}周 进度`
      console.log('MiddleContent没有找到本周作业，使用默认标题');
    }
  } catch (error) {
    console.error('获取当前任务失败:', error)
  }
}

// 组件挂载时的操作
onMounted(async () => {
  getUserInfoFromStorage()
  await fetchCurrentWeek()
  console.log('当前周数:', currentWeek.value)
  await fetchCurrentTask()

  // 首先尝试从提交统计获取状态
  await loadSubmissionStats()

  // 如果提交统计返回未提交，再尝试从历史记录确认
  if (submissionStats.value.isSubmittedThisWeek === 0) {
    await checkSubmissionHistory()
  }

  // 根据提交状态更新进度标题
  updateProgressTitle()
  console.log('初始加载后的提交统计:', submissionStats.value)
  console.log('初始进度百分比:', progressPercentage.value)
})

// 添加进度标题
const progressTitle = ref('本周进度')

// 监听提交统计变化，更新进度标题
watch(submissionStats, () => {
  updateProgressTitle()
})

// 更新进度标题
const updateProgressTitle = () => {
  const weekText = `第${currentWeek.value}周`

  if (submissionStats.value.isSubmittedThisWeek === 1) {
    progressTitle.value = `${weekText} - 已提交`
  } else if (submissionStats.value.submissionCount > 0) {
    progressTitle.value = `${weekText} - 提交审核中`
  } else {
    progressTitle.value = `${weekText} - 未提交`
  }
}

// 添加刷新提交状态的逻辑
const refreshingStatus = ref(false)
const refreshSubmissionStatus = async () => {
  if (refreshingStatus.value) return
  refreshingStatus.value = true

  try {
    await loadSubmissionStats()
    ElMessage.success('提交统计刷新成功')
  } catch (error) {
    ElMessage.error('刷新提交统计失败，请稍后重试')
  } finally {
    refreshingStatus.value = false
  }
}
</script>

<style lang="less" scoped>
.admin-content-middle {
  position: relative;
  width: 75%;
  height: 94vh;
  // background-color:blue;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.middle-header {
  width: 100%;
  height: 14vh;
  // background-color: red;
  display: flex;
  justify-content: center;
  flex-direction: row;

  .user-photo {
    position: relative;
    left: -20px;

    img {
      width: 50px;
      height: 50px;
      border-radius: 100px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2), 0 0 8px rgba(0, 0, 0, 0.1);
    }
  }

  .top-left-part {
    width: 40%;
    height: 100%;
    //  background-color: antiquewhite;
    display: flex;
    flex-direction: column;
  }

  .morning-user {
    width: 80%;
    height: 6vh;
    // background-color: red;
    display: flex;
    //  justify-content: center;
    flex-direction: row;
    margin-left: 24px;
    margin-top: 8px;

    p {
      font-size: 20px;
      margin-top: 10px;
      margin-left: 5px;
      font-weight: bolder;
    }

    // background-color: purple;
  }

  .fly1 {
    position: absolute;
    left: 100px;
    top: 35px;
    width: 200px;
    height: 70px;
    background: url('@/assets/img/admin/fly1.png');
    background-size: 100% 100%;
  }

  .human-photos {
    width: 60%;
    height: 100%;
    display: flex;
    text-align: right;
    // overflow: auto;
  }

  .progress {
    width: 30%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 10px;

      p {
        margin-top: 10px;
        font-size: 12px;
        font-weight: bold;
      }
    }

    p {
      margin-top: 10px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
  }
}

.middle-body {
  position: relative;
  top: -10px;
  width: 98%;
  height: 44vh;
  margin-left: auto;
  margin-right: auto;
  background-color: #f1f0f5;
  border-radius: 10px;
  box-shadow: #7d70a9 0px 0px 10px;


  display: flex;
  flex-direction: row;
  align-items: center;

  .file-upload {
    width: 400px;
    height: 260px;
    // background-color: red;
    position: relative;

    img {
      width: 400px;
      height: 260px;
    }

    .text {
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      span {
        font-size: 12px;
      }
    }

    .upload-module {
      // background-color: red;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 260px;

      :deep(.el-upload-dragger) {
        width: 400px;
        height: 240px;
        background-color: green;
        opacity: 0;
      }

    }
  }

  .user-form {
    width: 500px;
    height: 260px;
    margin-left: -20px;
    // background-color: red;

    .main-form {
      width: 80%;
      height: 48%;
      margin-top: 17px;
      padding: 8px;
      margin-left: auto;
      margin-right: auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: #7d70a9 0px 0px 10px;
    }

    .remark-form {
      width: 80%;
      height: 35%;
      margin-top: 10px;
      margin-left: auto;
      margin-right: auto;

      .remark-label {
        display: flex;
        align-items: center;
        padding: 0 8px;
        white-space: nowrap;

        .el-icon {
          margin-right: 4px;
        }

        span {
          font-weight: bold;
          color: #6B5AD8;
        }
      }

      :deep(.el-input__prepend) {
        background-color: #f5f2ff;
        border-color: #d9d4f6;
      }

      :deep(.el-textarea__inner) {
        border-color: #d9d4f6;
        font-size: 14px;
        line-height: 1.5;

        &:focus {
          border-color: #6B5AD8;
          box-shadow: 0 0 0 2px rgba(107, 90, 216, 0.2);
        }

        &::placeholder {
          color: #8e85b9;
          font-size: 13px;
        }
      }
    }

    textarea::placeholder {
      color: #8e85b9;
      /* 更改为您想要的颜色值 */
    }
  }

  .button-submit {
    width: 100px;
    height: 82%;
    background-color: #8A90FA;
    margin-right: 10px;
    border-radius: 10px;
    box-shadow: #7d70a9 0px 0px 10px;

    p {
      display: block;
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      writing-mode: vertical-lr;
      height: 224px;
      width: 30px;
      // background-color: green;
      margin-left: auto;
      margin-right: auto;
    }
  }

  .button-submit:active {
    transform: scale(0.9);
    /* 缩小按钮 */
    transition: transform 0.3s ease-in-out;
    /* 添加过渡效果 */
  }
}

.middle-footer {
  width: 98%;
  height: 34vh;
  display: flex;
  flex-direction: row;

  // background-color: red;
  .little-boy {
    position: relative;

    img {
      width: 22vw;
      height: 37vh;
      margin-top: -10px;
      margin-left: 20px;

    }

    .date {
      position: absolute;
      top: 21vh;
      left: 2.5vw;
      font-weight: 600;
      color: white;
    }

    .time {
      position: absolute;
      top: 6vh;
      left: 5.8vw;
      color: white;
      font-weight: 600;

    }
  }

  .carousel {
    width: 700px;
    height: 37vh;
    // background-color: white;
    margin-left: 50px;

    img {
      width: 100%;
      height: 100%;
    }
  }

  .el-carousel__item h3 {
    color: #475669;
    opacity: 0.75;
    line-height: 200px;
    margin: 0;
    text-align: center;
  }

  .el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
  }

  .el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
  }
}

.upload-status {
  text-align: center;

  .status-text {
    margin-top: 16px;
    font-size: 16px;
    font-weight: bold;
  }
}

// 添加进度统计样式
.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;

  span {
    margin-right: 10px;

    &.success {
      color: #67c23a;
    }

    &.rejected {
      color: #f56c6c;
    }

    &.pending {
      color: #e6a23c;
    }
  }
}

// 添加备注确认对话框样式
.comment-confirm-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
  line-height: 1.6;

  .warning-icon {
    margin-right: 10px;
    margin-top: 2px;
  }

  span {
    flex: 1;
  }
}

// 对话框底部按钮样式
.dialog-footer {
  display: flex;
  justify-content: flex-end;

  .el-button+.el-button {
    margin-left: 12px;
  }
}
</style>
