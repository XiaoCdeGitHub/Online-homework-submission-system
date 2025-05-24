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
          <p>{{ groupProgressTitle }}</p>
          <div class="progress-buttons">
            <el-button type="primary" size="small" circle @click="refreshGroupStats" :loading="refreshingGroup">
              <el-icon>
                <Refresh />
              </el-icon>
            </el-button>
            <el-button type="success" size="small" circle @click="showGroupDetailDialog">
              <el-icon>
                <User />
              </el-icon>
            </el-button>
          </div>
        </div>
        <el-progress :percentage="groupProgressPercentage" :stroke-width="15" :color="groupProgressColor" />
        <div class="progress-stats">
          <span>本组进度: {{ groupStats.finishedCount }}/{{ groupStats.totalCount }}</span>
          <span>完成率: {{ groupProgressPercentage }}%</span>
        </div>
        <div v-if="groupStats.totalCount <= 1" class="refresh-tip">
          <el-button type="info" size="small" @click="refreshGroupStats" :loading="refreshingGroup">
            点击刷新小组进度
          </el-button>
          <span class="tip-text">{{ groupStats.totalCount === 0 ? '暂无小组数据' : '正在获取小组信息...' }}</span>
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

      <!-- 小组详情对话框 -->
      <el-dialog v-model="groupDetailDialogVisible" :title="`小组详情 - 第${currentWeek}周`" width="65%"
        :before-close="handleCloseGroupDetailDialog" destroy-on-close @open="refreshGroupMembers">
        <div class="dialog-content">
          <div class="group-info">
            <span><strong>方向：</strong>{{ groupStats.direction }}</span>
            <span><strong>小组：</strong>{{ groupStats.group }}</span>
            <span><strong>周数：</strong>第{{ currentWeek }}周</span>
          </div>

          <!-- 小组进度统计卡片 -->
          <div class="group-stats-summary">
            <div class="stats-item">
              <div class="stats-value">{{ groupStats.totalCount }}</div>
              <div class="stats-label">小组总人数</div>
            </div>
            <div class="stats-item highlight">
              <div class="stats-value">{{ groupStats.finishedCount }}</div>
              <div class="stats-label">已完成人数</div>
            </div>
            <div class="stats-item">
              <div class="stats-value">{{ groupProgressPercentage }}%</div>
              <div class="stats-label">完成比例</div>
            </div>
          </div>

          <div class="group-members-list">
            <h4 style="margin-top: 0; margin-bottom: 15px;">小组成员列表</h4>

            <el-empty v-if="groupMembers.length === 0 && !loadingGroupMembers" description="暂无小组成员数据" />
            <el-table v-else :data="groupMembers" style="width: 100%" row-key="userId"
              :default-sort="{ prop: 'isFinished', order: 'descending' }" border stripe highlight-current-row
              v-loading="loadingGroupMembers">
              <el-table-column prop="name" label="姓名" width="120" sortable>
                <template #default="scope">
                  <div class="member-name">
                    <span>{{ scope.row.name || '未知' }}</span>
                    <el-tag v-if="scope.row.isSelf" size="small" effect="light" type="primary">我</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="submitTime" label="提交时间" min-width="180" sortable>
                <template #default="scope">
                  {{ scope.row.submitTime || '未提交' }}
                </template>
              </el-table-column>
              <el-table-column prop="isFinished" label="状态" width="100" sortable align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.isFinished ? 'success' : 'danger'" effect="dark">
                    {{ scope.row.isFinished ? '已完成' : '未完成' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="refreshGroupMembers" :loading="loadingGroupMembers" type="info">
              <el-icon>
                <Refresh />
              </el-icon> 刷新数据
            </el-button>
            <el-button type="primary" @click="groupDetailDialogVisible = false">关闭</el-button>
          </div>
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

<script setup lang="ts">
import {
  Location, Flag, Finished, Document, User, SuccessFilled, UploadFilled, Warning,
  ChatDotRound, Refresh
} from '@element-plus/icons-vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadHomework, getHistorySubmit, getRecentTask } from '@/service/api/homework'
import { getCurrentWeeks } from '@/service/api/adminHomework'
import { getGroupInfo, getSelectCondition } from '@/service/api/adminHomework'
import { getWeek } from "date-fns";
import { useStore } from "vuex";
import SvgIcon from "../../components/SvgIcon/index.vue";
import { teacherGetCurrent } from "../../api/assignment";
import { fetchCurrentTask } from "../../api/adminHomework";
import { ElLoading, ElUpload } from "element-plus";
import { uploadFile, UploadRawFile } from "../../api/file";
import { FileStatistic } from "../../models/FileStatistic";
import { storeToRefs } from "pinia";
import { useRoleStore } from "@/stores/role";
import { FileUpload } from "@/models/FileUpload";
import { Homework } from "@/models/Homeworks";
import { fileURLToName, getFileIcon, getExt, CSVToArray } from "@/utils/index";
// import GetNameFromPath from "@/components/GetNameFromPath/index.vue";
// import UploadInfo from "@/components/UploadInfo/upload-info.vue";
// import { markrare } from "@/utils/markrare.js";
import { IMarkedWord, MarkrareEvents } from "@/models/Markrare.interface";
import { Watch } from "vue-class-component";
import { useUserStore } from "@/stores/user";
import { useDirectionStore } from "@/stores/direction";
import type { UploadUserFile } from "element-plus";
import { Plus, Delete } from "@element-plus/icons-vue";
import { cleanExpiredGroupData, generateGroupStorageKey } from "@/utils/localStorage";

// 用户数据，初始化为默认值
const userData = ref({
  period: '适应期第一周',
  direction: '全栈方向',
  group: '第二组',
  name: '测试用户',
  id: '测试学号',
  userId: ''  // 添加userId字段
})

// 上传相关状态
const comments = ref('')
const uploading = ref(false)
const uploadPercentage = ref(0)
const uploadStatus = ref('') as any  // 使用类型断言避免类型错误
const uploadStatusText = ref('')
const uploadDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const submissionHistory = ref<any[]>([])  // 使用any类型避免类型错误
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

// 小组统计数据
const groupStats = ref({
  finishedCount: 0,    // 已完成人数
  totalCount: 0,       // 总人数
  direction: '',       // 方向
  group: '',           // 小组
})

// 小组进度标题
const groupProgressTitle = ref('本周小组进度')

// 小组进度百分比
const groupProgressPercentage = computed(() => {
  if (groupStats.value.totalCount === 0) return 0
  return Math.round((groupStats.value.finishedCount / groupStats.value.totalCount) * 100)
})

// 小组进度条颜色
const groupProgressColor = computed(() => {
  const percentage = groupProgressPercentage.value
  if (percentage >= 80) return '#67C23A' // 绿色
  if (percentage >= 50) return '#E6A23C' // 黄色
  return '#F56C6C' // 红色
})

// 刷新小组状态标志
const refreshingGroup = ref(false)

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

// 从本地存储获取用户信息
const getUserInfoFromStorage = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    // console.log('本地存储中用户信息:', userInfoStr)

    if (userInfoStr && userInfoStr !== 'undefined' && userInfoStr !== 'null') {
      const userInfo = JSON.parse(userInfoStr)

      // 提取userId，确保优先使用userId，如果没有则使用number作为备选
      const userId = userInfo.userId || userInfo.number || '';

      // 更新用户数据
      userData.value = {
        period: userInfo.period || '适应期第一周',
        direction: userInfo.direction || '全栈方向',
        group: userInfo.group || '未知小组', // 确保有默认组别值
        name: userInfo.name || '未知用户',
        id: userInfo.number || userInfo.userId || '未知ID',
        userId: userId // 显式保存userId
      }

      return {
        userId: userId,
        direction: userInfo.direction || '全栈方向',
        group: userInfo.group || '未知小组', // 确保返回组信息
        name: userInfo.name || '未知用户'
      }
    } else {
      // console.warn('本地存储中没有有效用户信息')
      return {
        userId: '',
        direction: '全栈方向',
        group: '未知小组',
        name: '未知用户'
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      userId: '',
      direction: '全栈方向',
      group: '未知小组',
      name: '未知用户'
    }
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
    ElMessage.success('作业上传成功！小组进度稍后将自动更新')
    selectedFile.value = null // 清空选中的文件
    comments.value = '' // 清空备注

    // 上传成功后延迟一小段时间再刷新小组进度（给后端一点处理时间）
    setTimeout(async () => {
      try {
        // 刷新小组进度
        await refreshGroupStats()
        // 刷新历史记录
        await loadSubmissionHistory()
      } catch (refreshError) {
        console.error('刷新数据失败:', refreshError)
      }
    }, 1500)
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
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }
    formData.append('userId', getUserInfoFromStorage().userId)

    // 确保备注有值，即使是空字符串
    const commentText = comments.value?.trim() || '无备注'
    formData.append('comments', commentText)

    // 将 currentWeek 转换为字符串
    formData.append('weeks', currentWeek.value.toString())

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
    // console.log('上传作业响应:', response)

    clearInterval(progressInterval)

    if (response.code === 200) {
      uploadPercentage.value = 100
      uploadStatus.value = 'success'
      uploadStatusText.value = '上传成功！'
      ElMessage.success('作业上传成功！小组进度稍后将自动更新')
      selectedFile.value = null // 清空选中的文件
      comments.value = '' // 清空备注

      // 上传成功后延迟一小段时间再刷新小组进度（给后端一点处理时间）
      setTimeout(async () => {
        try {
          // 刷新小组进度
          await refreshGroupStats()
          // 刷新历史记录
          await loadSubmissionHistory()
        } catch (refreshError) {
          console.error('刷新数据失败:', refreshError)
        }
      }, 1500)
    } else {
      uploadStatus.value = 'exception'

      // 改进错误提示
      const err = response as any; // 使用类型断言
      if (err.message && err.message.includes('404')) {
        uploadStatusText.value = '上传失败：服务器接口未找到，请联系管理员'
        ElMessage.error('服务器接口未找到，请联系管理员检查系统配置')
      } else {
        uploadStatusText.value = `上传失败：${err.message || '未知错误'}`
        ElMessage.error(err.message || '上传失败，请重试')
      }
    }
  } catch (error) {
    uploadStatus.value = 'exception'

    // 改进错误提示
    const err = error as any; // 使用类型断言
    if (err.message && err.message.includes('404')) {
      uploadStatusText.value = '上传失败：服务器接口未找到，请联系管理员'
      ElMessage.error('服务器接口未找到，请联系管理员检查系统配置')
    } else {
      uploadStatusText.value = `上传失败：${err.message || '未知错误'}`
      ElMessage.error(err.message || '上传失败，请重试')
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
    const err = error as any; // 使用类型断言
    ElMessage.error(err.message || '获取历史记录失败，请重试')
    console.error('获取历史提交失败:', error)
  }
}

// 加载提交历史
const loadSubmissionHistory = async () => {
  try {
    // 修复：使用正确的userId访问方式
    const userId = userData.value.userId || getUserInfoFromStorage().userId;
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

// console.log(nowDate, 'nowDate');

function getCurrentTime() {
  let currentTime = new Date();
  let hours = currentTime.getHours();
  let minutes = currentTime.getMinutes();
  let seconds = currentTime.getSeconds();
  // 格式化小时、分钟和秒，以确保始终为两位数
  let hoursStr = hours < 10 ? '0' + hours : hours.toString();
  let minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  let secondsStr = seconds < 10 ? '0' + seconds : seconds.toString();
  let timeString = hoursStr + ':' + minutesStr + ':' + secondsStr;
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

      // 更新到localStorage，确保用户信息中包含最新周数
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.currentWeek = currentWeek.value;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        // console.log('更新localStorage中的周数:', currentWeek.value);
      } catch (e) {
        console.error('更新localStorage中的周数失败:', e);
      }

      return true; // 表示成功获取
    } else {
      console.warn('获取周数API返回非200状态码:', response);
      return false; // 表示获取失败
    }
  } catch (error) {
    console.error('获取当前周数失败:', error)
    // 失败时尝试从localStorage获取
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.currentWeek) {
        currentWeek.value = userInfo.currentWeek;
        return true;
      }
    } catch (e) {
      console.error('从localStorage获取周数失败:', e);
    }

    // 如果API和localStorage都失败，使用默认值
    currentWeek.value = 1
    return false;
  }
}

