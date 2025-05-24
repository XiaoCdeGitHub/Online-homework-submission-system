<!--
 * @Author: cuiding 1692338302@qq.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding 1692338302@qq.com
 * @LastEditTime: 2025-05-25 01:42:50
 * @FilePath: /YunJiaoYunJi-master/src/views/Login/Login.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * 登录注册页面
 * Login.vue
-->
<template>
  <div class="container">
    <div class="bg">
      <div class="circle">
        <div class="form">
          <img :src="quxiaoImg" alt="quxiao" class="quxiao" @click="cancel">
          <div class="form-center">
            <div class="logo">
              <img :src="logoImg" alt="logo">
              <h5>YUNDING ACADEMY</h5>
            </div>
            <h1>登录 Log In</h1>
            <div class="StuId">
              <h3>学号 Student Id</h3>
              <input type="number" v-model="formData.number" placeholder="请输入学号">
              <img :src="stuIdImg" alt="StuId">
            </div>
            <div class="Name">
              <h3>姓名 Name</h3>
              <input type="text" v-model="formData.name" placeholder="请输入姓名">
              <img :src="nameImg" alt="Nm">
            </div>
            <div class="PWord">
              <h3>密码 Password</h3>
              <input :type="showPassword ? 'text' : 'password'" v-model="formData.password" placeholder="请输入密码">
              <img :src="showPassword ? hidden1Img : hidden2Img" alt="Pw" @click="togglePassword"
                style="cursor: pointer;">
            </div>
            <input type="button" value="登录" class="confirm" @click="handleLogin">
            <h6 @click="toSignUp">没有账号？去注册</h6>
          </div>
          <div class="form-right" @click="toSignUp">
            <img :src="rightImg">
          </div>
        </div>
        <img :src="xiaoren1Img" alt="quxiao" class="xiaoren1">
        <img :src="xiaoren2Img" alt="quxiao" class="xiaoren2">
        <div class="footer"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/service/api/login'
import { getUserInfo } from '@/service/api/user'
import { isPassword } from '@/utils/check'
import { getCurrentWeeks } from '@/service/api/adminHomework'

// 导入图片资源
import logoImg from '@/assets/img/login/logo.png'
import quxiaoImg from '@/assets/img/login/quxiao.png'
import stuIdImg from '@/assets/img/login/学号.png'
import nameImg from '@/assets/img/login/姓名.png'
import hidden1Img from '@/assets/img/login/hidden2.png'
import hidden2Img from '@/assets/img/login/Password.png'
import rightImg from '@/assets/img/login/right.png'
import xiaoren1Img from '@/assets/img/login/xiaoren1.png'
import xiaoren2Img from '@/assets/img/login/xiaoren2.png'

const router = useRouter()
const showPassword = ref(false)

const formData = reactive({
  number: null as number | null,
  name: '',
  password: ''
})

