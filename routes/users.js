/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require('./../models/userSchema')
//  之前封装的util用来返回信息
const util = require('./../utils/util')
const log4js = require('./../utils/log4js')
// 引入jwt
const jwt = require('jsonwebtoken')
router.prefix('/users')

// 用户登录
router.post('/login', async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body
    log4js.info('ctx.request.body --- 》', ctx.request.body)
    log4js.info('userName, userPwd --- 》', userName, userPwd)
    const res = await User.findOne({
      userName,
      userPwd,
    })
    log4js.info('res  --- 》', res)
    // 用户真正的信息
    data = res._doc
    // 使用用户的信息来生成token
    const token = jwt.sign(
      {
        data: data,
      },
      // 'lang'可以自己加
      'lang',
      // expiresIn 过期时间
      { expiresIn: Math.floor(Date.now() / 1000) + 60 * 60 }
    )
    // log4js.info('token  --- 》', token)
    if (res) {
      data.token = token
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail('账号或密码不正确')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

module.exports = router