// 获取当前任务信息
const fetchCurrentTask = async () => {
  try {
    const { userId, direction } = getUserInfoFromStorage()
    if (!userId) return

    // 使用当前周数作为参数
    const weeks = currentWeek.value || 1;

    // 更新小组进度标题，包含周数信息
    updateGroupProgressTitle();

    // 获取小组统计数据
    await loadGroupStats();

  } catch (error) {
    console.error('获取当前任务失败:', error)
  }
}

// 添加刷新周数和任务的功能
const refreshingWeek = ref(false)
const refreshWeekAndTask = async () => {
  if (refreshingWeek.value) return
  refreshingWeek.value = true

  try {
    // console.log('手动刷新周数和任务...')
    const success = await fetchCurrentWeek()

    if (success) {
      ElMessage.success(`已更新到第${currentWeek.value}周`)
      await fetchCurrentTask()

      // 同时刷新小组统计
      await loadGroupStats()
    } else {
      ElMessage.warning('获取最新周数失败，请稍后再试')
    }
  } catch (error) {
    console.error('刷新周数和任务失败:', error)
    ElMessage.error('刷新失败，请稍后重试')
  } finally {
    refreshingWeek.value = false
  }
}

// 更新小组进度标题
const updateGroupProgressTitle = () => {
  const weekText = `第${currentWeek.value}周`;
  groupProgressTitle.value = `${weekText} - ${groupStats.value.direction} ${groupStats.value.group} 提交进度`
}