// 切换密码显示/隐藏
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 表单验证
const validateForm = () => {
  const errors = []

  // 学号验证
  if (!formData.number) {
    errors.push('请输入学号')
  // } else {
  //   const studentIdStr = String(formData.number)
  //   if (studentIdStr.length !== 10) {
  //     errors.push('学号必须是10位数字')
  //   } else if (!/^20\d{8}$/.test(studentIdStr)) {
  //     errors.push('学号格式不正确，应为以20开头的10位数字')
  //   }
  // }

  // 姓名验证
  if (!formData.name || formData.name.trim() === '') {
    errors.push('请输入姓名')
  }

  // 密码验证
  if (!formData.password) {
    errors.push('请输入密码')
  } else if (!isPassword(formData.password)) {
    errors.push('密码格式不正确')
  }

  // 如果有错误，显示第一个错误并返回false
  if (errors.length > 0) {
    ElMessage.error(errors[0])
    return false
  }

  return true
}

// 在<script setup>部分的开头添加周数到期数的转换函数
function getPeriodByWeek(weekNum: number): string {
  // 极简版本：所有周数都表示为"适应期第X周"
  if (weekNum <= 0) {
    return '适应期第0周';
  }
  return `适应期第${weekNum}周`;
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    // 清除所有可能与小组相关的本地存储
    // 在登录前清除所有可能的组数据缓存
    const keysToRemove = [];

    // 遍历所有localStorage键
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // 清除与组相关的键
        if (key.includes('group') || key.includes('Group') ||
          key.startsWith('groupInfo_')) {
          keysToRemove.push(key);
        }

        // 清除之前用户提交缓存
        if (key.includes('submission') || key.includes('Submission')) {
          keysToRemove.push(key);
        }
      }
    }

    // 删除收集到的键
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('已清除本地缓存:', key);
    });

    // 清理其他可能的缓存
    localStorage.removeItem('userData');  // 可能的用户数据缓存
    localStorage.removeItem('lastLogin'); // 上次登录信息
    localStorage.removeItem('cachedStats'); // 可能的统计缓存
    // 清除之前的用户信息和token
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');

    const res = await login({
      number: Number(formData.number),
      password: formData.password
    })

    console.log('登录响应:', res)
    console.log('登录响应数据结构:', JSON.stringify(res?.data || {}, null, 2))

    if (res?.code === 200) {
      // 从登录响应中提取数据
      const loginData = res.data || {}

      // 保存token
      if (loginData.token) {
        localStorage.setItem('token', loginData.token)
      } else {
        console.warn('登录响应中未找到token')
      }

      // 创建用户信息对象结构
      const userInfo: {
        name: string;
        userId: string;
        number: number | null;
        qqnum: string;
        direction: string;
        group: string;
        period: string;
        role: string;
        currentWeek?: number;
      } = {
        // 初始化默认值
        name: formData.name || '',
        userId: '',
        number: formData.number || null,
        qqnum: '',
        direction: '',
        group: '',
        period: '',
        role: 'user',
        currentWeek: undefined
      }

      // 从登录响应中获取字段（兼容不同的字段名）
      userInfo.name = loginData.name || loginData.userName || '';
      userInfo.userId = loginData.id || loginData.userId || loginData._id || '';
      userInfo.qqnum = loginData.qqnum || loginData.qq || '';
      userInfo.direction = loginData.direction || '';
      userInfo.group = loginData.group || loginData.groupName || '';
      userInfo.period = loginData.period || '';

      // 根据isAdmin字段设置角色
      if (loginData.isAdmin === true || loginData.role === 'admin') {
        userInfo.role = 'admin';
      }

      // 如果登录响应中没有提供足够的用户信息，尝试通过getUserInfo获取更多详细信息
      if (!userInfo.userId && !userInfo.name) {
        console.warn('登录响应中缺少重要的用户信息，尝试获取用户详细信息');

        try {
          // 尝试使用学号作为ID获取用户信息
          const userId = userInfo.userId || formData.number?.toString() || '';
          if (userId) {
            const userDetailResponse = await getUserInfo(userId);

            if (userDetailResponse.code === 200 && userDetailResponse.data) {
              const userData = userDetailResponse.data;

              // 更新用户信息
              if (userData.name) userInfo.name = userData.name;
              if (userData.id || userData.userId || userData._id) {
                userInfo.userId = userData.id || userData.userId || userData._id || '';
              }
              if (userData.qqnum || userData.qq) userInfo.qqnum = userData.qqnum || userData.qq || '';
              if (userData.direction) userInfo.direction = userData.direction;
              if (userData.group || userData.groupName) userInfo.group = userData.group || userData.groupName || '';
              if (userData.period) userInfo.period = userData.period;
              if (userData.isAdmin === true) userInfo.role = 'admin';

              console.log('成功获取用户详细信息');
            } else {
              console.warn('获取用户详细信息失败:', userDetailResponse.message);
            }
          }
        } catch (detailError) {
          console.error('获取用户详细信息出错:', detailError);
        }
      }

      // 获取当前周数并更新到用户信息中
      try {
        const weekResponse = await getCurrentWeeks();
        if (weekResponse.code === 200 && weekResponse.data !== undefined) {
          userInfo.currentWeek = weekResponse.data;
          console.log('登录时获取到当前周数:', weekResponse.data);

          // 根据周数设置对应的期数
          userInfo.period = getPeriodByWeek(weekResponse.data);
        } else {
          console.warn('获取当前周数失败:', weekResponse);
        }
      } catch (weekError) {
        console.error('获取当前周数出错:', weekError);
      }

      // 优先使用登录响应中的currentWeeks
      if (loginData.currentWeeks !== undefined) {
        userInfo.currentWeek = loginData.currentWeeks;
        // 根据周数设置对应的期数
        userInfo.period = getPeriodByWeek(loginData.currentWeeks);
        console.log('使用登录响应中的周数:', loginData.currentWeeks);
      }

      // 最后检查关键字段是否为空，如有需要填充默认值
      if (!userInfo.name) {
        userInfo.name = formData.number?.toString() || '未知用户';
      }

      if (!userInfo.group) {
        // 仅在确实没有组别信息时才使用默认值
        userInfo.group = '未分组';
      }

      if (!userInfo.direction) {
        userInfo.direction = '未指定方向';
      }

      if (!userInfo.period) {
        // 如果确实没有期数信息，则根据currentWeek设置
        if (userInfo.currentWeek) {
          userInfo.period = getPeriodByWeek(userInfo.currentWeek);
        } else {
          userInfo.period = '适应期第一周';
        }
      }

      // 保存用户信息
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      console.log('保存的用户信息:', userInfo)

      ElMessage.success('登录成功')

      // 根据role决定跳转
      if (userInfo.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/user')
      }
    } else {
      ElMessage.error(res?.message || res?.msg || '登录失败')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error?.response?.data?.message || error?.message || '登录失败，请稍后重试')
  }
}

const cancel = () => {
  router.push('/')
}

const toSignUp = () => {
  router.push('/signup')
}

</script>

