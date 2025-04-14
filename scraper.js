const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");

puppeteer.use(StealthPlugin());

async function scrapeKSL(query) {
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
  const searchUrl = `https://ksl.com/classifieds/search?keyword=${encodeURIComponent(query)}`;

  await page.goto(searchUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  const listings = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".listing-item-info"));

    return cards.map(card => {
      const title = card.querySelector("a.listing-title")?.innerText.trim() || null;
      const price = card.querySelector(".listing-price")?.innerText.replace("$", "").trim() || null;
      const location = card.querySelector(".listing-stats li:first-child")?.innerText.trim() || null;
      const datePosted = card.querySelector(".listing-stats li:last-child")?.innerText.trim() || null;
      const listingUrl = card.querySelector("a.listing-title")?.href || null;
      const imageUrl = card.parentElement?.querySelector("img")?.src || null;

      return { title, price, location, datePosted, listingUrl, imageUrl };
    });
  });

  await browser.close();
  return listings;
}

module.exports = scrapeKSL;