// 获取小组进度信息
const loadGroupStats = async () => {
  try {
    const userInfo = getUserInfoFromStorage()

    // 如果没有方向或小组信息，设置默认值
    if (!userInfo.direction || !userInfo.group || userInfo.group === '未分组') {
      groupStats.value = {
        finishedCount: 0,
        totalCount: 0,
        direction: userInfo.direction || '未知方向',
        group: userInfo.group || '未知小组'
      }
      updateGroupProgressTitle()
      return
    }

    // 更新小组基本信息到状态
    groupStats.value.direction = userInfo.direction
    groupStats.value.group = userInfo.group

    // 构建请求参数
    const params = {
      direction: userInfo.direction,
      group: userInfo.group,
      weeks: currentWeek.value
    }

    console.log('获取小组进度信息参数:', params)

    // 使用工具函数生成用户特定的localStorage键
    const groupStorageKey = generateGroupStorageKey(userInfo, currentWeek.value)

    // 调用getGroupInfo API获取小组进度
    const response = await getGroupInfo(params)
    console.log('小组进度API响应:', response)

    if (response.code === 200 && response.data) {
      // ===== 修复：优先处理直接返回的allCount和finishCount =====
      if (response.data.allCount !== undefined && response.data.finishCount !== undefined) {
        // 直接使用后端返回的统计数据
        groupStats.value = {
          ...groupStats.value,
          finishedCount: response.data.finishCount || 0,
          totalCount: response.data.allCount || 1 // 确保总人数至少为1，避免除以0错误
        }
        console.log('使用后端返回的统计数据:', groupStats.value)
      }
      // 如果没有直接返回统计数据，则尝试从学生列表计算
      else if (response.data.studentList) {
        // 获取学生列表
        const studentList = Array.isArray(response.data.studentList) ? response.data.studentList : []
        console.log('小组学生列表:', studentList)

        // 计算已完成人数
        const finishedCount = studentList.filter(student => {
          // 使用检查并修正函数获取正确的完成状态
          return checkAndFixFinishCondition(student);
        }).length;

        // 更新小组统计数据
        groupStats.value = {
          ...groupStats.value,
          finishedCount: finishedCount,
          totalCount: studentList.length || 1 // 确保总人数至少为1，避免除以0错误
        }
      }
      // 如果两种数据都没有，使用默认值
      else {
        console.warn('API返回数据中既没有统计数据也没有学生列表')
        groupStats.value = {
          ...groupStats.value,
          finishedCount: 0,
          totalCount: 1
        }
      }

      // 缓存小组信息到localStorage - 使用用户特定的键
      try {
        const groupInfoToSave = {
          code: 200,
          message: "获取小组信息成功",
          data: {
            allCount: groupStats.value.totalCount,
            finishCount: groupStats.value.finishedCount,
            userId: userInfo.userId,
            direction: userInfo.direction,
            group: userInfo.group,
            weeks: currentWeek.value,
            timestamp: Date.now()
          }
        }
        localStorage.setItem(groupStorageKey, JSON.stringify(groupInfoToSave))
        console.log('已将小组信息保存到 localStorage:', groupStorageKey, groupInfoToSave)
      } catch (saveError) {
        console.error('保存小组信息到 localStorage 失败:', saveError)
      }
    } else {
      console.warn('获取小组进度数据失败:', response.message)

      // 尝试从localStorage读取缓存数据 - 使用用户特定的键
      try {
        const localGroupInfo = localStorage.getItem(groupStorageKey)
        if (localGroupInfo && localGroupInfo !== 'undefined' && localGroupInfo !== 'null') {
          const groupInfoData = JSON.parse(localGroupInfo)

          // 验证数据的有效性和所属用户
          if (groupInfoData.code === 200 &&
            groupInfoData.data &&
            groupInfoData.data.userId === userInfo.userId &&
            groupInfoData.data.direction === userInfo.direction &&
            groupInfoData.data.group === userInfo.group) {

            // 检查数据是否过期（1小时）
            const isExpired = (Date.now() - groupInfoData.data.timestamp) > 3600000;

            if (!isExpired) {
              groupStats.value = {
                ...groupStats.value,
                finishedCount: groupInfoData.data.finishCount || 0,
                totalCount: groupInfoData.data.allCount || 1
              }
              console.log('使用缓存的小组统计数据:', groupStorageKey, groupStats.value) // 保留，与小组进度相关
            } else {
              console.warn('缓存的小组进度数据已过期')
            }
          } else {
            console.warn('缓存的小组进度数据与当前用户不匹配')
          }
        }
      } catch (error) {
        console.error('读取缓存的小组进度数据失败:', error)
      }
    }

    // 更新小组进度标题
    updateGroupProgressTitle()
  } catch (error) {
    console.error('获取小组进度失败:', error)
    // 设置默认值以便显示
    groupStats.value = {
      ...groupStats.value,
      finishedCount: 0,
      totalCount: 1 // 设置为1，以便显示0%进度
    }
    updateGroupProgressTitle()
  }
}

