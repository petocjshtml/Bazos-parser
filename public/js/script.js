// Funkcia na načítanie kategórií z endpointu /domains
async function loadDomains() {
   try {
      const response = await fetch("/domains");
      const domains = await response.json();

      const tableBody = document.getElementById("domains-table");
      tableBody.innerHTML = ""; // Vyčistenie tabuľky

      // Iterácia cez získané kategórie a ich pridanie do tabuľky
      domains.forEach((domain) => {
         const row = document.createElement("tr");
         row.style.cursor = "pointer"; // Zmena kurzora na ruku pri najazde na riadok
         row.classList.add("align-middle"); // Bootstrap trieda pre vertikálne zarovnanie

         // Stĺpec s názvom
         const nameCell = document.createElement("td");
         nameCell.textContent = domain.name;
         nameCell.classList.add("fs-5");

         // Stĺpec s obrázkom
         const imageCell = document.createElement("td");
         const image = document.createElement("img");
         image.src = domain.image;
         image.alt = domain.name;
         image.width = 50; // Zmenšenie obrázku
         image.height = 50;
         image.classList.add("rounded"); // Bootstrap trieda na zaoblené rohy
         imageCell.appendChild(image);

         // Kliknutie na riadok
         row.addEventListener("click", () => showDomain(domain.domain, domain.name));

         // Pridanie buniek do riadku
         row.appendChild(nameCell);
         row.appendChild(imageCell);

         // Pridanie riadku do tabuľky
         tableBody.appendChild(row);
      });
   } catch (error) {
      console.error("Chyba pri načítaní kategórií:", error);
   }
}

// Funkcia na spracovanie kliknutia na kategóriu
function showDomain(domain, name) {
   const url = `/subdomain?url=${encodeURIComponent(domain)}&name=${encodeURIComponent(name)}`;
   window.location.href = url;
}

// Načítanie kategórií pri načítaní stránky
document.addEventListener("DOMContentLoaded", loadDomains);
