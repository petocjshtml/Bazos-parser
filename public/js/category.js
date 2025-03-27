let stopFlag = false;
let currentPage = 0;
let totalParsed = 0;
let category_url;
let originalData = [];

const startParsing = async () => {
  document.getElementById("startParsing").disabled = true;
  document.getElementById("stopParsing").disabled = false;
  document.getElementById("continueParsing").disabled = true;
  document.getElementById("status").textContent =
    "Stav : parsovanie spustené ▼";
  stopFlag = false;

  while (!stopFlag) {
    const url = `${category_url}${
      currentPage > 0 ? currentPage * 20 + "/" : ""
    }`;
    try {
      const response = await fetch(`/products?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const products = await response.json();
      if (products.length === 0) {
        document.getElementById("status").textContent =
          "Stav : všetky produkty boli vyparsované ◄";
        break;
      }

      const productTable = document.getElementById("productTable");

      for (const productUrl of products) {
        try {
          const productResponse = await fetch(
            `/product-info?url=${encodeURIComponent(productUrl)}`
          );
          if (!productResponse.ok)
            throw new Error(`Failed to fetch product info for ${productUrl}`);

          const productData = await productResponse.json();

          // Add rows for each attribute, including productName
          addTableRow(
            productTable,
            `<b>${totalParsed + 1}</b>`,
            `<a href="${productUrl}" target="_blank">${productUrl}</a>`
          );
          addTableRow(
            productTable,
            "",
            `<b>${productData.productName || "N/A"}</b>`
          );
          addTableRow(
            productTable,
            "",
            `Predajca: ${productData.name || "N/A"}`
          );
          addTableRow(
            productTable,
            "",
            `Lokalita: ${productData.location || "N/A"}`
          );
          addTableRow(productTable, "", `Cena: ${productData.price || "N/A"}`);
          addTableRow(
            productTable,
            "",
            `Počet zhladnutí: ${productData.views || "N/A"}`
          );
          addTableRow(productTable, "", `${productData.description || "N/A"}`);

          totalParsed++;
          document.getElementById("totalParsed").textContent = totalParsed;
        } catch (error) {
          console.error(
            `Error fetching product info for ${productUrl}:`,
            error
          );
        }
      }
      currentPage++;
    } catch (error) {
      document.getElementById(
        "status"
      ).textContent = `Status: Error on page ${currentPage}`;
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
  document.getElementById("status").textContent =
    "Status: Continuing parsing...";
  startParsing();
};

document.getElementById("startParsing").addEventListener("click", startParsing);
document.getElementById("stopParsing").addEventListener("click", stopParsing);
document
  .getElementById("continueParsing")
  .addEventListener("click", continueParsing);

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
  subdomainNavElement.href = `/subdomain?url=${encodeURIComponent(
    subdomain
  )}&name=${encodeURIComponent(name)}`;
  category_url = (subdomain + url.slice(1)).replace(/\s+/g, "");
  console.log(category_url);
});

//export
// Export tabuľky do JSON, TXT alebo CSV
const exportTable = (format) => {
  const rows = Array.from(document.querySelectorAll("#productTable tr"));
  const data = rows.map((row) =>
    Array.from(row.cells).map((cell) => cell.innerText.trim())
  );

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
  const exportModal = new bootstrap.Modal(
    document.getElementById("exportModal")
  );
  exportModal.show();
});

// Pridanie funkcie na kopírovanie tabuľky
document
  .getElementById("copyTable")
  .addEventListener("click", copyTableToClipboard);

function convertRawToJSON(data) {
  const result = [];
  let current = null;

  data.forEach(([idOrEmpty, text]) => {
    if (idOrEmpty !== "") {
      if (current) result.push(current);
      current = {
        id: parseInt(idOrEmpty),
        url: text,
        name: "",
        seller: "",
        location: "",
        price: null,
        viewsNum: null,
        inzeratText: "",
      };
    } else if (current) {
      if (text.startsWith("Predajca:")) {
        current.seller = text.replace("Predajca:", "").trim();
      } else if (text.startsWith("Lokalita:")) {
        current.location = text.replace("Lokalita:", "").trim();
      } else if (text.startsWith("Cena:")) {
        const rawPrice = text.replace("Cena:", "").trim();
        const match = rawPrice.match(/[\d\s]+/);
        current.price = match ? parseInt(match[0].replace(/\s/g, "")) : null;
      } else if (text.startsWith("Počet zhladnutí:")) {
        current.viewsNum = parseInt(
          text.replace("Počet zhladnutí:", "").trim().replace(/\s/g, "")
        );
      } else if (current.name === "") {
        current.name = text.trim();
      } else {
        current.inzeratText += (current.inzeratText ? " " : "") + text.trim();
      }
    }
  });

  if (current) result.push(current);

  result.forEach((obj) => {
    if (obj.inzeratText.startsWith("Lokalita:")) {
      const idx = obj.inzeratText.indexOf(" ");
      obj.inzeratText = obj.inzeratText.slice(idx + 1).trim();
    }
  });

  return result;
}

function smartFilterTable() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();

  if (searchText.trim() === "") {
    renderTable(originalData);
    return;
  }

  const keywords = searchText.split(/\s+/).filter(Boolean);

  const scored = originalData.map((item) => {
    const textContent = [
      item.name,
      item.seller,
      item.location,
      item.inzeratText,
    ]
      .join(" ")
      .toLowerCase();

    const score = keywords.reduce((acc, word) => {
      const inName = item.name.toLowerCase().includes(word) ? 2 : 0;
      const inText = (textContent.match(new RegExp(word, "g")) || []).length;
      return acc + inName + inText;
    }, 0);

    return { ...item, score };
  });

  const filtered = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  renderTable(filtered);
}

function renderTable(items) {
  const productTable = document.getElementById("productTable");
  productTable.innerHTML = "";

  if (items.length === 0) {
    productTable.innerHTML = `<tr><td></td><td><b>Žiadne výsledky nevyhovujú vyhľadávaniu.</b></td></tr>`;
    return;
  }

  items.forEach((item, i) => {
    addTableRow(
      productTable,
      `<b>${i + 1}</b>`,
      `<a href="${item.url}" target="_blank">${item.url}</a>`
    );
    addTableRow(productTable, "", `<b>${item.name || "N/A"}</b>`);
    addTableRow(productTable, "", `Predajca: ${item.seller || "N/A"}`);
    addTableRow(productTable, "", `Lokalita: ${item.location || "N/A"}`);
    addTableRow(productTable, "", `Cena: ${item.price ?? "N/A"}`);
    addTableRow(productTable, "", `Počet zhladnutí: ${item.viewsNum ?? "N/A"}`);
    addTableRow(productTable, "", `${item.inzeratText || ""}`);
  });
}

function filterTable() {
  document.getElementById("searchInput").disabled = false;
  const rows = Array.from(document.querySelectorAll("#productTable tr"));
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const data = rows.map((row) =>
    Array.from(row.cells).map((cell) => cell.innerText.trim())
  );
  const json = convertRawToJSON(data);

  originalData = json; // uložíme si originálne dáta pre neskoršie filtrovanie

  smartFilterTable(); // rovno spustí inteligentné filtrovanie
}

document
  .getElementById("searchInput")
  .addEventListener("input", smartFilterTable);