// 修改 clearGroupStatsCache 函数，清除所有相关缓存
const clearGroupStatsCache = () => {
  try {
    const userInfo = getUserInfoFromStorage()
    if (userInfo && userInfo.userId) {
      // 清除特定周的缓存
      const groupStorageKey = generateGroupStorageKey(userInfo, currentWeek.value)
      localStorage.removeItem(groupStorageKey)
      console.log('已清除小组进度缓存:', groupStorageKey)

      // 清除所有可能相关的缓存
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('groupInfo') || key.includes('groupStats'))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log('已清除额外缓存:', key)
      })

      // 清除内存中的缓存
      groupMembers.value = []

      ElMessage.info('已清除所有小组数据缓存')
    }
  } catch (e) {
    console.error('清除缓存失败:', e)
  }
}

// 修改 refreshGroupStats 函数，强制刷新
const refreshGroupStats = async () => {
  if (refreshingGroup.value) return
  refreshingGroup.value = true

  // 显示加载提示
  ElMessage.info('正在刷新小组进度...')

  try {
    console.log('=== 开始强制刷新小组数据 ===')
    // 清除可能存在的缓存
    clearGroupStatsCache()

    // 确保先获取最新周数
    await fetchCurrentWeek()
    // 直接调用loadGroupStats加载最新数据
    await loadGroupStats()

    // 刷新小组成员列表
    await refreshGroupMembers()

    console.log('=== 刷新后的小组成员状态 ===')
    console.log('完成人数:', groupStats.value.finishedCount)
    console.log('总人数:', groupStats.value.totalCount)
    console.log('小组成员列表:', groupMembers.value.map(member => ({
      name: member.name,
      userId: member.userId,
      isFinished: member.isFinished,
      submitTime: member.submitTime
    })))

    // 显示成功消息
    ElMessage.success(`小组进度更新成功：${groupStats.value.direction} ${groupStats.value.group} 完成率: ${groupProgressPercentage.value}%`)
  } catch (error) {
    console.error('刷新小组进度失败:', error)
    ElMessage.error('刷新小组进度失败，请稍后重试')
  } finally {
    refreshingGroup.value = false
  }
}

