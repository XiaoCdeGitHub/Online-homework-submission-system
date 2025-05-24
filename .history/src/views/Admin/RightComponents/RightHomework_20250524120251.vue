<template>
  <div id="download">
    <div class="title">
      作业下载<span>Download Homework</span>
      <span style="left: 65%">完成/总人数：{{ getRate() }}</span>
    </div>
    <div id="checkbox">
      <ul>
        <li v-for="(item, index) in stufilterList" :key="index" ref="li">
          <div class="circle"></div>
          {{ item.user_name || item.name || item.userName || `用户${item.userId}` }}
          <input type="checkbox" v-model="item.isSelect" @change="updateAllCheckStatus" />
          <a v-show="item.is_apply" href="javascript:void(0);" @click="downloadStudentHomework(item)">点击此处下载作业</a>
          <span v-show="!item.is_apply" class="not-finish">暂未完成</span>
        </li>
      </ul>
    </div>
    <div id="line">
      <button @click="Submit()">批量下载</button>
      <button @click="downloadExcel">下载报告</button>
      <div>
        全选<input type="checkbox" id="ckAll" v-model="isAll" @change="toggleAllChecks" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import arrayToExcel from '../../../plugins/arrayToExcel/index';
import { loadFile } from '../../../utils/brower';
import { useGroupStore } from '@/stores/group';
import {
  getSelectCondition,
  downloadHomework,
  getFinalExcel,
  getCurrentWeeks,
  batchDownloadHomework,
  getGroupInfo
} from '@/service/api/adminHomework';

// 当前周数
const currentWeeks = ref(1);
// 筛选条件
const filterParams = reactive({
  direction: '',
  group: '',
  weeks: 0,
});

// 全选状态
const isAll = ref(false);

// 学生列表
const stufilterList = ref([]);
// 添加小组总人数变量
const totalStudentsCount = ref(0);
const groupStore = useGroupStore();

// 获取当前周数
const fetchCurrentWeeks = async () => {
  try {
    const res = await getCurrentWeeks();
    console.log('res', res)
    if (res.code !== undefined || res.code !== null) {
      currentWeeks.value = res.data;
      filterParams.weeks = res.data;
      ElMessage.success('获取当前周数成功');
    } else {
      ElMessage.error(res.message || '获取当前周数失败');
    }
  } catch (error) {
    console.error('获取当前周数异常:', error);
    ElMessage.error('获取周数失败，请稍后重试');
  }
};

// 获取学生作业提交情况
const fetchStudentList = async () => {
  try {
    if (!filterParams.direction || !filterParams.group || !filterParams.weeks) {
      return;
    }

    const res = await getSelectCondition(filterParams);
    if (res.code === 200) {
      stufilterList.value = res.data.map(item => ({
        ...item,
        isSelect: false
      }));
      // 重置全选状态
      isAll.value = false;
      
      // 获取小组总人数
      fetchGroupTotalCount();
    } else {
      ElMessage.error(res.message || '获取学生作业数据失败');
    }
  } catch (error) {
    console.error('获取学生作业数据异常:', error);
    ElMessage.error('获取学生数据失败，请稍后重试');
  }
};

// 获取小组总人数
const fetchGroupTotalCount = async () => {
  try {
    if (!filterParams.direction || !filterParams.group || !filterParams.weeks) {
      console.warn('获取小组总人数失败: 筛选条件不完整');
      return;
    }
    
    console.log('正在获取小组总人数，参数:', filterParams);
    
    const res = await getGroupInfo({
      direction: filterParams.direction,
      group: filterParams.group,
      weeks: filterParams.weeks
    });
    
    console.log('getGroupInfo API 返回结果:', res);
    
    if (res.code === 200 && res.data) {
      // 若返回数据包含studentList属性，获取列表长度作为总人数
      if (res.data.studentList && Array.isArray(res.data.studentList)) {
        totalStudentsCount.value = res.data.studentList.length;
        console.log('从studentList中获取总人数:', totalStudentsCount.value);
      } 
      // 若返回数据本身是数组，获取数组长度作为总人数
      else if (Array.isArray(res.data)) {
        totalStudentsCount.value = res.data.length;
        console.log('从data数组中获取总人数:', totalStudentsCount.value);
      } else {
        console.warn('无法从返回数据中获取总人数，数据格式:', res.data);
      }
    } else {
      console.warn('获取小组总人数失败:', res.message || '未知错误');
    }
  } catch (error) {
    console.error('获取小组总人数异常:', error);
  }
};

