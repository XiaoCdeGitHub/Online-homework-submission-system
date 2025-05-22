<!--
 * 登录注册页面
 * @author: zsy
 * @since: 2024-01-17
 * Login.vue
-->
<template>
    <div class="container">
        <div class="bg">
            <div class="circle">
                <div class="form">
                    <div class="form-center">
                        <div class="form"></div>
                        <h1>注册 Sign Up Now</h1>
                        <div class="department">
                            <h3>部门 Department</h3>
                            <select v-model="formData.direction">
                                <option value="" selected>请选择部门</option>
                                <option value="开发">开发</option>
                                <option value="设计">设计</option>
                                <option value="秘书处">秘书处</option>
                            </select>
                            <img src="@/assets/img/signUp/xiala.png" alt="">
                        </div>
                        <div class="StuId">
                            <h3>学号 Student Id</h3>
                            <input type="number" v-model="formData.number" placeholder="请输入学号">
                            <img src="@/assets/img/signUp/学号.png" alt="StuId">
                        </div>
                        <div class="Name">
                            <h3>姓名 Name</h3>
                            <input type="text" v-model="formData.name" placeholder="请输入姓名">
                            <img src="@/assets/img/signUp/姓名.png" alt="Nm">
                        </div>
                        <div class="PWord">
                            <h3>密码 Password</h3>
                            <input :type="showPassword ? 'text' : 'password'" v-model="formData.password"
                                placeholder="请输入8-16位密码">
                            <img src="@/assets/img/signUp/passWord.png" alt="Pw" @click="togglePassword"
                                style="cursor: pointer;">
                        </div>
                        <div class="QQNum">
                            <h3>QQ号 QQ Number</h3>
                            <input type="text" v-model="formData.qqnum" placeholder="请输入QQ号">
                            <img src="@/assets/img/login/QQ2.png" alt="QQ">
                        </div>
                        <div class="group">
                            <h3>组别 Group</h3>
                            <select v-model="formData.group">
                                <option value="" selected>请选择组别</option>
                                <option value="第一组">第一组</option>
                                <option value="第二组">第二组</option>
                                <option value="第三组">第三组</option>
                                <option value="第四组">第四组</option>
                                <option value="第五组">第五组</option>
                            </select>
                            <img src="@/assets/img/signUp/xiala.png" alt="">
                        </div>
                        <input type="button" value="确认" class="confirm" @click="signUp()">
                        <h6 @click="toLogin">已有账号？去登录</h6>
                    </div>
                </div>
                <img src="@/assets/img/login/xiaoren1.png" alt="xiaoren1" class="xiaoren1">
                <img src="@/assets/img/login/xiaoren2.png" alt="xiaoren2" class="xiaoren2">
                <div class="footer"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/service/api/login'
import { isPassword } from '@/utils/check'

const router = useRouter()
const showPassword = ref(false)

const formData = reactive({
    direction: '',
    number: null as number | null,
    name: '',
    password: '',
    qqnum: '',  // QQ号
    group: ''   // 组别
})

// 切换密码显示/隐藏
const togglePassword = () => {
    showPassword.value = !showPassword.value
}

// 表单验证
const validateForm = () => {
    if (!formData.direction) {
        ElMessage.error('请选择部门')
        return false
    }
    if (!formData.number) {
        ElMessage.error('请输入学号')
        return false
    }
    if (!formData.name) {
        ElMessage.error('请输入姓名')
        return false
    }
    if (!formData.password) {
        ElMessage.error('请输入密码')
        return false
    }
    if (!isPassword(formData.password)) {
        ElMessage.error('密码必须为8-16位字母、数字或特殊字符')
        return false
    }
    if (!formData.qqnum) {
        ElMessage.error('请输入QQ号')
        return false
    }
    if (!formData.group) {
        ElMessage.error('请选择组别')
        return false
    }
    return true
}

const signUp = async () => {
    if (!validateForm()) return

    try {
        const res = await register({
            ...formData,
            number: Number(formData.number)
        })
        if (res.code === 200) {
            ElMessage.success('注册成功')
            router.push('/login')
        } else {
            ElMessage.error(res.message || '注册失败')
        }
    } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('注册失败，请稍后重试')
    }
}

const cancel = () => {
    router.push('/login')
}

