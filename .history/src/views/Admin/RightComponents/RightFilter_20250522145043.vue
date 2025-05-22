<template>
  <div id="Filter">
    <div class="sift-word1">筛选条件</div>
    <div class="sift-word2">Filter</div>
    <div class="picture-computer"></div>
    <button @click="handleSubmit">确定</button>
    <!-- 阶段 -->
    <div>
      <div class="stage">
        <span @click="toggleStageDropdown">{{ stageName || '阶段' }}⌵</span>
        <ul v-show="stageDropdownVisible">
          <li v-for="(stage, index) in stageList" :key="index" @click="selectStage(index)">
            {{ stage.name }}
          </li>
        </ul>
      </div>
    </div>
    <!-- 方向 -->
    <div>
      <div class="Direction">
        <span @click="toggleDirectionDropdown">{{ directionName || '方向' }}⌵</span>
        <ul v-show="directionDropdownVisible">
          <li v-for="(dir, index) in directionList" :key="index" @click="selectDirection(index)">
            {{ dir.name }}
          </li>
        </ul>
      </div>
    </div>
    <!-- 组 -->
    <div>
      <div class="group">
        <span @click="toggleGroupDropdown">{{ groupName || '组别' }}⌵</span>
        <ul v-show="groupDropdownVisible">
          <li v-for="(group, index) in groupList" :key="index" @click="selectGroup(index)">
            {{ group.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { getFilter } from '@/service/api/admin';
import { getGroupInfo } from '@/service/api/adminHomework';
import { useGroupStore } from '@/stores/group';
import { groupList, directionList, stageList } from '../../../data/admin';

// 定义事件
const emit = defineEmits(['filter-applied', 'filter-change']);

// 筛选状态
const stageDropdownVisible = ref(false);
const directionDropdownVisible = ref(false);
const groupDropdownVisible = ref(false);
const stageName = ref('');
const directionName = ref('');
const groupName = ref('');
const stageValue = ref('');
const directionValue = ref('');
const groupValue = ref('');

// 下拉菜单切换
const toggleStageDropdown = () => {
  stageDropdownVisible.value = !stageDropdownVisible.value;
  directionDropdownVisible.value = false;
  groupDropdownVisible.value = false;
}

const toggleDirectionDropdown = () => {
  directionDropdownVisible.value = !directionDropdownVisible.value;
  stageDropdownVisible.value = false;
  groupDropdownVisible.value = false;
}

const toggleGroupDropdown = () => {
  groupDropdownVisible.value = !groupDropdownVisible.value;
  stageDropdownVisible.value = false;
  directionDropdownVisible.value = false;
}

// 选择器处理函数
const selectStage = (index) => {
  stageName.value = stageList[index].name;
  stageValue.value = stageList[index].value;
  stageDropdownVisible.value = false;

  // 通知父组件选择变更
  emit('filter-change', {
    type: 'stage',
    name: stageName.value,
    value: stageValue.value
  });
}

const selectDirection = (index) => {
  directionName.value = directionList[index].name;
  directionValue.value = directionList[index].name;
  directionDropdownVisible.value = false;

  // 通知父组件选择变更
  emit('filter-change', {
    type: 'direction',
    name: directionName.value,
    value: directionValue.value
  });
}

const selectGroup = (index) => {
  groupName.value = groupList[index].name;
  groupValue.value = groupList[index].name;
  groupDropdownVisible.value = false;

  // 通知父组件选择变更
  emit('filter-change', {
    type: 'group',
    name: groupName.value,
    value: groupValue.value
  });
}

// 提交筛选
const handleSubmit = async () => {
  // 验证筛选条件
  if (!stageValue.value) {
    ElMessage.warning('请选择阶段');
    return;
  }
  if (!directionValue.value) {
    ElMessage.warning('请选择方向');
    return;
  }
  if (!groupValue.value) {
    ElMessage.warning('请选择组别');
    return;
  }

  const filterParams = {
    weeks: stageValue.value,
    group: groupValue.value,
    direction: directionValue.value,
  };

  try {
    // 使用管理员作业API获取小组作业提交统计
    const response = await getGroupInfo(filterParams);

    if (response.code === 200) {
      ElMessage.success('查询成功');

      // 保存数据到本地存储
      localStorage.setItem("groupInfo", JSON.stringify(response));

      // 向父组件发送筛选结果事件
      emit('filter-applied', {
        params: filterParams,
        result: response.data
      });
    } else {
      ElMessage.error('查询失败: ' + (response.message || `状态码为${response.code}`));
    }
  } catch (error) {
    console.error('筛选查询失败:', error);
    ElMessage.error('查询失败，请检查网络连接');
  }
}
</script>

<style scoped>
/* 筛选条件开始 */
#Filter {
  width: 100%;
  height: 48%;
  cursor: default;
}

/* 筛选条件中文 */
.sift-word1 {
  display: inline-block;
  width: 100%;
  height: 20px;
  font-size: 15px;
  font-weight: 700;
  color: #333333;
  position: relative;
  top: 10%;
}

/* 筛选条件英文 */
.sift-word2 {
  display: inline-block;
  width: 100%;
  height: 20px;
  font-size: 15px;
  color: #666666;
  position: relative;
  top: 11%;
}

.picture-computer {
  display: inline-block;
  width: 120px;
  height: 120px;
  background-image: url(@/assets/img/admin/computer.png);
  background-repeat: no-repeat;
  position: relative;
  left: 80%;
  top: -10%;
}

li {
  list-style: none;
}

/* 阶段 */
.stage {
  display: inline-block;
  width: 150px;
  height: 150px;
  line-height: 150px;
  text-align: center;
  font-size: 25px;
  color: #fff;
  background-image: linear-gradient(to bottom, #8156d9, #6450f9);
  border-radius: 50%;
  position: absolute;
  top: 8%;
  left: 82%;
  border: none;
  cursor: pointer;
  user-select: none;
}

.stage ul li {
  background-color: #c2c7f4;
  width: 150px;
  height: 30px;
  text-align: center;
  line-height: 30px;
  font-size: 20px;
  color: #000;
  border-radius: 10px;
  position: relative;
  z-index: 9999;
  opacity: 0.8;
  cursor: pointer;
}

.stage ul li:hover {
  background-color: #333333;
  color: #fff;
}

/* 方向 */
.Direction {
  width: 100px;
  height: 100px;
  line-height: 100px;
  font-size: 20px;
  text-align: center;
  color: #fff;
  background-image: linear-gradient(to bottom right, #8473ed, #d776b8);
  border-radius: 50%;
  border: none;
  position: absolute;
  top: 30%;
  left: 78%;
  cursor: pointer;
  user-select: none;
}

.Direction ul li {
  background-color: #e8b8e5;
  width: 150px;
  height: 30px;
  text-align: center;
  line-height: 30px;
  font-size: 20px;
  color: #000;
  border-radius: 10px;
  z-index: 9999;
  position: relative;
  left: -50px;
  opacity: 0.8;
  cursor: pointer;
}

.Direction ul li:hover {
  background-color: #333333;
  color: #fff;
}

/* 组 */
.group {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  font-size: 25px;
  text-align: center;
  line-height: 130px;
  border: none;
  color: #fff;
  background-image: linear-gradient(to bottom, #e24777, #f17770);
  position: absolute;
  top: 30%;
  left: 88%;
  cursor: pointer;
  user-select: none;
}

.group ul li {
  background-color: #e8b0a6;
  width: 150px;
  height: 30px;
  text-align: center;
  line-height: 30px;
  font-size: 20px;
  color: #000;
  border-radius: 10px;
  position: relative;
  z-index: 9999;
  opacity: 0.8;
  cursor: pointer;
}

.group ul li:hover {
  background-color: #333333;
  color: #fff;
}

/* 按钮 */
#Filter button {
  width: 50px;
  height: 50px;
  background-color: #9d93be;
  color: #fff;
  border: none;
  font-size: 17px;
  border-radius: 50%;
  position: relative;
  top: 3%;
  left: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

#Filter button:hover {
  background-color: #6B5AD8;
  transform: scale(1.05);
}

#Filter button:active {
  transform: scale(0.95);
}
</style>
