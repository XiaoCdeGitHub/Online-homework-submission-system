
import { allUserList } from '../../data/admin'
export default [
  {
    url: '/api/getUserInfo', // 注意，这里只能是string格式
    method: 'get',
    response: () => {
      return {

          data: allUserList

      }
    }
  },
  {
    url: '/api/admin/selectCondition',
    method: 'post',
    response: () => {
      function generateRandomNumbers(n:number) {
        let numbers = [];
        // 生成0到n的所有数字
        for (var i = 0; i <= n; i++) {
          numbers.push(i);
        }
        let randomNumbers = [];
        // 随机选择5个数字
        for (let j = 0; j < 5; j++) {
          let randomIndex = Math.floor(Math.random() * numbers.length);
          let randomNumber = numbers[randomIndex];
          // 将选中的数字添加到结果数组中
          randomNumbers.push(randomNumber);
          // 从原始数组中移除已选中的数字，确保不会重复选择
          numbers.splice(randomIndex, 1);
        }
        return randomNumbers;
      }

      // 生成5个0到n的不重复随机数
      let randomNumbers = generateRandomNumbers(allUserList.length);
      // console.log(randomNumbers);
      const result = [];
      for (let i = 0; i < randomNumbers.length; i++){
        result.push(allUserList[randomNumbers[i]]);
      }
      return {
        "code": 200,
        "data": result,
	      "message": ""
      }
    }
  }
]