const toLogin = () => {
    router.push('/login')
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
        height: 620px;
        /* 增加高度以适应添加的新选项 */
        width: 450px;
        margin: auto;
        background-color: #EFF4FF;
        z-index: 100;

        .form {
            /* 增加高度以适应添加的新选项 */
            width: 400px;
            margin: 0 auto;
            background-color: #3C66FD;
            border-radius: 20px;
            //box-shadow: 6px 6px 5px 5px #D7DDF8;

            //z-index:100;
            .form-center {
                width: 300px;
                height: 100%;
                margin-left: auto;
                margin-right: auto;
                //background-color: yellow;
                padding-top: 10px;
                position: relative;
                display: flex;
                flex-direction: column;

                .logo {
                    img {
                        width: 30px;
                        height: 20px;
                        margin-right: 10px;
                        // margin-top: 10px;
                    }

                    h5 {
                        padding-top: 3px;
                        font-family: sans-serif;
                    }

                    display: flex;
                    flex-direction: row;
                    color:white;
                    margin-bottom: 10px;
                    //margin-top: 10px;
                }

                h1 {
                    color: white;
                    font-family: sans-serif;
                    margin-top: 15px;
                    margin-bottom: 15px;
                }

                h3 {
                    // color: #6C6FA3;
                    color: white;
                    font-family: sans-serif;
                    margin-bottom: 5px;

                }

                h6 {
                    // color: #9393B9;
                    color: white;

                    //margin:auto 0;
                    font-family: sans-serif;
                    position: absolute;
                    left: 42%;
                }

                .department,
                .group {
                    position: relative;

                    select {
                        //border: solid 3px white;
                        padding-right: 20px;
                        width: 300px;
                        height: 38px;
                        -webkit-appearance: none;
                        -moz-appearance: none;
                        appearance: none;
                        margin-top: 5px;
                        margin-bottom: 5px;
                        border-radius: 10px;
                        border: solid 3px white;
                        background-color: #3C66FD;
                        //background: url("@/assets/img/signUp/xiala.png") no-repeat scroll right center transparent;
                    }

                    img {
                        position: absolute;
                        left: 85%;
                        top: 56%;
                        height: 15px;
                        width: 33px;
                    }

                    //select::-ms-expand {
                    //    display: none;
                    //}
                }

                .StuId,
                .QQNum {
                    position: relative;

                    input {
                        border: none;
                        width: 300px;
                        height: 35px;
                        margin-top: 5px;
                        margin-bottom: 5px;
                        border-radius: 10px;
                        border: solid 3px white;
                        background-color: #3C66FD;
                        transition: transform 0.2s;
                        /* 添加过渡效果 */
                    }

                    input:focus {
                        /* 点击时的放大效果 */
                        transform: scale(1.05);
                    }

                    img {
                        width: 35px;
                        height: 23px;
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
                        border: solid 3px white;
                        background-color: #3C66FD;
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
                        left: 87%;
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
                        border: solid 3px white;
                        background-color: #3C66FD;
                        transition: transform 0.2s;
                        /* 添加过渡效果 */
                    }

                    input:focus {
                        /* 点击时的放大效果 */
                        transform: scale(1.05);
                    }

                    img {
                        width: 22px;
                        height: 22px;
                        position: absolute;
                        left: 87%;
                        top: 54%;
                    }
                }

                .confirm {
                    border: none;
                    font-family: sans-serif;
                    border: none;
                    width: 300px;
                    height: 40px;
                    margin-top: 10px;
                    margin-bottom: 5px;
                    border-radius: 10px;
                    border: solid 3px white;
                    background: white;
                    color: #3C66FD;
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
                // position: absolute;
                width: 30px;
                height: 30px;
                background-color: red;
                margin-top: 15px;
                margin-right: 6px;
            }

        }

        .xiaoren1 {
            position: absolute;
            width: 200px;
            height: 260px;
            left: 330px;
            top: 44%;
            z-index: -1;
        }

        .xiaoren2 {
            position: absolute;
            width: 140px;
            height: 200px;
            left: 780px;
            top: 80px;
            z-index: -1;
        }

        .footer {
            height: 30px;
            width: 300px;
            margin: 0 auto;
            background-color: #ECEEEF;
            border-radius: 0 0 20px 20px;
            box-shadow: #C5C8E2 0 5px 5px 5px;
        }
    }
}
</style>