// 显示小组详情对话框
const showGroupDetailDialog = () => {
  try {
    console.log('尝试打开小组详情对话框')

    // 打开对话框
    groupDetailDialogVisible.value = true
    console.log('对话框状态已设置为可见:', groupDetailDialogVisible.value)

    // 加载小组成员数据
    refreshGroupMembers()

    // 延迟触发一次重新渲染，解决可能的显示问题
    setTimeout(() => {
      if (!groupDetailDialogVisible.value) {
        console.log('对话框可能未正常显示，尝试重新打开')
        groupDetailDialogVisible.value = true
      }
    }, 300)
  } catch (error) {
    console.error('打开小组详情对话框时出错:', error)
    ElMessage.error('打开小组详情对话框失败，请刷新页面后重试')
  }
}

// 小组详情对话框相关状态
const groupDetailDialogVisible = ref(false)
const loadingGroupMembers = ref(false)
const groupMembers = ref<any[]>([])  // 使用any类型避免类型错误

// 处理关闭小组详情对话框
const handleCloseGroupDetailDialog = (done) => {
  // 可以在这里添加关闭前的确认逻辑，如果需要的话
  done()
}

// 添加检查并修复可能不正确的finishCondition值的函数
const checkAndFixFinishCondition = (student) => {
  // 记录原始值，用于调试
  const originalFinishCondition = student.finishCondition;

  // 检查is_submitted_this_week字段（如果存在）
  if (student.is_submitted_this_week !== undefined) {
    const shouldBeFinished = student.is_submitted_this_week === 1;
    const currentFinished = student.finishCondition === '已完成';

    // 如果两者不一致，修正finishCondition
    if (shouldBeFinished !== currentFinished) {
      console.warn(`发现finishCondition与is_submitted_this_week不一致:`, {
        user: student.name || student.user_name,
        userId: student.userId,
        is_submitted_this_week: student.is_submitted_this_week,
        finishCondition: student.finishCondition
      });

      // 使用is_submitted_this_week的值来确定finishCondition
      student.finishCondition = shouldBeFinished ? '已完成' : '未完成';

      console.log(`已修正finishCondition:`, {
        user: student.name || student.user_name,
        userId: student.userId,
        oldValue: originalFinishCondition,
        newValue: student.finishCondition
      });
    }
  }

  // 确保返回布尔值
  return student.finishCondition === '已完成';
};

