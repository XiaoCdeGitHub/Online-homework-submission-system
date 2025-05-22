 // 密码验证：8-20位，包含数字和字母
export const isPassword = (password: string): boolean => {
    const reg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/
    return reg.test(password)
  }