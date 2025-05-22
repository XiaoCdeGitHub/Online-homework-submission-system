/*
 * @Author: cuiding cuiding@kingsoft.com
 * @Date: 2024-06-20 06:22:32
 * @LastEditors: cuiding cuiding@kingsoft.com
 * @LastEditTime: 2025-05-22 17:38:22
 * @FilePath: /YunJiaoYunJi-master/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const app = createApp(App);
app.use(ElementPlus, {
  locale: zhCn,
});
app.use(createPinia());
app.use(router);
app.mount('#app');
