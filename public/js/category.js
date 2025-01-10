let stopFlag = false;
let currentPage = 0;
let totalParsed = 0;
let category_url;

const startParsing = async () => {
   document.getElementById("startParsing").disabled = true;
   document.getElementById("stopParsing").disabled = false;
   document.getElementById("continueParsing").disabled = true;
   document.getElementById("status").textContent = "Stav : parsovanie spustené ▼";
   stopFlag = false;

   while (!stopFlag) {
      const url = `${category_url}${currentPage > 0 ? currentPage * 20 + "/" : ""}`;
      try {
         const response = await fetch(`/products?url=${encodeURIComponent(url)}`);
         if (!response.ok) throw new Error("Failed to fetch products");

         const products = await response.json();
         if (products.length === 0) {
            document.getElementById("status").textContent = "Stav : všetky produkty boli vyparsované ◄";
            break;
         }

         const productTable = document.getElementById("productTable");

         for (const productUrl of products) {
            try {
               const productResponse = await fetch(`/product-info?url=${encodeURIComponent(productUrl)}`);
               if (!productResponse.ok) throw new Error(`Failed to fetch product info for ${productUrl}`);

               const productData = await productResponse.json();

               // Add rows for each attribute, including productName
               addTableRow(productTable, `<b>${totalParsed + 1}</b>`, `<a href="${productUrl}" target="_blank">${productUrl}</a>`);
               addTableRow(productTable, "", `<b>${productData.productName || "N/A"}</b>`);
               addTableRow(productTable, "", `Predajca: ${productData.name || "N/A"}`);
               addTableRow(productTable, "", `Lokalita: ${productData.location || "N/A"}`);
               addTableRow(productTable, "", `Cena: ${productData.price || "N/A"}`);
               addTableRow(productTable, "", `Počet zhladnutí: ${productData.views || "N/A"}`);
               addTableRow(productTable, "", `${productData.description || "N/A"}`);

               totalParsed++;
               document.getElementById("totalParsed").textContent = totalParsed;
            } catch (error) {
               console.error(`Error fetching product info for ${productUrl}:`, error);
            }
         }
         currentPage++;
      } catch (error) {
         document.getElementById("status").textContent = `Status: Error on page ${currentPage}`;
         console.error("Error parsing category:", error);
         break;
      }
   }
};

const addTableRow = (table, indexContent, cellContent) => {
   const row = document.createElement("tr");
   row.innerHTML = `
        <td>${indexContent}</td>
        <td>${cellContent}</td>
    `;
   table.appendChild(row);
   document.getElementById("downloadTable").disabled = false;
};

const stopParsing = () => {
   stopFlag = true;
   document.getElementById("stopParsing").disabled = true;
   document.getElementById("continueParsing").disabled = false;
   document.getElementById("status").textContent = "Stav : pauza";
};

const continueParsing = () => {
   document.getElementById("stopParsing").disabled = false;
   document.getElementById("continueParsing").disabled = true;
   document.getElementById("status").textContent = "Status: Continuing parsing...";
   startParsing();
};

document.getElementById("startParsing").addEventListener("click", startParsing);
document.getElementById("stopParsing").addEventListener("click", stopParsing);
document.getElementById("continueParsing").addEventListener("click", continueParsing);

document.addEventListener("DOMContentLoaded", async () => {
   const subdomainNavElement = document.getElementById("subdomain");
   const categoryNavElement = document.getElementById("category");
   const params = new URLSearchParams(window.location.search);
   const url = params.get("url");
   const subdomain = params.get("subdomain");
   const name = params.get("name");
   const categoryName = params.get("category-name");
   categoryNavElement.innerText = categoryName;
   subdomainNavElement.innerText = name;
   subdomainNavElement.href = `/subdomain?url=${encodeURIComponent(subdomain)}&name=${encodeURIComponent(name)}`;
   category_url = (subdomain + url.slice(1)).replace(/\s+/g, "");
   console.log(category_url);
});

//export
// Export tabuľky do JSON, TXT alebo CSV
const exportTable = (format) => {
   const rows = Array.from(document.querySelectorAll("#productTable tr"));
   const data = rows.map((row) => Array.from(row.cells).map((cell) => cell.innerText.trim()));

   if (format === "json") {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, "tabulka_inzeratov.json", "application/json");
   } else if (format === "txt") {
      const txt = data.map((row) => row.join("\t")).join("\n");
      downloadFile(txt, "tabulka_inzeratov.txt", "text/plain");
   } else if (format === "csv") {
      const csv = data.map((row) => row.join(",")).join("\n");
      downloadFile(csv, "tabulka_inzeratov.csv", "text/csv");
   }
};

// Funkcia na stiahnutie súboru
const downloadFile = (content, filename, mimeType) => {
   const blob = new Blob([content], { type: mimeType });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
};

// Kopírovanie tabuľky do schránky
const copyTableToClipboard = () => {
   const rows = Array.from(document.querySelectorAll("#productTable tr"));
   const text = rows
      .map((row) =>
         Array.from(row.cells)
            .map((cell) => cell.innerText.trim())
            .join("\t")
      )
      .join("\n");

   navigator.clipboard
      .writeText(text)
      .then(() => {
         alert("Tabuľka bola skopírovaná do schránky.");
      })
      .catch((error) => {
         console.error("Kopírovanie zlyhalo:", error);
      });
};

// Event listenery pre modálne tlačidlá
document.getElementById("exportJSON").addEventListener("click", () => {
   exportTable("json");
   bootstrap.Modal.getInstance(document.getElementById("exportModal")).hide();
});

document.getElementById("exportTXT").addEventListener("click", () => {
   exportTable("txt");
   bootstrap.Modal.getInstance(document.getElementById("exportModal")).hide();
});

document.getElementById("exportCSV").addEventListener("click", () => {
   exportTable("csv");
   bootstrap.Modal.getInstance(document.getElementById("exportModal")).hide();
});

// Zobrazovanie modálu po kliknutí na tlačidlo Stiahnuť tabuľku
document.getElementById("downloadTable").addEventListener("click", () => {
   const exportModal = new bootstrap.Modal(document.getElementById("exportModal"));
   exportModal.show();
});

// Pridanie funkcie na kopírovanie tabuľky
document.getElementById("copyTable").addEventListener("click", copyTableToClipboard);