// 初始化
onMounted(async () => {
  await fetchCurrentWeeks();

  // 从store获取筛选条件
  const storeDirection = groupStore.direction;
  const storeGroup = groupStore.group;
  const storeWeeks = groupStore.weeks;

  if (storeDirection) {
    filterParams.direction = storeDirection;
  }

  if (storeGroup) {
    filterParams.group = storeGroup;
  }

  if (storeWeeks) {
    filterParams.weeks = storeWeeks;
  }

  // 获取学生列表
  await fetchStudentList();
  
  // 确保获取小组总人数 (即使fetchStudentList中已调用，这里也再次调用以确保)
  await fetchGroupTotalCount();
});

// 监听store中的筛选条件变化
watch(() => [groupStore.direction, groupStore.group, groupStore.weeks], async () => {
  // 更新前先重置总人数，避免显示旧数据
  totalStudentsCount.value = 0;
  
  // 更新筛选条件
  filterParams.direction = groupStore.direction;
  filterParams.group = groupStore.group;
  filterParams.weeks = groupStore.weeks;
  
  // 先获取学生列表，然后确保更新总人数
  await fetchStudentList();
  
  // 确保单独调用一次获取总人数
  if (filterParams.direction && filterParams.group && filterParams.weeks) {
    await fetchGroupTotalCount();
  }
}, { deep: true });

// 更新全选状态
const updateAllCheckStatus = () => {
  // 如果没有数据，直接返回
  if (stufilterList.value.length === 0) {
    isAll.value = false;
    return;
  }

  // 检查是否所有项目都被选中
  const allSelected = stufilterList.value.every(item => item.isSelect);
  isAll.value = allSelected;
};

// 切换全选状态
const toggleAllChecks = () => {
  // 将所有项目的选中状态设置为与isAll一致
  stufilterList.value.forEach(item => {
    item.isSelect = isAll.value;
  });
};

// 下载单个学生作业
const downloadStudentHomework = async (item) => {
  try {
    if (!item || !item.userId) {
      ElMessage.warning('无法获取学生ID');
      return;
    }

    // 如果存在直接文件链接，使用直接下载
    if (item.fileUrl) {
      await downloadHomework(item.userId, filterParams.weeks || currentWeeks.value, item.fileUrl);
      ElMessage.success(`正在下载 ${item.user_name || item.name || '未知用户'} 的作业`);
    } else {
      // 否则下载压缩包
      await downloadHomework(item.userId, filterParams.weeks || currentWeeks.value);
      ElMessage.success('下载请求已发送，稍后将开始下载压缩包');
    }
  } catch (error) {
    console.error('下载学生作业失败:', error);
    ElMessage.error('下载失败: ' + (error.message || '未知错误'));
  }
};

// 批量下载选中学生作业
const Submit = async () => {
  const selectedStudents = stufilterList.value.filter(item => item.isSelect && item.is_apply);

  if (selectedStudents.length === 0) {
    ElMessage.warning('请选择至少一个已提交作业的学生');
    return;
  }

  try {
    // 如果只选择了一个学生，直接使用单文件下载
    if (selectedStudents.length === 1) {
      await downloadStudentHomework(selectedStudents[0]);
      return;
    }

    // 检查是否有完整筛选条件
    if (!filterParams.direction || !filterParams.group || !filterParams.weeks) {
      ElMessage.warning('请确保已选择完整的筛选条件（方向、组别和周数）');
      return;
    }
    
    // 调用批量下载API，传递必要参数
    await batchDownloadHomework({
      direction: filterParams.direction,
      group: filterParams.group,
      weeks: filterParams.weeks || currentWeeks.value,
      userIds: selectedStudents.map(student => student.userId) // 可选参数，保留兼容性
    });

    // 不需要再显示成功消息，批量下载函数中已经有了
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载失败: ' + (error.message || '未知错误'));
  }
};

// 导出Excel报告
const downloadExcel = async () => {
  if (stufilterList.value.length === 0) {
    ElMessage.warning('暂时没有生成报告的数据');
    return;
  }

  try {
    if (!filterParams.direction || !filterParams.group || !filterParams.weeks) {
      ElMessage.warning('请选择完整的筛选条件后再导出报告');
      return;
    }

    await getFinalExcel(
      filterParams.direction,
      filterParams.group,
      filterParams.weeks || currentWeeks.value
    );

    ElMessage.success('报告导出成功');
  } catch (error) {
    console.error('导出报告失败:', error);
    ElMessage.error('导出报告失败: ' + (error.message || '未知错误'));
  }
};

// 计算完成比例
const getRate = () => {
  // 计算已完成的学生数量
  const finishedCount = stufilterList.value.filter(item => item.is_apply).length;
  
  console.log('完成人数:', finishedCount, '总人数:', totalStudentsCount.value, '当前列表长度:', stufilterList.value.length);
  
  // 使用小组总人数作为分母，如果没有获取到总人数，则使用当前列表长度作为备用
  const total = totalStudentsCount.value > 0 ? totalStudentsCount.value : stufilterList.value.length;
  
  return `${finishedCount}/${total}`;
};

