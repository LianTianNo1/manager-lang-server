const router = require('koa-router')()
const util = require('../utils/util')
const Menu = require('../models/menuSchema')

router.prefix('/menu')

// 菜单列表查询
router.get('/list', async (ctx) => {
  const { menuName, menuState } = ctx.request.query
  const params = {}
  if (menuName) params.menuName = menuName
  if (menuState) params.menuState = menuState
  let rootList = (await Menu.find(params)) || []
  const permissionList = util.getTreeMenu(rootList, null, [])
  ctx.body = util.success(permissionList)
})

// 菜单编辑、删除、新增功能
router.post('/operate', async (ctx) => {
  // action是具体的操作
  const { _id, action, ...params } = ctx.request.body
  // info对应不同的信息
  let res, info
  try {
    if (action == 'add') {
      // 上次使用过new创建，还需要save这次使用 create(参数) 方便
      res = await Menu.create(params)
      info = '创建成功'
    } else if (action == 'edit') {
      // 更新下时间
      params.updateTime = new Date()
      // 第一个是查找条件，第二个是修改的参数，这里直接用传过来的参数直接覆盖
      res = await Menu.findByIdAndUpdate(_id, params)
      info = '编辑成功'
    } else {
      // 删除这个菜单后，得把他的所有子菜单也删除
      res = await Menu.findByIdAndRemove(_id)
      await Menu.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router
