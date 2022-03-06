/**
 * 用户管理模块
 */
const router = require('koa-router')()
const User = require('./../models/userSchema')
const Counter = require('./../models/counterSchema')
//  之前封装的util用来返回信息
const util = require('./../utils/util')
const log4js = require('./../utils/log4js')
// 引入jwt
const jwt = require('jsonwebtoken')
// 引入md5
const md5 = require('md5')

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
// 获取全量用户列表
router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({}, 'userId userName userEmail')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
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
// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body
  // 可以使用 $or 或者使用 $in
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  // updateMany第一个车参数是一个对象传入的查询条件 从数据库找出在待删除的userIds中的userId，第二个是修改状态把 他们修改成离职
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  console.log(res)
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`)
    return
  }
  ctx.body = util.fail('删除失败')
})

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  // 用户的字段
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action,
  } = ctx.request.body
  // 如果是新增操作需要判断用户名和用户邮箱是否传入了进来
  // 部门的传入 新增和更新都需要判断
  if (action == 'add') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return
    }
    // 查找是否数据库中有该数据 用户名或者邮箱相同 返回字段 _id userName userEmail
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      '_id userName userEmail'
    )
    if (res) {
      ctx.body = util.fail(
        `系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`
      )
    } else {
      // 这是个是维护自增ID的一个集合，比每次去获取所有的条数+1性能好
      const doc = await Counter.findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { sequence_value: 1 } },
        { new: true }
      )
      // console.log('doc--->', doc)
      try {
        // 创建用户，可以使用 create 也可以使用new
        const user = new User({
          // 自增id
          userId: doc.sequence_value,
          userName,
          // 密码先默认 123456 然后加密
          userPwd: md5('123456'),
          userEmail,
          role: 1, //默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile,
        })
        // 别忘了save() 这是最重要的
        user.save()
        // 不用返回给前端用户的数据
        ctx.body = util.success('', '用户创建成功')
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败')
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return
    }
    try {
      // 更新操作 找到对应的id,第二个是用来对象的赋值 mobile:mobile ===》 mobile
      const res = await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      )
      // console.log('更新结果', res)
      // 不能把用户的数据返回出去，这里返回空对象
      ctx.body = util.success({}, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败')
    }
  }
})
module.exports = router
