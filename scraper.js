const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

async function scrapeKSL(query, city = null, state = null) {
  // ✅ Chrome executable fallback logic
  let chromePath = "/usr/bin/google-chrome";
  if (!fs.existsSync(chromePath)) {
    chromePath = "/usr/bin/google-chrome-stable"; // backup path
  }

  console.log("Launching Puppeteer at path:", chromePath); // ✅ DEBUG

  // ✅ Launch Puppeteer with the correct executable
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // ✅ Ensure query is safely encoded for URL
  const encodedQuery = encodeURIComponent(query || "");
  const encodedState = encodeURIComponent(state?.trim() || "UT");
  const searchUrl = `https://classifieds.ksl.com/search/keyword/${encodedQuery}/${encodedState}`;


  console.log("📡 Visiting search URL:", searchUrl);

  await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  const listings = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".listing-item"));

    return cards.map(card => {
      const titleEl = card.querySelector(".item-info-title a");
      const priceEl = card.querySelector(".item-info-price");
      const locationEl = card.querySelector(".item-address");
      const imageEl = card.querySelector("img");

      const title = titleEl?.innerText.trim() || null;
      const price = priceEl?.innerText.replace(/[^\d.]/g, "") || null;
      const locationRaw = locationEl?.innerText.trim() || null;

      // Split "Salt Lake City, UT | 3 Hours" into parts
      let location = null;
      let datePosted = null;
      if (locationRaw?.includes("|")) {
        [location, datePosted] = locationRaw.split("|").map(str => str.trim());
      } else {
        location = locationRaw;
      }

      const listingUrl = titleEl?.href || null;
      const imageUrl = imageEl?.src || null;

      return {
        title,
        price,
        location,
        datePosted,
        listingUrl,
        imageUrl
      };
    });
  });

  await browser.close();
  return listings;
}

module.exports = scrapeKSL;
