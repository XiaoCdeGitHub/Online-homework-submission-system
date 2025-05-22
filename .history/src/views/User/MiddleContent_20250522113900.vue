<template>
  <div class="admin-content-middle">
    <div class="middle-header">
      <div class="top-left-part">
        <div class="morning-user">
          <div class="user-photo">
            <img src="https://cd-mapbed.oss-cn-beijing.aliyuncs.com/preview.gif" alt="" />
          </div>
          <p>早上好，{{ userData.name }}!</p>
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
        <p>第二周 本组进度</p>
        <el-progress :percentage="50" :stroke-width="15" striped striped-flow :duration="10" />
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
          <el-upload class="upload-box" drag action="#" :auto-upload="false" :before-upload="beforeUpload"
            :on-change="(file) => { uploadedFile = file.raw }" accept=".zip,.rar,.doc,.docx,.md,.jpg,.png" :limit="1">
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
                支持zip、rar、doc、docx、md、jpg、png格式，文件大小不超过100MB
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
          <el-input v-model="comments" type="textarea" placeholder="备注 (选填):" :rows="4" />
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
    </div>
    <div class="middle-footer">
      <div class="little-boy">
        <span class="date">
          {{ nowDate }}
        </span>
        <span class="time">
          {{ currentTime }}
        </span>
        <span class>

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
  Location, Flag, Finished, Document, User, SuccessFilled, UploadFilled
} from '@element-plus/icons-vue'
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
const uploadedFile = ref(null) // 存储待上传的文件

// 上传URL和参数（使用计算属性以便动态更新）
const uploadParams = computed(() => {
  return {
    userId: userData.value.userId || '',
    weeks: currentWeek.value,
    submitTime: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
    comments: comments.value
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
  const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown', 'image/jpeg', 'image/png'];
  const fileName = file.name.toLowerCase();
  const isValidType = allowedTypes.includes(file.type) ||
    fileName.endsWith('.zip') ||
    fileName.endsWith('.rar') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.png');

  if (!isValidType) {
    ElMessage.error('不支持的文件类型，请上传zip、rar、doc、docx、md、jpg或png格式的文件')
    return false
  }

  // 验证文件大小，根据接口文档限制为100MB
  const maxSize = 100 * 1024 * 1024 // 100MB
  const isValidSize = file.size <= maxSize

  if (!isValidSize) {
    ElMessage.error('文件大小不能超过100MB')
    return false
  }

  // 保存文件，但不自动上传
  uploadedFile.value = file
  return false // 阻止自动上传
}

// 手动提交作业
const submitHomework = async () => {
  if (!uploadedFile.value) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  // 显示上传对话框
  uploadDialogVisible.value = true
  uploading.value = true
  uploadPercentage.value = 0
  uploadStatus.value = ''
  uploadStatusText.value = '准备上传...'

  try {
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', uploadedFile.value)
    formData.append('userId', userData.value.userId || '')
    formData.append('comments', comments.value)
    formData.append('weeks', currentWeek.value)
    formData.append('submitTime', new Date().toISOString())

    // 模拟上传进度
    const simulateProgress = setInterval(() => {
      if (uploadPercentage.value < 90) {
        uploadPercentage.value += 10
        uploadStatusText.value = `上传中... ${uploadPercentage.value}%`
      }
    }, 300)

    // 调用上传API
    const res = await uploadHomework(formData)

    clearInterval(simulateProgress)
    uploadPercentage.value = 100

    if (res.code === 200) {
      uploadStatus.value = 'success'
      uploadStatusText.value = '上传成功！'
      ElMessage.success('作业上传成功')

      // 重置表单
      uploadedFile.value = null
      comments.value = ''

      // 刷新历史提交记录
      loadSubmissionHistory()
    } else {
      uploadStatus.value = 'exception'
      uploadStatusText.value = `上传失败: ${res.message || '未知错误'}`
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('作业上传失败:', error)
    uploadStatus.value = 'exception'
    uploadStatusText.value = '上传失败！请重试'
    ElMessage.error('作业上传失败，请重试')
  } finally {
    uploading.value = false
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
setInterval(function () {
  currentTime.value = getCurrentTime();
}, 1000);

// 组件挂载时获取用户信息和提交统计
onMounted(() => {
  getUserInfoFromStorage()
  loadSubmissionStats()
})
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
    }

    textarea::placeholder {
      color: #6C5AD7;
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
</style>
