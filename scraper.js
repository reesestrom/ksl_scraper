const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrapeKSL(query) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  const searchUrl = `https://ksl.com/classifieds/search?keyword=${encodeURIComponent(query)}`;

  await page.goto(searchUrl, { waitUntil: "networkidle2" });

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
