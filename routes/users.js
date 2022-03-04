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
    const res = await User.findOne(
      {
        userName,
        userPwd,
      },
      'userId userName userEmail state role deptId roleList'
    )
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
      // { expiresIn: Math.floor(Date.now() / 1000) + 60 * 60 } //根据当前时间来计算
      { expiresIn: '1h' }
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

// 用户列表
router.get('/list', async (ctx) => {
  // state是用户的状态 在职 ，离职 ，实习..
  const { userId, userName, state } = ctx.request.query
  // skipIndex 是跳过的索引y用来进行分页查询，page是一个对象包括pageNum,pageSize
  const { page, skipIndex } = util.pager(ctx.request.query)
  // 使用下面的params去mongodb查询数据
  let params = {}
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state != '0') params.state = state
  try {
    // 根据条件查询所有用户列表 把_id和userPwd不进行返回
    const query = User.find(params, { _id: 0, userPwd: 0 })
    // 分页后查询到的列表
    const list = await query.skip(skipIndex).limit(page.pageSize)
    // 使用Mongo的countDocuments API获取total条数，也可以使用 上面query来获取
    const total = await User.countDocuments(params)
    // 使用之前封装的util返回 pageNum,pageSize,total,分页查询列表
    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`)
  }
})
module.exports = router
