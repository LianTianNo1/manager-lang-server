const mongoose = require('mongoose')
const leaveSchema = mongoose.Schema({
  // 编号
  orderNo: String,
  // 申请类型
  applyType: Number,
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: Date.now },
  // 申请人信息
  applyUser: {
    userId: String,
    userName: String,
    userEmail: String,
  },
  // 假期时间
  leaveTime: String,
  // 原因
  reasons: String,
  // 审批人
  auditUsers: String,
  // 当前审批人
  curAuditUserName: String,
  // 审批流
  auditFlows: [
    {
      userId: String,
      userName: String,
      userEmail: String,
    },
  ],
  // 审批日志
  auditLogs: [
    {
      userId: String,
      userName: String,
      createTime: Date,
      remark: String,
      action: String,
    },
  ],
  // 审批状态
  applyState: { type: Number, default: 1 },
  // 创建时间
  createTime: { type: Date, default: Date.now },
})

module.exports = mongoose.model('leaves', leaveSchema, 'leaves')
