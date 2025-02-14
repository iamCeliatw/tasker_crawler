const schedule = require('node-schedule')
const scrapeTasker = require('./crawler')

console.log('⏳ 啟動每日爬取工作...')

schedule.scheduleJob('0 9 * * *', async () => {
  // 每天早上 9 點執行
  console.log('🚀 執行爬取 Tasker 網站...')
  await scrapeTasker()
})
