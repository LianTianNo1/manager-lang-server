const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
  roleName: String,
  remark: String,
  permissionList: {
    checkedKeys: [],
    halfCheckedKeys: [],
  },
  updateTime: {
    type: Date,
    default: Date.now(),
  },
  createTime: {
    type: Date,
    default: Date.now(),
  },
})

module.exports = mongoose.model('roles', userSchema)
