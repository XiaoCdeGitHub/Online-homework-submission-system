<template>
  <div class="admin-content-left">
    <div class="work-publish">
      <span style="font-size: 16px">任务完成周期：</span>
      <div class="publish-top">
        <div class="date-picker">
          <el-date-picker
            v-model="value2"
            type="datetimerange"
            :picker-options="pickerOptions"
            range-separator=" "
            start-placeholder="开始"
            end-placeholder="结束"
            align="right"
          >
          <el-tooltip
        class="box-item"
        effect="dark"
        content="Top Left prompts info"
        placement="top-start"
      ></el-tooltip>
        </el-date-picker>
        </div>
        <div class="group-checkbox">
          <el-select v-model="value1"  placeholder="请选择">
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"

            >
            </el-option>
          </el-select>
        </div>
      </div>
      <span style="position: relative; top: 10px"> 作业详情：</span>
      <div class="week-checkbox">
        <el-select v-model="weekNumber" disabled placeholder="请选择">
          <el-option
            v-for="item in weekOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"

          >
          </el-option>
        </el-select>
      </div>
      <label class="input-file-button" for="upload"> 点击下载文件 </label>
      <input type="file" id="upload" @change="getFile" />
      <textarea
        class="job-detail"
        placeholder="请输入备注内容"
        v-model="textarea"
        cols="34"
        rows="4"
      >
      </textarea>
      <button class="publish-button" @click="submitJob()">任务提交</button>
    </div>
  </div>
</template>

<script setup>
import { ChineseTransformGreenwich } from '../../utils/date';
import { weekToBeWorkName } from '../../utils/work';
import { directionOptionList, weekStageList } from '../../data/admin';
import { publicJobs, updateStatus, deleteUser } from '@/service/api/admin'
let work = JSON.parse(localStorage.getItem('work')) || {};
console.log(work,'work');
      const value1 = ref('全栈方向')//方向选择值
      const textarea = ref('这次作业大家要好好完成噢！！！') //
      const value2 = ref([])//日期值
      const options = directionOptionList
      const weekNumber = ref('第一周')
      const weekOptions = weekStageList
      const file = ref('')
      const color = ref('red')

// value1.value = work.direction;
console.log('value1.value',value1.value);
// textarea.value = work.notice;
if (work.direction) value1.value = work.direction;
if (work.notice) textarea.value = work.notice;
if (work.weeks) weekNumber.value = work.weeks;
if (work.file) file.value = work.file;

value2.value = JSON.parse(localStorage.getItem("jobTime")) || [];

console.log(value2.value);
// weekNumber.value = work.weeks;
// file.value = work.file;


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
</style>