<style scoped lang="less">
.bg {
  height: 100vh;
  width: 100%;
  background-color: #EFF4FF;
  // position: relative;
  display: flex;
  flex-direction: column;

  .circle {
    height: 450px;
    width: 450px;
    margin: auto;
    background-color: #EFF4FF;
    z-index: 100;
    position: relative;

    .form {
      height: 410px;
      width: 350px;
      margin: 0 auto;
      background-color: #ECEEEF;
      border-radius: 20px;
      box-shadow: 6px 6px 5px 5px #D7DDF8;

      //z-index:100;
      .form-center {
        width: 300px;
        height: 80%;
        margin-left: auto;
        margin-right: auto;
        //background-color: yellow;
        padding-top: 10px;
        position: relative;

        .logo {
          img {
            width: 30px;
            height: 20px;
            margin-right: 10px;
          }

          h5 {
            padding-top: 3px;
            font-family: sans-serif;
          }

          display: flex;
          flex-direction: row;
          color:#294AC1;
          margin-bottom: 10px;
          //margin-top: 10px;
        }

        h1 {
          color: #1F1467;
          font-family: sans-serif;
          margin-top: 15px;
          margin-bottom: 15px;
        }

        h3 {
          color: #6C6FA3;
          font-family: sans-serif;
          margin-bottom: 5px;

        }

        h6 {
          text-align: center;
          color: #9393B9;
          //margin:auto 0;
          font-family: sans-serif;
        }

        .StuId {
          position: relative;

          input {
            border: none;
            width: 300px;
            height: 35px;
            margin-top: 5px;
            margin-bottom: 5px;
            border-radius: 10px;
            border: solid 3px #6C6FA3;
            background-color: #ECEEEF;
            transition: transform 0.2s;
            /* 添加过渡效果 */
          }

          input:focus {
            /* 点击时的放大效果 */
            transform: scale(1.05);
          }

          img {
            width: 35px;
            height: 25px;
            position: absolute;
            left: 85%;
            top: 54%;
          }
        }

        .Name {
          position: relative;

          input {
            border: none;
            width: 300px;
            height: 35px;
            margin-top: 5px;
            margin-bottom: 5px;
            border-radius: 10px;
            border: solid 3px #6C6FA3;
            background-color: #ECEEEF;
            transition: transform 0.2s;
            /* 添加过渡效果 */

          }

          input:focus {
            /* 点击时的放大效果 */
            transform: scale(1.05);
          }

          img {
            width: 20px;
            height: 25px;
            position: absolute;
            left: 88%;
            top: 52%;
          }
        }

        .PWord {
          position: relative;

          input {
            border: none;
            width: 300px;
            height: 35px;
            margin-top: 5px;
            margin-bottom: 5px;
            border-radius: 10px;
            border: solid 3px #6C6FA3;
            background-color: #ECEEEF;
            transition: transform 0.2s;
            /* 添加过渡效果 */

          }

          input:focus {
            /* 点击时的放大效果 */
            transform: scale(1.05);
          }

          img {
            width: 25px;
            height: 25px;
            position: absolute;
            left: 88%;
            top: 54%;
          }
        }

        .confirm {
          border: none;
          font-family: sans-serif;
          border: none;
          width: 300px;
          height: 40px;
          margin-top: 5px;
          margin-bottom: 5px;
          border-radius: 10px;
          border: solid 3px #1F1467;
          background: #1F1467;
          color: white;
          font-weight: bold;
          font-size: 18px;
          padding-top: 5px;
          padding-bottom: 5px;
          letter-spacing: 2px;
          transition: transform 0.2s, box-shadow 0.2s;
          /* 添加过渡效果和阴影过渡 */
        }

        .confirm:active {
          /* 点击时的放大效果和抖动效果 */
          transform: scale(1.35);
          // animation: shake 0.2s infinite;
        }

        @keyframes shake {
          0% {
            transform: translateX(0);
          }

          25% {
            transform: translateX(-5px);
          }

          50% {
            transform: translateX(0);
          }

          75% {
            transform: translateX(5px);
          }

          100% {
            transform: translateX(0);
          }
        }

      }

      .quxiao {
        position: absolute;
        width: 13px;
        height: 13px;
        margin-top: 15px;
        //left:5%;
        margin-left: 6px;
      }

      .form-right {
        position: absolute;
        top: -20px;
        left: 320px;
        background-color: #3C66FD;
        height: 100px;
        width: 100px;
        border-radius: 20px;
        padding: 20px;
        transition: transform 0.4s, box-shadow 0.2s;

        /* 添加过渡效果和阴影过渡 */
        img {
          width: 60px;
          height: 60px;
        }
      }

      .form-right:active {
        /* 点击时的放大效果和抖动效果 */
        transform: scale(1.35);
        // animation: shake 0.2s infinite;
      }
    }

    .xiaoren1 {
      position: absolute;
      width: 170px;
      height: 230px;
      left: -40px;
      top: 44%;
      z-index: -1;
    }

    .xiaoren2 {
      position: absolute;
      width: 150px;
      height: 200px;
      left: 355px;
      top: 70px;
      z-index: -1;
    }

    .footer {
      height: 30px;
      width: 300px;
      margin: 0 auto;
      background-color: #ECEEEF;
      border-radius: 0 0 20px 20px;
      box-shadow: #B4B9DB 0 5px 5px 5px;
    }
  }
}
</style>
