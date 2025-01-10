const puppeteer = require("puppeteer");

(async () => {
   const browser = await puppeteer.launch();
   const page = await browser.newPage();

   // Prejdite na stránku
   await page.goto("https://pc.bazos.sk");

   // Získanie cookies
   const cookies = await page.cookies();
   console.log("Cookies:", cookies);

   // Vytvorte reťazec pre hlavičku Cookie
   const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
   console.log("Cookie header:", cookieHeader);

   await browser.close();
})();
