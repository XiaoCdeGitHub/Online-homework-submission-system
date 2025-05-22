<template>
  <div class="admin-content-middle">
    <div class="middle-header">
      <div class="top-left-part">
        <div class="morning-user">
          <div class="user-photo">
            <img src="https://cd-mapbed.oss-cn-beijing.aliyuncs.com/preview.gif" alt="" />
          </div>
          <p >早上好，{{ userData.name}}!</p>
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
        <el-progress :percentage="50" :stroke-width="15" striped  striped-flow
      :duration="10"/>
      </div>
    </div>
    <div class="middle-body">
      <div class="file-upload">
        <img src="@/assets/img/user/fileUpload.png" alt="">
        <div class="text">
           点击此处提交文件<br>
        <span>（或者将文件拖拽到此处）<br></span>
        <span>支持格式：zip，tar</span>
        </div>
        <div class="upload-module">
      <el-upload
    class="upload-box"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
  </el-upload>
     </div>
      </div>
      <div class="user-form">
        <div class="main-form">
          <el-descriptions>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item">
          <el-icon color="#6B5AD8"><Location /></el-icon>
          阶段:
        </div>
      </template>
      <el-tag size="small">{{ userData.period }}</el-tag></el-descriptions-item>
    <el-descriptions-item >
      <template #label>
        <div class="cell-item">
          <el-icon color="#6B5AD8"><Flag/></el-icon>
          方向:
        </div>
      </template>
      <el-tag size="small">{{ userData.direction}}</el-tag></el-descriptions-item>
    <el-descriptions-item >
      <template #label>
        <div class="cell-item">
          <el-icon color="#6B5AD8">  <Finished /></el-icon>
          组别:
        </div>
      </template>
      <el-tag size="small">{{ userData.group}}</el-tag></el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item">
          <el-icon color="#6B5AD8" :style="iconStyle">
            <user />
          </el-icon>
          姓名：
        </div>
      </template>
      <el-tag size="small">{{ userData.name}}</el-tag>
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <div class="cell-item">
          <el-icon color="#6B5AD8"><Document /></el-icon>
          学号:
        </div>
      </template>
      <el-tag size="small">{{ userData.id}}</el-tag></el-descriptions-item
    >
  </el-descriptions>

        </div>
        <textarea class="remark-form" value="备注:">
        </textarea>

      </div>
      <div class="button-submit" @click="submit()">
        <p>确认提交&nbsp;<el-icon><SuccessFilled /></el-icon></p>

      </div>
    </div>
    <div class="middle-footer">
    <div class="little-boy">
    <span class="date">
      {{ nowDate }}
    </span>
    <span class="time">
      {{currentTime}}
    </span>
    <span class>

    </span>
<img src="@/assets/img/user/little-boy.png" alt="">
    </div>
    <div class="carousel">

  <el-carousel :interval="4000" type="card" height="220px">
    <el-carousel-item v-for="(item,index) in carousel" :key="index">
      <img :src="item" alt="">
    </el-carousel-item>
  </el-carousel>

    </div>
    </div>

  </div>
</template>

<script setup>
import {
  Location,Flag, Finished,Document,User,SuccessFilled
} from '@element-plus/icons-vue'

//学生信息
const userData = ref({
  period: '适应期第一周',
  direction: '全栈方向',
  group: '第二组',
  name: '崔鼎',
  id:'2021005697'
})
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
  // console.log(currentTime);
}, 1000);
const submit = () => {
  ElMessage.success('提交成功！')
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
.progress{
  width: 30%;
  height: 100%;
  display: flex;
  flex-direction: column;
  p{
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
  .file-upload{
    width: 400px;
    height: 260px;
    // background-color: red;
    position: relative;
    img{
      width: 400px;
      height: 260px;
    }
    .text{
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      position: absolute;
      top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  span{
    font-size: 12px;
  }
    }
    .upload-module{
      // background-color: red;
      position: absolute;
      top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
      height: 260px;

      :deep(.el-upload-dragger){
        width: 400px;
      height: 240px;
      background-color: green;
      opacity: 0;
      }

    }
  }
  .user-form{
    width: 500px;
    height: 260px;
    margin-left: -20px;
    // background-color: red;

    .main-form{
      width: 80%;
      height: 48%;
      margin-top: 17px;
      padding: 8px;
      margin-left: auto;margin-right: auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: #7d70a9 0px 0px 10px;
    }
    .remark-form{
      display: block;
      font-size: 16px;
      font-weight: 600;
      color:#7d70a9;
      width: 80%;
      height: 35%;
      margin-top: 10px;
      margin-left: auto;margin-right: auto;
      background-color: white;
      border-radius: 10px;
      box-shadow: #7d70a9 0px 0px 10px;
      padding: 5px;

    }
    textarea::placeholder {
  color: #6C5AD7; /* 更改为您想要的颜色值 */
}
  }
  .button-submit{
    width: 100px;
    height: 82%;
    background-color: #8A90FA;
    margin-right: 10px;
    border-radius: 10px;
    box-shadow: #7d70a9 0px 0px 10px;
    p{
      display: block;
      color: white;
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      writing-mode: vertical-lr;
      height: 224px;
      width: 30px;
      // background-color: green;
      margin-left: auto;margin-right: auto;
    }
  }
  .button-submit:active {
  transform: scale(0.9); /* 缩小按钮 */
  transition: transform 0.3s ease-in-out; /* 添加过渡效果 */
}
}
.middle-footer{
  width: 98%;
  height: 34vh;
  display: flex;
  flex-direction: row;
  // background-color: red;
  .little-boy{
    position: relative;
    img{
      width: 22vw;
      height: 37vh;
      margin-top: -10px;
      margin-left: 20px;

    }
    .date{
      position: absolute;
      top: 21vh;
      left: 2.5vw;
      font-weight: 600;
      color: white;
    }
    .time{
      position: absolute;
      top: 6vh;
      left: 5.8vw;
      color: white;
      font-weight: 600;

    }
  }
  .carousel{
  width: 700px;
  height: 37vh;
  // background-color: white;
  margin-left: 50px;
  img{
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





</style>
