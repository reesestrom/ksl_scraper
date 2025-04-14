const express = require("express");
const scrapeKSL = require("./scraper");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/ksl", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).send({ error: "Missing query parameter" });

  try {
    const results = await scrapeKSL(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to scrape KSL" });
  }
});

app.listen(PORT, () => console.log(`KSL scraper running on port ${PORT}`));