// 修改 refreshGroupMembers 函数，检查finishCondition的有效性
const refreshGroupMembers = async () => {
  loadingGroupMembers.value = true
  try {
    const userInfo = getUserInfoFromStorage()
    const userId = userInfo.userId
    const direction = userInfo.direction || '前端'
    const group = userInfo.group || '未知小组'

    if (!userId) {
      ElMessage.warning('获取用户信息失败，无法刷新小组成员数据')
      // 即便获取用户信息失败，也要显示对话框并放置一个默认成员（当前用户）
      groupMembers.value = [{
        userId: '未知',
        name: '当前用户',
        studentId: '未知',
        isSelf: true,
        isFinished: false,
        submitTime: '未提交'
      }];
      loadingGroupMembers.value = false
      return
    }

    console.log('正在获取小组成员数据:', { direction, group, week: currentWeek.value })

    // 构建参数
    const params = {
      direction: direction,
      group: group,
      weeks: currentWeek.value
    }

    // 调用selectCondition接口获取详细的小组成员信息
    try {
      console.log('调用 selectCondition 接口，参数:', params)
      const response = await getSelectCondition(params)
      console.log('selectCondition响应完整数据:', response)

      if (response && response.code === 200) {
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // 添加每个学生的完成状态日志
          console.log('小组成员原始数据详情:')
          response.data.forEach(student => {
            console.log(`学生: ${student.name || student.user_name}`, {
              userId: student.userId,
              finishCondition: student.finishCondition,
              is_apply: student.is_apply,
              // 调试时尝试其他可能的字段
              submitted: student.submitted,
              is_finished: student.is_finished,
              status: student.status,
              isSubmitted: student.isSubmitted,
              originalFinish: student.finishCondition === '已完成'
            })
          })

          // 转换数据格式
          groupMembers.value = response.data.map(student => {
            // 检查并修正finishCondition
            const isFinishedStatus = checkAndFixFinishCondition(student);

            // 记录每个学生的原始数据和判断结果
            console.log(`学生 ${student.name || student.user_name} (${student.userId}) 完成状态:`,
              { finishCondition: student.finishCondition, isFinished: isFinishedStatus });

            return {
              userId: student.userId,
              name: student.name || student.user_name,
              studentId: student.studentId || student.userId,
              isSelf: student.userId === userId,
              isFinished: isFinishedStatus,
              submitTime: student.submitTime || '未提交'
            };
          })

          ElMessage.success(`成功获取${groupMembers.value.length}位小组成员数据`);
        } else {
          // 如果没有数据，至少添加当前用户
          groupMembers.value = [{
            userId: userId,
            name: userInfo.name || '当前用户',
            studentId: userId,
            isSelf: true,
            isFinished: false,
            submitTime: '未提交'
          }];
          ElMessage.info('未找到小组成员数据，仅显示当前用户');
        }
      } else {
        // 尝试使用getGroupInfo作为备选方案
        console.warn('selectCondition接口返回错误，尝试使用getGroupInfo作为备选');
        await fallbackToGroupInfo(userInfo, direction, group);
      }
    } catch (apiError) {
      console.error('selectCondition接口请求失败:', apiError);
      ElMessage.warning('获取小组成员详细信息失败，尝试使用备选方案');

      // 尝试使用getGroupInfo作为备选方案
      await fallbackToGroupInfo(userInfo, direction, group);
    }
  } catch (error) {
    console.error('刷新小组成员数据失败:', error)
    ElMessage.error('刷新小组成员数据失败，请稍后重试')
    // 确保至少有一个空数组
    groupMembers.value = [];
  } finally {
    loadingGroupMembers.value = false
  }
}

