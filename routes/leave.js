/**
 * 申请管理模块
 */
const router = require('koa-router')()
const Leave = require('../models/leaveSchema')
const Dept = require('../models/deptSchema')
const util = require('../utils/util')
router.prefix('/leave')

// 查询申请列表
router.get('/list', async (ctx) => {
  // 拿到申请状态 和 类型
  const { applyState, type } = ctx.request.query
  // 进行分页
  const { page, skipIndex } = util.pager(ctx.request.query)
  // 获取token 然后下面解密
  let authorization = ctx.request.headers.authorization
  // 使用我们之前的封装的解密 token 然后拿到用户的数据
  let { data } = util.decoded(authorization)
  try {
    let params = {}
    if (type == 'approve') {
      // applyState 审核状态不为 0
      if (applyState == 1 || applyState == 2) {
        // 当前的审批人就是自己
        params.curAuditUserName = data.userName
        // 审批状态 是1 或者 2
        params.$or = [{ applyState: 1 }, { applyState: 2 }]
      } else if (applyState > 2) {
        // 'auditFlows.userId': data.userId 审批人里面必须包括我
        params = { 'auditFlows.userId': data.userId, applyState }
      } else {
        params = { 'auditFlows.userId': data.userId }
      }
    } else {
      // 如果是申请的话就是查询自己申请列表 申请人id
      params = {
        'applyUser.userId': data.userId,
      }
      // applyState 审核状态不为 0
      if (applyState) params.applyState = applyState
    }
    // 查询
    const query = Leave.find(params)
    // 分页
    const list = await query.skip(skipIndex).limit(page.pageSize)
    // 获取总条数
    const total = await Leave.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})

router.get('/count', async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  try {
    let params = {}
    params.curAuditUserName = data.userName
    params.$or = [{ applyState: 1 }, { applyState: 2 }]
    const total = await Leave.countDocuments(params)
    ctx.body = util.success(total)
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`)
  }
})

router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body
  // 解密出用户的数据
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)

  if (action == 'add') {
    // 生成申请单号 前缀 + 时间 + 条数
    let orderNo = 'TL'
    orderNo += util.formateDate(new Date(), 'yyyyMMdd')
    const total = await Leave.countDocuments()
    params.orderNo = orderNo + total

    // 获取用户当前部门ID
    let id = data.deptId.pop()
    // 查找负责人信息
    let dept = await Dept.findById(id)
    // 获取人事部门和财务部门负责人信息
    let userList = await Dept.find({
      deptName: { $in: ['人事部门', '财务部门'] },
    })
    // 部门的负责人
    let auditUsers = dept.userName
    // 审批流 负责人信息
    let auditFlows = [
      {
        userId: dept.userId,
        userName: dept.userName,
        userEmail: dept.userEmail,
      },
    ]
    // 遍历人事部门和财务部门负责人 添加到 审批流中
    userList.map((item) => {
      auditFlows.push({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
      })
      // 拼接审批人
      auditUsers += ',' + item.userName
    })

    // 拼装参数
    params.auditUsers = auditUsers // 所有的审批人
    params.curAuditUserName = dept.userName //当前的审批人的姓名 也就是 当前部门的用户名
    params.auditFlows = auditFlows // 审批流 所有的审批人的信息
    params.auditLogs = [] //审批日志
    params.applyUser = {
      //申请人信息
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
    }

    // 直接使用 create 创建
    let res = await Leave.create(params)
    ctx.body = util.success('', '创建成功')
  } else {
    // 不是添加就是 废除当前申请，不是真正的删除 而是修改它的申请状态
    let res = await Leave.findByIdAndUpdate(_id, { applyState: 5 })
    ctx.body = util.success('', '操作成功')
  }
})

router.post('/approve', async (ctx) => {
  // remark 备注， _id 用户id
  const { action, remark, _id } = ctx.request.body
  // 通过token解密出用户的其他信息
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let params = {}
  try {
    // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
    let doc = await Leave.findById(_id)
    let auditLogs = doc.auditLogs || []
    if (action == 'refuse') {
      params.applyState = 3
    } else {
      // 审核通过
      if (doc.auditFlows.length == doc.auditLogs.length) {
        ctx.body = util.success('当前申请单已处理，请勿重复提交')
        return
      } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
        params.applyState = 4
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2
        params.curAuditUserName =
          doc.auditFlows[doc.auditLogs.length + 1].userName
      }
    }
    // 添加日志
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark,
      action: action == 'refuse' ? '审核拒绝' : '审核通过',
    })
    // 拼装参数 然后 修改
    params.auditLogs = auditLogs
    let res = await Leave.findByIdAndUpdate(_id, params)
    ctx.body = util.success('', '处理成功')
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`)
  }
})

module.exports = router
