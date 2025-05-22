<!--
 * @Author: cuiding cuiding@kingsoft.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding cuiding@kingsoft.com
 * @LastEditTime: 2025-05-22 11:48:50
 * @FilePath: /YunJiaoYunJi-master/src/views/Admin/LeftInfoBar.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
// 提交作业发布表单
const submitPublishForm = async () => {
  // 表单验证
  if (!publishForm.timeRange || publishForm.timeRange.length !== 2) {
    ElMessage.error('请选择作业日期范围');
    return;
  }

  if (!publishForm.direction) {
    ElMessage.error('请选择方向');
    return;
  }

  if (!publishForm.weeks) {
    ElMessage.error('请选择周数');
    return;
  }

  if (!publishForm.file) {
    ElMessage.error('请上传作业文件');
    return;
  }

  if (!publishForm.notice) {
    ElMessage.error('请填写作业说明');
    return;
  }

  publishing.value = true;
  
  try {
    const [startTime, endTime] = publishForm.timeRange;
    
    // 解析周数 - 修复match不是一个函数的错误
    let weeksNumber = 1;
    
    // 检查weeks的类型和格式
    if (typeof publishForm.weeks === 'string') {
      // 如果是字符串，尝试从"第X周"格式提取数字
      const weeksMatch = publishForm.weeks.match(/第(\d+)周/);
      if (weeksMatch) {
        weeksNumber = parseInt(weeksMatch[1]);
      } else {
        // 尝试直接将字符串转为数字
        const parsedNum = parseInt(publishForm.weeks);
        if (!isNaN(parsedNum)) {
          weeksNumber = parsedNum;
        }
      }
    } else if (typeof publishForm.weeks === 'number') {
      // 如果已经是数字，直接使用
      weeksNumber = publishForm.weeks;
    } else if (publishForm.weeks.value) {
      // 处理可能是响应式对象的情况
      weeksNumber = parseInt(publishForm.weeks.value);
    }
    
    console.log('解析后的周数:', weeksNumber);

    // 创建FormData
    const formData = new FormData();
    formData.append('file', publishForm.file);
    formData.append('notice', publishForm.notice);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('weeks', weeksNumber);
    formData.append('direction', publishForm.direction);

    // 调用API发布作业
    const response = await publishHomework(formData);
    
    if (response.code === 200) {
      ElMessage.success('作业发布成功');
      
      // 保存到本地存储以兼容现有功能
      const work = {
        file: publishForm.file.name,
        startTime: startTime,
        endTime: endTime,
        notice: publishForm.notice,
        direction: publishForm.direction,
        weeks: publishForm.weeks,
      };
      localStorage.setItem('work', JSON.stringify(work));
      localStorage.setItem("jobTime", JSON.stringify(publishForm.timeRange));
      
      // 重置表单
      publishForm.notice = '';
      publishForm.timeRange = [];
      publishForm.file = null;
    } else {
      ElMessage.error(response.message || '作业发布失败');
    }
  } catch (error) {
    console.error('发布作业失败:', error);
    ElMessage.error('发布作业失败，请重试: ' + (error.message || '未知错误'));
  } finally {
    publishing.value = false;
  }
};