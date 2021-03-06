const puppeteer = require("puppeteer");
const fs = require("fs");
const config = {
  url: "https://www.youtube.com/results?search_query=",
  keyword: ["thối nát", "đảng", "tội ác đảng", "cộng sản"],
};

async function autoScrollBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let timeEq = 0;
      let distance = 1000;
      let oldHeight = 0;
      let timer = setInterval(() => {
        window.scrollBy(distance, distance);
        const contentHeight = document.getElementsByClassName(
          "style-scope ytd-section-list-renderer"
        )[4].offsetHeight;
        if (oldHeight == contentHeight) timeEq++;
        else timeEq = 0;
        oldHeight = contentHeight;
        console.log(timeEq);
        if (timeEq >= 10) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

let dataCrawl = [];
const crawlPage = async (browser) => {
  for (let i = 0; i < config.keyword.length; i++) {
    const key = config.keyword[i];
    console.log("Crawl keyword:" + key);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto(`${config.url + key}`, {
      waitUntil: "networkidle2",
    });
    await page.evaluate(() => {
      document
        .getElementsByClassName(
          "style-scope ytd-toggle-button-renderer style-text"
        )[0]
        .click();
      document
        .getElementsByClassName("style-scope ytd-search-filter-renderer")[4]
        .click();
    });

    await autoScrollBottom(page);

    const res = await page.evaluate(() => {
      let arr = [];
      const videos = document.getElementsByClassName(
        "yt-simple-endpoint style-scope ytd-video-renderer"
      );
      console.log("total video: " + videos.length);
      for (let i = 0; i < videos.length; i++) {
        arr.push({ title: videos[i].textContent.trim(), url: videos[i].href });
      }
      return arr;
    });
    console.log(res.length);
    // dataCrawl.push({ keyword: key, data: res });
    await fs.writeFile(
      __dirname + "./crawl_data/" + new Date().toJSON() + "_" + key + ".json",
      JSON.stringify(res),
      console.log
    );
    console.log("saved file: " + key);
    await page.close();
  }
  return [];
};

puppeteer
  .launch({
    devtools: true,
    timeout: 0,
    // args: ["--no-sandbox"],
    // executablePath: "/usr/lib/chromium-browser/chromium-browser",
    // save: "",
  })
  .then(async (browser) => {
    const data = await crawlPage(browser);
  });