// 添加备选方案函数，当主要接口失败时调用
const fallbackToGroupInfo = async (userInfo, direction, group) => {
  try {
    // 获取小组成员数据
    const response = await getGroupInfo({
      direction: direction,
      group: group,
      weeks: currentWeek.value
    })
    console.log('备选方案getGroupInfo响应:', response)

    if (response && response.code === 200) {
      // 检查是否有学生列表
      if (response.data && Array.isArray(response.data.studentList) && response.data.studentList.length > 0) {
        // 添加每个学生的完成状态日志
        console.log('备选方案小组成员原始数据:', response.data.studentList.map(student => ({
          name: student.name || student.user_name,
          userId: student.userId,
          finishCondition: student.finishCondition,
          is_apply: student.is_apply,
          isFinishedByNewLogic: student.finishCondition === '已完成'
        })));

        // 处理学生列表
        groupMembers.value = response.data.studentList.map(student => {
          // 检查并修正finishCondition
          const isFinishedStatus = checkAndFixFinishCondition(student);

          console.log(`备选方案学生 ${student.name || '未知'} (${student.userId}) 完成状态:`,
            { finishCondition: student.finishCondition, isFinished: isFinishedStatus });

          return {
            ...student,
            isSelf: student.userId === userInfo.userId,
            isFinished: isFinishedStatus,
            submitTime: student.submitTime || (student.is_apply ? '已提交' : '未提交')
          };
        });

        ElMessage.info(`使用备选方案获取到${groupMembers.value.length}位小组成员数据`);
      } else {
        // 如果没有找到任何学生数据，至少添加当前用户自己
        groupMembers.value = [{
          userId: userInfo.userId,
          name: userInfo.name || '当前用户',
          studentId: userInfo.userId,
          isSelf: true,
          isFinished: false,
          submitTime: '未提交'
        }];

        ElMessage.info('未能获取小组详细信息，仅显示当前用户');
      }
    } else {
      ElMessage.error('获取小组成员数据失败：' + (response?.message || '未知错误'));
      // 添加当前用户作为默认显示
      groupMembers.value = [{
        userId: userInfo.userId,
        name: userInfo.name || '当前用户',
        studentId: userInfo.userId,
        isSelf: true,
        isFinished: false,
        submitTime: '未提交'
      }];
    }
  } catch (error) {
    console.error('备选方案也失败:', error);
    groupMembers.value = [{
      userId: userInfo.userId,
      name: userInfo.name || '当前用户',
      studentId: userInfo.userId,
      isSelf: true,
      isFinished: false,
      submitTime: '未提交'
    }];
  }
}

// 初始化用户信息
const initUserInfo = () => {
  try {
    console.log('开始初始化用户信息...');

    // 获取并更新用户信息
    const userInfo = getUserInfoFromStorage();
    console.log('从本地存储获取的用户信息:', userInfo);

    // 如果本地存储没有用户ID，尝试获取URL参数或提示登录
    if (!userInfo.userId) {
      console.warn('未在本地存储中找到用户ID，尝试从URL获取');
      // 从URL获取用户信息（如果有）
      const urlParams = new URLSearchParams(window.location.search);
      const urlUserId = urlParams.get('userId');

      if (urlUserId) {
        console.log('从URL中获取到userId:', urlUserId);
        // 如果URL中有userId参数，使用它并更新本地存储
        userData.value.userId = urlUserId;
        try {
          const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          currentUserInfo.userId = urlUserId;
          localStorage.setItem('userInfo', JSON.stringify(currentUserInfo));
          console.log('已将userId更新到本地存储:', urlUserId);
        } catch (e) {
          console.error('更新本地存储用户ID失败:', e);
        }
      } else {
        console.warn('未找到用户ID，将使用默认值');
      }
    }

    // 显式更新界面上的用户信息
    document.title = `${userData.value.name || '用户'} - ${userData.value.group || ''}`;

    console.log('用户信息初始化完成:', userData.value);
    return true;
  } catch (error) {
    console.error('初始化用户信息失败:', error);
    return false;
  }
};

