const $ = require('cheerio')
const puppeteer = require('puppeteer')
class job {
  id: string
  detailUrl: string
  s1: string
  s2: string
  s3: string
  s4: string
  s5: string
  title: string
  detail: string
}
export async function crawlerYuanjisong(): Promise<job[]> {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true, headless: true, slowMo: 250, timeout: 0 })
  const jobs: job[] = []
  // 使用 try catch 捕获异步中的错误进行统一的错误处理
  try {
    const page = await browser.newPage()
    await page.setJavaScriptEnabled(true)
    await page.goto('https://www.yuanjisong.com/job/allcity/ui/zxfb')
    await handleListData()
    page.close()
    async function handleListData() {
      //等待元素加载之后，否则获取不异步加载的元素
      await page.waitForSelector('.db')
      const html = await page.content()
      const jobDom = $('.weui_panel', html)
      console.log('开始抓取数据...')
      for (let i = 1; i <= 2; i++) {
        const job = $(jobDom[i - 1])
        const detailUrl = $(job.find('.media_desc_content_adapt')).attr('href')
        const detailInfo = await handleDetailData(detailUrl)
        const j: any = {
          id: detailUrl.split('job/')[1],
          detailUrl,
          ...detailInfo,
        }
        jobs.push(j)
      }
      console.log('jobs', JSON.stringify(jobs), jobs.length)
      return jobs
    }
    async function handleDetailData(detailUrl) {
      const page2 = await browser.newPage()
      await page2.setJavaScriptEnabled(true)
      await page2.goto(detailUrl)

      await page2.waitForSelector('.detail_main') //等待元素加载之后，否则获取不异步加载的元素
      const htmlDetail = await page2.content()
      const title = $($(htmlDetail).find('.cv-title > h2')).text()
      const detail = $($(htmlDetail).find('.mobmid > div > p')).text()
      const social = {}
      $(htmlDetail)
        .find('.basic_info_title')
        .each(function (i, elem) {
          social[`s${i}`] = $(elem).next().text()
        })
      page2.close()
      return {
        title,
        detail,
        ...social,
      }
    }
    await browser.close()
    console.log('抓取结束')
  } catch (error) {
    // 出现任何错误，打印错误消息并且关闭浏览器
    console.log('catch', error)
    await browser.close()
  } finally {
    // 最后要退出进程
    process.exit(0)
  }
}
