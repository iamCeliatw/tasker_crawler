const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { sendTelegramMessage } = require('./notifier')

// 設定要爬取的多個 BASE_URL
const BASE_URLS = [
  'https://www.tasker.com.tw/case/list?ca=dRL',
  'https://www.tasker.com.tw/case/list?ca=Brg',
]
const MAX_PAGES = 5 // 每個類別要爬取的總頁數
const KEYWORDS = ['Vue', 'Nuxt', '前端', 'React', 'JavaScript', '切版']

/**
 * 爬取 Tasker 案件
 * @returns {Promise<Array>} 爬取到的案件列表
 */
async function scrapeTasker() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
  )

  let allJobs = []

  // 遍歷每個 `BASE_URL`
  for (const baseUrl of BASE_URLS) {
    for (let i = 1; i <= MAX_PAGES; i++) {
      const url = `${baseUrl}&page=${i}`
      console.log(`🔍 正在爬取 ${url} ...`)

      await page.goto(url, { waitUntil: 'networkidle2' })

      try {
        // 等待案件列表加載
        await page.waitForSelector('h2.case_card_caseTit__2NM7e', {
          timeout: 10000,
        })

        // 爬取該頁面的所有案件
        const jobs = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll('h2.case_card_caseTit__2NM7e')
          ).map((job) => ({
            title: job.innerText.trim(),
            link: job.closest('a') ? job.closest('a').href : '未提供',
          }))
        })

        console.log(`📊 找到 ${jobs.length} 個案件`)
        allJobs.push(...jobs)
      } catch (error) {
        console.error(`❌ ${url} 爬取失敗，可能沒有更多案件`)
        break // 如果當前頁面沒有案件，直接跳過後面的頁面
      }
    }
  }

  await browser.close()

  console.log(`📊 總共爬取 ${allJobs.length} 個案件`)

  // 過濾符合關鍵字的案件
  const filteredJobs = allJobs.filter((job) =>
    KEYWORDS.some((keyword) => job.title.includes(keyword))
  )

  console.log(`🔎 符合條件的案件數量: ${filteredJobs.length}`)

  if (filteredJobs.length > 0) {
    // 讀取已通知的案件
    const notifiedJobsFile = path.join(__dirname, 'notified_jobs.json')
    let notifiedJobs = []

    if (fs.existsSync(notifiedJobsFile)) {
      notifiedJobs = JSON.parse(fs.readFileSync(notifiedJobsFile))
    }

    // 找出新案件（還沒通知過的）
    const newJobs = filteredJobs.filter(
      (job) => !notifiedJobs.includes(job.link)
    )

    if (newJobs.length > 0) {
      console.log(`✅ 找到 ${newJobs.length} 筆新案件，發送通知...`)

      const message = newJobs
        .map((job) => `📌 ${job.title}\n🔗 [查看案件](${job.link})\n`)
        .join('\n')

      await sendTelegramMessage(message)

      // 更新已通知的案件
      notifiedJobs.push(...newJobs.map((job) => job.link))
      fs.writeFileSync(notifiedJobsFile, JSON.stringify(notifiedJobs, null, 2))
    } else {
      console.log('📭 沒有新的案件需要通知')
    }
  } else {
    console.log('❌ 沒有找到符合條件的案件')
  }
}

module.exports = scrapeTasker
