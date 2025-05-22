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
          {{ item.user_name }}
          <input type="checkbox" value="false" v-model="item.isSelect" @click="checkEach()" ref="ck" />
          <a v-show="item.is_apply" href="javascript:void(0);" @click="downloadStudentHomework(item)">点击此处下载作业</a>
          <span v-show="!item.is_apply" class="not-finish">暂未完成</span>
        </li>
      </ul>
    </div>
    <div id="line">
      <button @click="Submit()">批量下载</button>
      <button @click="downloadExcel">下载报告</button>
      <div>
        全选<input type="checkbox" id="ckAll" v-model="isAll" ref="ckAll" @click="checkAll()" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import arrayToExcel from '../../../plugins/arrayToExcel/index';
import { loadFile } from '../../../utils/brower';
import { useGroupStore } from '@/stores/group';
import {
  selectCondition,
  downloadHomework,
  getFinalExcel,
  getGroupInfo,
  getCurrentWeeks
} from '@/service/api/adminHomework';

// 当前周数
const currentWeeks = ref(1);
// 筛选条件
const filterParams = reactive({
  direction: '',
  group: '',
  weeks: 0,
  status: undefined,
});

// 全选状态
const isAll = ref(false);

// 学生列表
const stufilterList = ref([]);
const groupStore = useGroupStore();
// 加载状态
const loading = ref(false);

// 监听group store的变化
watch(() => [groupStore.direction, groupStore.group], ([newDirection, newGroup]) => {
  if (newDirection !== filterParams.direction || newGroup !== filterParams.group) {
    filterParams.direction = newDirection || '';
    filterParams.group = newGroup || '';
    fetchStudentList();
  }
}, { deep: true });

// 获取当前周数
const fetchCurrentWeeks = async () => {
  try {
    const res = await getCurrentWeeks();
    if (res.code === 200) {
      currentWeeks.value = res.data;
      filterParams.weeks = res.data;
    } else {
      console.warn('获取当前周数返回非200状态:', res);
      // 默认使用1作为当前周数
      currentWeeks.value = 1;
      filterParams.weeks = 1;
    }
  } catch (error) {
    console.error('获取当前周数异常:', error);
    ElMessage.error('获取周数失败，使用默认值');
    // 出错时使用默认值
    currentWeeks.value = 1;
    filterParams.weeks = 1;
  }
};

// 获取学生作业提交情况
const fetchStudentList = async () => {
  if (!filterParams.direction && !filterParams.group) {
    console.warn('筛选条件不完整，direction和group均为空');
    return;
  }

  const loadingInstance = ElLoading.service({
    text: '加载学生数据中...',
    background: 'rgba(255, 255, 255, 0.7)'
  });

  loading.value = true;

  try {
    // 确保weeks有值
    if (!filterParams.weeks) {
      filterParams.weeks = currentWeeks.value || 1;
    }

    console.log('请求参数:', filterParams);

    const res = await selectCondition({
      direction: filterParams.direction,
      group: filterParams.group,
      weeks: filterParams.weeks
    });

    if (res.code === 200) {
      if (Array.isArray(res.data)) {
        stufilterList.value = res.data.map(item => {
          return {
            ...item,
            isSelect: false,
            // 确保user_name存在
            user_name: item.user_name || item.name || '未知用户'
          };
        });
        console.log('获取到的学生列表:', stufilterList.value);
      } else {
        console.warn('返回的数据不是数组:', res.data);
        stufilterList.value = [];
        ElMessage.warning('获取学生数据格式不正确');
      }
    } else if (res.code === 404) {
      console.warn('没有找到符合条件的作业数据');
      stufilterList.value = [];
      ElMessage.info('当前条件下没有找到学生作业数据');
    } else {
      console.error('获取学生作业数据失败:', res);
      ElMessage.error(res.message || '获取学生作业数据失败');
      stufilterList.value = [];
    }
  } catch (error) {
    console.error('获取学生作业数据异常:', error);
    ElMessage.error('获取学生数据失败，请稍后重试');
    stufilterList.value = [];
  } finally {
    loading.value = false;
    loadingInstance.close();
  }
};

// 获取小组信息
const fetchGroupInfo = async () => {
  if (!filterParams.direction || !filterParams.group) {
    console.warn('获取小组信息：筛选条件不完整');
    return;
  }

  const loadingInstance = ElLoading.service({
    text: '加载小组信息中...',
    background: 'rgba(255, 255, 255, 0.7)'
  });

  try {
    const params = {
      direction: filterParams.direction,
      group: filterParams.group
    };

    // 如果有周数，添加到参数中
    if (filterParams.weeks) {
      params.weeks = filterParams.weeks;
    }

    console.log('获取小组信息请求参数:', params);

    const res = await getGroupInfo(params);

    if (res.code === 200) {
      if (Array.isArray(res.data)) {
        stufilterList.value = res.data.map(item => {
          return {
            ...item,
            isSelect: false,
            // 确保user_name存在
            user_name: item.user_name || item.name || '未知用户'
          };
        });
      } else {
        console.warn('小组数据不是数组:', res.data);
        ElMessage.warning('获取小组数据格式不正确');
      }
    } else {
      console.error('获取小组信息失败:', res);
      ElMessage.error(res.message || '获取小组信息失败');
    }
  } catch (error) {
    console.error('获取小组信息异常:', error);
    ElMessage.error('获取小组信息失败，请稍后重试');
  } finally {
    loadingInstance.close();
  }
};