// 添加组件生命周期钩子
onMounted(async () => {
  try {
    console.log('组件加载开始...');

    // 初始化用户信息
    console.log('步骤1: 初始化用户信息');
    const userInitialized = initUserInfo();
    if (!userInitialized) {
      console.warn('用户信息初始化失败，可能影响组件功能');
      ElMessage.warning('用户信息初始化失败，请检查登录状态')
    }

    // 获取当前周数
    console.log('步骤2: 获取当前周数');
    const weekResult = await fetchCurrentWeek();
    console.log('周数获取结果:', { success: weekResult, currentWeek: currentWeek.value });

    // 获取当前任务
    console.log('步骤3: 获取当前任务');
    await fetchCurrentTask();

    // 加载小组统计数据
    console.log('步骤4: 加载小组统计数据');
    await loadGroupStats();
    console.log('加载后的小组统计结果:', groupStats.value);

    // 加载提交历史
    console.log('步骤5: 加载提交历史');
    await loadSubmissionHistory();
    console.log('提交历史记录数:', submissionHistory.value.length);

    console.log('组件完成所有初始化步骤');

    // 如果没有获取到有效的小组信息，提示用户刷新
    if (groupStats.value.totalCount <= 0) {
      ElMessage.info('小组进度数据可能未正确加载，点击进度条右侧刷新按钮可重新获取')
    }
  } catch (error) {
    console.error('组件初始化失败:', error);
    ElMessage.error('加载用户信息失败，请尝试刷新页面');
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  // 清理可能存在的定时器等资源
});

// 添加iconStyle属性
const iconStyle = {
  marginRight: '4px'
};
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
    height: 85%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: #f9f9ff;
    // background-color: red;
    border-radius: 8px;
    border: 1px solid #d4d0f5;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);


    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 5px;
      margin-bottom: 10px;

      p {
        margin: 0;
        font-size: 14px;
        font-weight: bold;
        color: #4a1691;
      }

      .progress-buttons {
        display: flex;
        align-items: center;
        gap: 5px;

        :deep(.el-button) {
          background-color: #f0ecfc;
          background-image: linear-gradient(315deg, #f0ecfc 0%, #c2c7f4 74%);
          color: #4a1691;
          border: none;
          transition: all 0.3s ease;

          &:hover {
            transform: rotate(180deg);
            opacity: 0.9;
          }

          .el-icon {
            color: #4a1691;
          }
        }
      }
    }

    :deep(.el-progress-bar__outer) {
      border-radius: 8px;
      background-color: #e9e6f7;
    }

    :deep(.el-progress-bar__inner) {
      border-radius: 8px;
      transition: width 0.8s ease;
    }

    .progress-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 13px;
      color: #606266;

      span {
        margin-right: 10px;

        &:last-child {
          font-weight: bold;
        }
      }
    }

    .refresh-tip {
      margin-top: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;

      .el-button {
        margin-bottom: 5px;
      }

      .tip-text {
        font-size: 12px;
        color: #909399;
      }
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
  justify-content: center;

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

      :deep(.el-upload__tip) {
        margin-top: 5px;
        text-align: center;
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
    // height: 82%;
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
  gap: 10px;
}

// 小组详情对话框样式
.group-members-list {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9ff;
  border-radius: 8px;
}

.group-stats-summary {
  margin: 0 auto 20px;
  max-width: 500px;
  display: flex;
  justify-content: space-evenly;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-item {
  text-align: center;

  .stats-value {
    font-size: 24px;
    font-weight: bold;
    color: #606266;
  }

  &.highlight .stats-value {
    color: #67C23A;
  }

  .stats-label {
    margin-top: 8px;
    font-size: 14px;
    color: #909399;
  }
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: 500;
  }
}

.dialog-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

// 改进小组详情对话框样式
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }
}

.dialog-content {
  margin-top: 20px;
}

.group-info {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  max-width: 600px;

  span {
    margin-right: 20px;
  }
}

.group-members-list {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9ff;
  border-radius: 8px;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-weight: 500;
  }
}

.group-stats-summary {
  margin: 0 auto 20px;
  max-width: 500px;
  display: flex;
  justify-content: space-evenly;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-item {
  text-align: center;

  .stats-value {
    font-size: 24px;
    font-weight: bold;
    color: #606266;
  }

  &.highlight .stats-value {
    color: #67C23A;
  }

  .stats-label {
    margin-top: 8px;
    font-size: 14px;
    color: #909399;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
