/**
 * 日志存储
 * @author lang
 */
const log4js = require('log4js')

// 定义等级字典
const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL,
}

// 配置在npm 去复制
log4js.configure({
  appenders: {
    // 打印方式console直接在控制台打印,没有使用stdout
    console: { type: 'console' },
    // 普通日志写入文件
    info: {
      type: 'file',
      filename: 'logs/all-logs.log',
    },
    // 错误日志写入按照时间来的文件
    error: {
      type: 'dateFile',
      filename: 'logs/log', //文件名
      pattern: 'yyyy-MM-dd.log', //规则
      alwaysIncludePattern: true, // 设置文件名称为 filename + pattern
    },
  },
  // 分类
  categories: {
    // 默认等级是debug
    default: { appenders: ['console'], level: 'debug' },
    // 普通等级 包括控制台 和 info日志文件
    info: {
      appenders: ['info', 'console'],
      level: 'info',
    },
    // 错误等级 包括控制台 和 error日志文件
    error: {
      appenders: ['error', 'console'],
      level: 'error',
    },
  },
})

/**
 * 日志输出，level为debug
 * @param {string} content
 */
exports.debug = (content) => {
  let logger = log4js.getLogger()
  logger.level = levels.debug
  logger.debug(content)
}

/**
 * 日志输出，level为info
 * @param {string} content
 */
exports.info = (content) => {
  let logger = log4js.getLogger('info')
  logger.level = levels.info
  logger.info(content)
}

/**
 * 日志输出，level为error
 * @param {string} content
 */
exports.error = (content) => {
  let logger = log4js.getLogger('error')
  logger.level = levels.error
  logger.error(content)
}
