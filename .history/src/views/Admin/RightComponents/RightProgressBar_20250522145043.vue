<template>
  <div id="ProgressBar">
    <div class="title-name">{{ title }}</div>
    <div class="title-num">{{ finishedCount }}/{{ totalCount }}</div>
    <!-- 外边框 -->
    <div id="progress-container">
      <!-- 进度 -->
      <div id="progress-innner" :style="progressStyle"></div>
    </div>
    <div class="progress-details" v-if="totalCount > 0">
      <div class="detail-item">
        <span class="label">完成率:</span>
        <span class="value">{{ completion }}%</span>
      </div>
      <div class="detail-item">
        <span class="label">已完成:</span>
        <span class="value">{{ finishedCount }}人</span>
      </div>
      <div class="detail-item">
        <span class="label">未完成:</span>
        <span class="value">{{ totalCount - finishedCount }}人</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 从父组件接收数据
const props = defineProps({
  studentList: {
    type: Array,
    default: () => []
  },
  weeks: {
    type: [String, Number],
    default: ''
  },
  direction: {
    type: String,
    default: ''
  },
  group: {
    type: String,
    default: ''
  }
})

// 计算标题
const title = computed(() => {
  let result = ''
  if (props.weeks) {
    result += `第${props.weeks}周 `
  }
  if (props.direction) {
    result += `${props.direction} `
  }
  if (props.group) {
    result += `${props.group} `
  }
  return result ? result + '进度' : '本组进度'
})

// 计算完成数量
const finishedCount = computed(() => {
  return props.studentList.filter(student => student.is_apply === true).length
})

// 计算总人数
const totalCount = computed(() => {
  return props.studentList.length
})

// 计算完成率
const completion = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((finishedCount.value / totalCount.value) * 100)
})

// 计算进度条样式
const progressStyle = computed(() => {
  return {
    width: `${completion.value}%`,
    backgroundColor: getColorByCompletion(completion.value)
  }
})

// 根据完成率返回颜色
const getColorByCompletion = (completion) => {
  if (completion >= 80) return '#67C23A' // 绿色
  if (completion >= 50) return '#E6A23C' // 黄色
  return '#F56C6C' // 红色
}
</script>

<style>
#ProgressBar {
  width: 100%;
  height: auto;
  padding: 15px 0;
  font-size: 15px;
}

.title-name {
  width: 60%;
  position: relative;
  left: 10%;
  text-align: left;
  font-weight: 700;
  margin-bottom: 5px;
}

.title-num {
  width: 30%;
  position: relative;
  left: 60%;
  text-align: right;
  margin-bottom: 8px;
}

#progress-container {
  width: 80%;
  height: 20px;
  border: 1px solid #202237;
  background-color: #F5F7FA;
  border-radius: 5px;
  margin: 0 auto;
  overflow: hidden;
}

/* 进度条内部 */
#progress-innner {
  height: 100%;
  background-color: #578bfc;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
}

.progress-details {
  margin-top: 10px;
  display: flex;
  justify-content: space-around;
  font-size: 14px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.label {
  margin-right: 5px;
  color: #606266;
}

.value {
  font-weight: bold;
  color: #303133;
}
</style>
