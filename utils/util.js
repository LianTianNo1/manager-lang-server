/**
 * 通用工具函数
 * @author lang
 */
// 导入之前封装的log4js用来打印错误和信息并写入文件
const log4js = require('./log4js')
const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001, // 参数错误
  USER_ACCOUNT_ERROR: 20001, //账号或密码错误
  USER_LOGIN_ERROR: 30001, // 用户未登录
  BUSINESS_ERROR: 40001, //业务请求失败
  AUTH_ERROR: 500001, // 认证失败或TOKEN过期
}
module.exports = {
  /**
   * 分页结构封装
   * @param {number} pageNum
   * @param {number} pageSize
   */
  pager({ pageNum = 1, pageSize = 10 }) {
    // 这样做是 ‘123’*1 = 123
    pageNum *= 1
    pageSize *= 1
    // 计算页面的从第几个开始 （2-1）*10,说明每页10个第二页是从第10个开始
    const skipIndex = (pageNum - 1) * pageSize
    return {
      page: {
        pageNum,
        pageSize,
      },
      skipIndex,
    }
  },
  success(data = '', msg = '', code = CODE.SUCCESS) {
    log4js.debug(data)
    return {
      code,
      data,
      msg,
    }
  },
  fail(msg = '', code = CODE.BUSINESS_ERROR, data = '') {
    log4js.debug(msg)
    return {
      code,
      data,
      msg,
    }
  },
  CODE,
}
