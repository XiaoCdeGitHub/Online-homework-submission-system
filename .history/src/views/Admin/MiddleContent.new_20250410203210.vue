<template>
    <div class="admin-content-middle">
        <div class="middle-header">
            <div class="top-left-part">
                <div class="morning-user">
                    <div class="user-photo">
                        <img src="https://cd-mapbed.oss-cn-beijing.aliyuncs.com/preview.gif" alt="" />
                    </div>
                    <p>早上好，{{ userName }}!</p>
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
        </div>

        <p class="tip-title">用户注册申请&nbsp;&nbsp;<span>User Registration Application</span></p>

        <div class="middle-body">
            <div class="body-header">
                <div class="search-box-part" @keyup.enter="applySearch()">
                    <div id="cover">
                        <div class="tb">
                            <div class="td">
                                <input type="text" placeholder="name" v-model="applyName" required />
                            </div>
                            <div class="td" id="s-cover">
                                <button type="text" @click="applySearch()">
                                    <div id="s-circle"></div>
                                    <span></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="group-checkbox">
                    <el-select v-model="value1" placeholder="请选择">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                        </el-option>
                    </el-select>
                </div>
            </div>

            <div class="application-list">
                <div class="application" :class="{ application_selected: selectedUsers.includes(item) }"
                    v-for="(item, index) in applyUserListShow" :key="index" @click="handleUserSelect(item)">
                    <div class="application-icon">
                        <el-avatar src="https://cd-mapbed.oss-cn-beijing.aliyuncs.com/preview.gif"></el-avatar>
                    </div>
                    <p style="margin-left: 3px; font-size: 13px">{{ item.name + '-' + item.direction }}</p>
                </div>
            </div>

            <div class="mbody-footer">
                <div class="all-check-button">
                    <el-tooltip effect="dark" content="点击以全选用户" placement="right">
                        <input type="checkbox" :checked="isAllSelected" @change="handleSelectAll" />
                    </el-tooltip>
                </div>
                <el-button class="check-button" text :loading="loading" :disabled="!selectedUsers.length"
                    @click="clickToApply">
                    <el-tooltip effect="dark" content="选中用户并点击此处提交" placement="right">✔</el-tooltip>
                </el-button>
            </div>
        </div>

        <!-- 删除用户部分保持不变 -->
        <p class="tip-title">删除用户&nbsp;&nbsp;<span>Delete user</span></p>
        <div class="middle-footer">
            <!-- ... 删除用户相关代码保持不变 ... -->
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { directionOptionList } from '../../data/admin'
import { getUserData, updateStatus, deleteUser } from '@/service/api/admin'

// 基础数据
const userName = ref('云子')
const options = directionOptionList
const value1 = ref('')
const value2 = ref('')
const applyName = ref('')
const deleteName = ref('')

// 用户列表数据
const allUserList = ref([])
const applyUserList = ref([])
const applyUserListShow = ref([])
const deleteUserList = ref([])
const deleteUserListShow = ref([])

// 选择和加载状态
const selectedUsers = ref([])
const loading = ref(false)

// 计算属性：是否全选
const isAllSelected = computed(() => {
    return applyUserListShow.value.length > 0 &&
        selectedUsers.value.length === applyUserListShow.value.length
})

// 处理单个用户选择
const handleUserSelect = (user) => {
    const index = selectedUsers.value.findIndex(u => u.id === user.id)
    if (index === -1) {
        selectedUsers.value.push(user)
    } else {
        selectedUsers.value.splice(index, 1)
    }
}

// 处理全选
const handleSelectAll = () => {
    if (isAllSelected.value) {
        selectedUsers.value = []
    } else {
        selectedUsers.value = [...applyUserListShow.value]
    }
}

// 审核通过功能
const clickToApply = async () => {
    if (!selectedUsers.value.length) {
        ElMessage.warning('请选择要审核的用户')
        return
    }

    try {
        loading.value = true
        const userIds = selectedUsers.value.map(user => user.id)

        const res = await updateStatus(userIds)

        if (res.code === 200) {
            ElMessage.success(res.message || '审核成功')
            await refreshUserList()
            selectedUsers.value = []
        } else {
            ElMessage.error(res.message || '审核失败')
        }
    } catch (error) {
        console.error('审核失败:', error)
        ElMessage.error('审核失败，请重试')
    } finally {
        loading.value = false
    }
}

// 刷新用户列表
const refreshUserList = async () => {
    try {
        const res = await getUserData()
        if (res.code === 200 && res.data) {
            allUserList.value = res.data

            // 更新待审核用户列表
            applyUserList.value = allUserList.value.filter(item => item.status === 0)
            applyUserListShow.value = applyUserList.value

            // 更新已审核用户列表
            deleteUserList.value = allUserList.value.filter(item => item.status === 1)
            deleteUserListShow.value = deleteUserList.value
        }
    } catch (error) {
        console.error('获取用户列表失败:', error)
        ElMessage.error('获取用户列表失败，请刷新页面重试')
    }
}

// 搜索功能
const applySearch = () => {
    if (!applyName.value) {
        ElMessage.error('请输入查询内容')
        return
    }

    const searchResult = applyUserList.value.filter(item =>
        item.name.toLowerCase().includes(applyName.value.toLowerCase())
    )

    if (searchResult.length > 0) {
        applyUserListShow.value = searchResult
    } else {
        ElMessage.error('未搜索到此人')
        applyUserListShow.value = applyUserList.value
    }
}

// 监听方向筛选
watch(value1, (newVal) => {
    if (newVal) {
        applyUserListShow.value = applyUserList.value.filter(item => item.direction === newVal)
    } else {
        applyUserListShow.value = applyUserList.value
    }
})

// 初始化
onMounted(async () => {
    await refreshUserList()
})
</script>

<style lang="less" scoped>
/* 保持原有样式不变 */
</style>