// 初始化
onMounted(async () => {
  await fetchCurrentWeeks();

  // 从store获取筛选条件
  const storeDirection = groupStore.direction;
  const storeGroup = groupStore.group;

  if (storeDirection) {
    filterParams.direction = storeDirection;
    console.log('从store获取到direction:', storeDirection);
  }

  if (storeGroup) {
    filterParams.group = storeGroup;
    console.log('从store获取到group:', storeGroup);
  }

  // 获取学生列表
  if (filterParams.direction || filterParams.group) {
    fetchStudentList();
  } else {
    console.log('缺少direction或group筛选条件，暂不加载学生列表');
  }
});

// 单选框
const checkEach = () => {
  let count = 0;
  stufilterList.value.forEach((item) => {
    if (item.isSelect === true) {
      count++;
    }
  });
  isAll.value = count === stufilterList.value.length && stufilterList.value.length > 0;
};

// 全选框
const checkAll = () => {
  stufilterList.value.forEach((item) => {
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

    const weekToUse = filterParams.weeks || currentWeeks.value || 1;
    console.log(`正在下载学生ID:${item.userId}的第${weekToUse}周作业`);

    await downloadHomework(item.userId, weekToUse);
    ElMessage.success(`${item.user_name}的作业下载已启动`);
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

  const loadingInstance = ElLoading.service({
    text: '批量下载中...',
    background: 'rgba(255, 255, 255, 0.7)'
  });

  try {
    let downloadCount = 0;
    let errorCount = 0;

    for (const student of selectedStudents) {
      try {
        if (!student.userId) {
          console.warn(`学生 ${student.user_name} 缺少userId`);
          errorCount++;
          continue;
        }

        await downloadHomework(student.userId, filterParams.weeks || currentWeeks.value || 1);
        downloadCount++;
        // 添加小延迟避免浏览器阻止多文件下载
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`下载学生 ${student.user_name} 的作业失败:`, error);
        errorCount++;
      }
    }

    if (errorCount === 0) {
      ElMessage.success(`成功启动${downloadCount}个作业的下载`);
    } else {
      ElMessage.warning(`成功启动${downloadCount}个下载，${errorCount}个失败`);
    }
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载过程中出现错误');
  } finally {
    loadingInstance.close();
  }
};

// 导出Excel报告
const downloadExcel = async () => {
  if (stufilterList.value.length === 0) {
    ElMessage.warning('暂时没有生成报告的数据');
    return;
  }

  try {
    if (!filterParams.direction || !filterParams.group) {
      ElMessage.warning('请选择完整的筛选条件后再导出报告');
      return;
    }

    const weekToUse = filterParams.weeks || currentWeeks.value || 1;

    const loadingInstance = ElLoading.service({
      text: '导出报告中...',
      background: 'rgba(255, 255, 255, 0.7)'
    });

    try {
      await getFinalExcel(
        filterParams.direction,
        filterParams.group,
        weekToUse
      );

      ElMessage.success('报告导出成功');
    } finally {
      loadingInstance.close();
    }
  } catch (error) {
    console.error('导出报告失败:', error);

    // 如果后端API失败，则尝试在前端生成报告
    try {
      generateLocalExcel();
    } catch (localError) {
      console.error('本地生成报告也失败:', localError);
      ElMessage.error('导出报告失败: ' + (error.message || '未知错误'));
    }
  }
};

// 前端生成Excel报告（作为后备方案）
const generateLocalExcel = () => {
  if (stufilterList.value.length === 0) {
    throw new Error('没有数据可以导出');
  }

  const result = stufilterList.value.map((item) => {
    return {
      name: item.user_name || item.name || '未知',
      direction: item.direction || filterParams.direction || '未知',
      group: item.group || filterParams.group || '未知',
      finish: item.is_apply ? '完成' : '未完成',
    };
  });

  const excel = new arrayToExcel({
    title: ['姓名', '方向', '小组', '是否完成'],
    column: result,
    filename: `${filterParams.direction || ''}${filterParams.group || ''}-作业情况统计`,
  });

  excel.download();
  ElMessage.success('已在本地生成报告');
};

// 计算完成比例
const getRate = () => {
  if (stufilterList.value && stufilterList.value.length > 0) {
    const finished = stufilterList.value.filter(item => item.is_apply);
    return `${finished.length}/${stufilterList.value.length}`;
  }
  return '0/0';
};

// 根据筛选条件获取符合条件的学生列表
const list = (weeks, direction, group) => {
  filterParams.weeks = weeks || currentWeeks.value || 1;
  filterParams.direction = direction || '';
  filterParams.group = group || '';

  if (filterParams.direction || filterParams.group) {
    console.log('使用新的筛选条件获取学生列表:', filterParams);
    fetchStudentList();
  } else {
    console.warn('缺少必要的筛选条件');
    ElMessage.warning('请选择方向或小组');
  }
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
  .bg-maker();
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
