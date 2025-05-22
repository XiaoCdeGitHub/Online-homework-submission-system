<!--
 * @Author: cuiding 1692338302@qq.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding 1692338302@qq.com
 * @LastEditTime: 2025-04-29 13:10:34
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
              <input type="text" name="name" id="name">
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
import { isPassword } from '@/utils/check'

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
  password: ''
})

// 切换密码显示/隐藏
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

// 表单验证
const validateForm = () => {
  if (!formData.number) {
    ElMessage.error('请输入学号')
    return false
  }
  if (!formData.password) {
    ElMessage.error('请输入密码')
    return false
  }
  if (!isPassword(formData.password)) {
    ElMessage.error('密码格式不正确')
    return false
  }
  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    const res = await login({
      number: Number(formData.number),
      password: formData.password
    })

    console.log('登录响应:', res) // 添加调试日志查看完整响应

    if (res?.code === 200) {
      // 保存token (如果存在)
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token)
      } else {
        console.warn('登录响应中未找到token')
      }

      // 构建用户信息对象，确保有默认值
      const userInfo = res.data?.userInfo || {}

      // 创建一个包含必要字段的模拟用户信息
      const defaultUserInfo = {
        name: formData.number?.toString() || '用户',
        userId: formData.number?.toString() || '',
        number: formData.number || null,
        role: 'user',
        direction: '全栈方向',
        group: '未分组',
        period: '适应期第一周'
      }

      // 合并响应中的用户信息与默认信息
      const combinedUserInfo = { ...defaultUserInfo, ...userInfo }

      // 确保有用户ID
      if (!combinedUserInfo.userId && combinedUserInfo.number) {
        combinedUserInfo.userId = combinedUserInfo.number.toString()
      }

      // 保存合并后的用户信息
      localStorage.setItem('userInfo', JSON.stringify(combinedUserInfo))
      console.log('保存的用户信息:', combinedUserInfo)

      ElMessage.success('登录成功')

      // 根据用户角色跳转
      const role = combinedUserInfo.role || 'user'
      if (role === 'admin') {
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