// 根据筛选条件获取符合条件的学生列表
const list = (weeks, direction, group) => {
  filterParams.weeks = weeks || currentWeeks.value;
  filterParams.direction = direction;
  filterParams.group = group;

  fetchStudentList();
};
</script>

<style lang="less" scoped>
/* 作业下载开始 */
#download {
  width: 100%;
  // background-color: red;
  // height: 40%;
  height: 50%;
}

/* 标题 */
#download .title {
  height: 40px;
  // background-color: red;
  font-size: 20px;
  line-height: 20px;
  font-weight: 700;
  position: relative;
  border-bottom: 3px solid #000;
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
  height: 74%;
  // background-color: pink;
}

#download ul {
  height: 100%;
  overflow-y: auto;
  // background-color: #c2c7f4;
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
  /* background-color: pink; */
}

/* 头像 */
#checkbox ul li .circle {
  display: inline-block;
  width: 35px;
  height: 35px;
  background-color: #fff;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png');
  border-radius: 50%;
  box-shadow: 1px 1px 10px 1px #e2e1ed;
  margin-top: 5px;
  margin-left: 10px;
  margin-right: 15px;
}

/* 多选框 */
#checkbox ul li input[type='checkbox'] {
  appearance: none;
  width: 24px;
  height: 24px;
  font-size: 14px;
}

#checkbox ul li input[type='checkbox']::after {
  position: absolute;
  top: 0;
  color: #000;
  width: 20px;
  height: 20px;
  display: inline-block;
  visibility: visible;
  padding-left: 0px;
  text-align: center;
}

#checkbox ul li input[type='checkbox']:checked::after {
  content: '✓';
  color: #130067;
  font-size: 15px;
  font-weight: bold;
  background-color: #fff;
}

/* 选择框 */
#download ul li input {
  width: 20px;
  height: 20px;
  position: absolute;
  right: 15px;
  top: 50%;
  margin-top: -10px;
  border: 2px solid #4a1691;
}

// 链接
li a {
  height: 50px;
  line-height: 50px;
  font-size: 10px;
  position: absolute;
  right: 60px;
  color: #4a1691;
  // display: none;
  // background-color: red;
}

.not-finish {
  position: absolute;
  right: 60px;
  color: rgb(143, 8, 8);
  height: 50px;
  line-height: 50px;
  font-size: 10px;
}

/* 最后一行 */
#download #line {
  width: 100%;
  height: 40px;
  // background-color: #666666;
}

/* 确认按钮 */
#download #line button {
  color: #fff;
  background-color: #130067;
  width: 30%;
  height: 40px;
  font-size: 20px;
  border-radius: 10px;
  margin-right: 20px;
}

/* 全选文字 */
#download #line div {
  color: #130067;
  width: 100px;
  height: 30px;
  font-size: 20px;
  line-height: 30px;
  font-size: 18px;
  font-weight: 700;
  display: inline-block;
  position: relative;
  right: -0%;
  // background-color: #202237;
}

/* 全选框 */
#line input {
  appearance: none;
  width: 24px;
  height: 24px;
  font-size: 14px;
  position: relative;
  left: 5px;
  top: 5px;
  border: 2px solid #4a1691;
}

#line input[type='checkbox']::after {
  position: absolute;
  top: 0;
  color: #000;
  width: 20px;
  height: 20px;
  display: inline-block;
  visibility: visible;
  padding-left: 0px;
  text-align: center;
}

#line input[type='checkbox']:checked::after {
  content: '✓';
  color: #130067;
  font-size: 15px;
  font-weight: bold;
  background-color: #fff;
}

/* 选择框 */
/* #download ul li input {
    width: 20px;
    height: 20px;
    position: absolute;
    right: 15px;
    top: 50%;
    margin-top: -10px;
    border: 2px solid #4a1691;
}

/* 注释框 */
/* 这里把 none 里面的内容隐藏起来 */
/* .none {
    width: 150px;
    height: 100px;
    box-sizing: border-box;
    background-color: #6d4aed;
    opacity: 0.5;
    border: 1px solid #999;
    position: absolute;
    left: 190px;
    top: 15px;
    z-index: 3;
    display: none;
} */

/* .none::after {
    border-style: solid;
    border-width: 10px;
    border-color: transparent;
    height: 0px;
    border-left-color: #6d4aed;
    content: ' ';
    position: absolute;
    top: 0px;
    left: 100%;
} */

/* 这里设置li鼠标移过的时候，如果里面有none这个类，才会触发里面的样式 */
/*这里把 none 里面的内容显示出来*/
/* #download ul li:hover .none{
    display: block;
} */

/* 作业下载结束 */
</style>
