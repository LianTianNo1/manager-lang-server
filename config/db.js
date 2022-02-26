/**
 * 数据库连接
 */
const mongoose = require('mongoose')
// 导入配置文件
const config = require('./index')
// 导入二次封装的log4js
const log4js = require('./../utils/log4js')

// 进行连接
mongoose.connect(config.URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// 获取到连接
const db = mongoose.connection

db.on('error', () => {
  log4js.error('***数据库连接失败***')
})

db.on('open', () => {
  log4js.info('---数据库连接成功---')
})
