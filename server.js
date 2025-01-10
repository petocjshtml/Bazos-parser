const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Servírovanie statických súborov z priečinka public
app.use(express.static(path.join(__dirname, "public")));

// Endpoint pre koreňovú stránku (základná stránka)
app.get("/", (req, res) => {
   res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/subdomain", (req, res) => {
   const url = req.query.url;
   const name = req.query.name;
   if (!url) {
      return res.status(400).send("Subdomain parameter url is required");
   }
   if (!name) {
      return res.status(400).send("Subdomain parameter name is required");
   }
   res.sendFile(path.join(__dirname, "public", "subdomain.html"));
});

app.get("/category", (req, res) => {
   res.sendFile(path.join(__dirname, "public", "category.html"));
});

// Endpoint na získanie kategórií z bazos.sk
app.get("/domains", async (req, res) => {
   try {
      // Nastavenie hlavičiek pre požiadavku
      const headers = {
         Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
         "Accept-Encoding": "gzip, deflate, br, zstd",
         "Accept-Language": "sk,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
         "Cache-Control": "max-age=0",
         DNT: "1",
         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
         "Upgrade-Insecure-Requests": "1",
         "Sec-CH-UA": '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
         "Sec-CH-UA-Mobile": "?0",
         "Sec-CH-UA-Platform": '"Windows"',
         "Sec-Fetch-Dest": "document",
         "Sec-Fetch-Mode": "navigate",
         "Sec-Fetch-Site": "none",
         "Sec-Fetch-User": "?1",
      };

      // GET request na bazos.sk s hlavičkami
      const response = await axios.get("https://www.bazos.sk/", { headers });
      const html = response.data;

      // Parsovanie HTML pomocou cheerio
      const $ = cheerio.load(html);
      const domains = [];

      // Vyberáme elementy s kategóriami
      $(".icontblrow .icontblcell").each((index, element) => {
         const name = $(element).find(".nadpisnahlavni a").text().trim();
         const domain = $(element).find(".nadpisnahlavni a").attr("href");
         const image = $(element).find("img").attr("src");

         if (name && domain && image) {
            domains.push({
               name,
               domain,
               image: `https://www.bazos.sk${image}`, // Absolútna URL pre obrázok
            });
         }
      });

      // Nastavenie hlavičky a vrátenie JSON odpovede
      res.setHeader("Content-Type", "application/json");
      res.status(200).json(domains);
   } catch (error) {
      console.error("Chyba pri získavaní dát:", error.message);
      res.status(500).json({ error: "Nepodarilo sa načítať kategórie" });
   }
});

app.get("/categories", async (req, res) => {
   const url = req.query.url;

   if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
   }

   try {
      const response = await axios.get(url);
      const html = response.data;

      const $ = cheerio.load(html);
      const categories = [];

      // Vyparsovanie kategórií z triedy barvalmenu
      $(".barvalmenu .barvaleva a").each((index, element) => {
         const name = $(element).text().trim();
         const href = $(element).attr("href");

         // Vynechaj externé odkazy (obsahujúce http)
         if (href && !href.startsWith("http")) {
            categories.push({
               name,
               url: href,
            });
         }
      });

      res.json(categories);
   } catch (error) {
      console.error("Error fetching categories:", error.message);
      res.status(500).json({ error: "Failed to fetch categories" });
   }
});

app.get("/products", async (req, res) => {
   const url = req.query.url;

   if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
   }

   try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const baseUrl = new URL(url).origin; // Získa základnú URL (napr. https://deti.bazos.sk)
      const productUrls = [];

      $(".inzeratynadpis h2 a").each((_, element) => {
         const productUrl = $(element).attr("href");
         if (productUrl) {
            productUrls.push(`${baseUrl}${productUrl}`); // Kombinuje základnú URL s odkazom
         }
      });

      res.json(productUrls);
   } catch (error) {
      console.error("Error fetching products:", error.message);
      res.status(500).json({ error: "Failed to fetch products" });
   }
});

app.get("/product-info", async (req, res) => {
   const { url } = req.query;

   if (!url) {
      return res.status(400).send({ error: 'Missing "url" parameter' });
   }

   try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Extrakcia mena
      const name = $("tr td")
         .filter(function () {
            return $(this).text().trim() === "Meno:";
         })
         .next("td")
         .text()
         .trim();

      // Extrakcia lokality
      const location = $("tr td")
         .filter(function () {
            return $(this).text().trim() === "Lokalita:";
         })
         .next("td")
         .next("td")
         .text()
         .trim();

      // Extrakcia počtu zhliadnutí
      const viewsText = $("tr td")
         .filter(function () {
            return $(this).text().trim() === "Videlo:";
         })
         .next("td")
         .text()
         .trim();
      const views = viewsText.replace(/[^0-9]/g, ""); // Extrahovať len číslo

      // Extrakcia ceny
      const price = $("tr td")
         .filter(function () {
            return $(this).text().trim() === "Cena:";
         })
         .next("td")
         .find("b")
         .text()
         .trim();

      // Extrakcia popisného textu
      const description = $(".popisdetail").text().trim();

      // Extrakcia názvu produktu
      const productName = $(".inzeratydetnadpis h1").text().trim();

      // URL produktu
      const productUrl = url;

      const result = {
         name,
         location,
         views,
         price,
         description,
         productUrl,
         productName,
      };
      res.status(200).json(result);
   } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Failed to fetch or parse the page" });
   }
});

// Štart servera
app.listen(PORT, () => {
   console.log(`Server beží na http://localhost:${PORT}`);
});
