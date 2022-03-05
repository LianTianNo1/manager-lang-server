/**
 * 用户管理模块
 */
const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')
router.prefix('/roles')

// 查询所有角色列表
router.get('/allList', async (ctx) => {
  try {
    // 只返回 _id 和 角色名称
    const list = await Role.find({}, '_id roleName')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`)
  }
})

// 按页获取角色列表
router.get('/list', async (ctx) => {
  // 获取前端进来的参数
  const { roleName } = ctx.request.query
  // 通过自己封装的工具来计算分页 page: {total, pageNum}  , skipIndex
  const { page, skipIndex } = util.pager(ctx.request.query)
  try {
    let params = {}
    if (roleName) params.roleName = roleName
    // 根据角色名来进行查询结果
    const query = Role.find(params)
    // 对查询的结果进行分页处理
    const list = await query.skip(skipIndex).limit(page.pageSize)
    // 不通过统计长度，浪费性能，而是通过 conutDocuments 来获取长度
    const total = await Role.countDocuments(params)

    ctx.body = util.success({
      list,
      page: {
        ...page,
        total,
      },
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败：${error.stack}`)
  }
})

// 角色操作：创建、编辑和删除
router.post('/operate', async (ctx) => {
  // action是具体的操作方式
  const { _id, roleName, remark, action } = ctx.request.body
  // info是具体不同的操作返回的信息
  let res, info
  try {
    if (action == 'add') {
      // 直接通过 create 进行创建 或者使用 new 来然后 new 的话，需要save
      res = await Role.create({ roleName, remark })
      info = '创建成功'
    } else if (action == 'edit') {
      // 编辑的话必须传入 _id
      if (_id) {
        // 组合参数 roleName 和 remark
        let params = { roleName, remark }
        // 更新一下时间
        params.update = new Date()
        // 根据ID来更新信息
        res = await Role.findByIdAndUpdate(_id, params)
        info = '编辑成功'
      } else {
        ctx.body = util.fail('缺少参数params: _id')
        return
      }
    } else {
      // 这个是删除操作也必须是传入_id
      if (_id) {
        res = await Role.findByIdAndRemove(_id)
        info = '删除成功'
      } else {
        ctx.body = util.fail('缺少参数params: _id')
        return
      }
    }
    ctx.body = util.success(res, info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 权限设置
router.post('/update/permission', async (ctx) => {
  // 选中_id 和 permissionList : {checkedKeys 选中的子菜单,  halfCheckedKeys 半选的父菜单 }
  const { _id, permissionList } = ctx.request.body
  try {
    // 组装参数 顺便更新一下时间
    let params = { permissionList, update: new Date() }
    let res = await Role.findByIdAndUpdate(_id, params)
    ctx.body = util.success('', '权限设置成功')
  } catch (error) {
    ctx.body = util.fail('权限设置失败')
  }
})
module.exports = router
