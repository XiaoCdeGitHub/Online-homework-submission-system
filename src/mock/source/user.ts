// /*
//  * @Author: cuiding 1692338302@qq.com
//  * @Date: 2024-06-20 06:22:32
//  * @LastEditors: cuiding 1692338302@qq.com
//  * @LastEditTime: 2025-04-10 20:13:23
//  * @FilePath: /YunJiaoYunJi-master/src/mock/source/user.ts
//  * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
//  */

// // import { allUserList } from '../../data/admin'
// export default [
//   {
//     url: '/api/getUserInfo', // 注意，这里只能是string格式
//     method: 'get',
//     response: () => {
//       return {

//           data: allUserList

//       }
//     }
//   },
//   {
//     url: '/api/admin/selectCondition',
//     method: 'post',
//     response: () => {
//       function generateRandomNumbers(n:number) {
//         let numbers = [];
//         // 生成0到n的所有数字
//         for (var i = 0; i <= n; i++) {
//           numbers.push(i);
//         }
//         let randomNumbers = [];
//         // 随机选择5个数字
//         for (let j = 0; j < 5; j++) {
//           let randomIndex = Math.floor(Math.random() * numbers.length);
//           let randomNumber = numbers[randomIndex];
//           // 将选中的数字添加到结果数组中
//           randomNumbers.push(randomNumber);
//           // 从原始数组中移除已选中的数字，确保不会重复选择
//           numbers.splice(randomIndex, 1);
//         }
//         return randomNumbers;
//       }

//       // 生成5个0到n的不重复随机数
//       let randomNumbers = generateRandomNumbers(allUserList.length);
//       // console.log(randomNumbers);
//       const result = [];
//       for (let i = 0; i < randomNumbers.length; i++){
//         result.push(allUserList[randomNumbers[i]]);
//       }
//       return {
//         "code": 200,
//         "data": result,
// 	      "message": ""
//       }
//     }
//   }
// ]

