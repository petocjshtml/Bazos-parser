document.addEventListener("DOMContentLoaded", async () => {
   const tableBody = document.getElementById("domains-table");

   try {
      // Načítanie URL subdomény z query parametra
      const params = new URLSearchParams(window.location.search);
      const url = params.get("url");
      const name = params.get("name");
      document.getElementById("subdomain").textContent = name;

      if (!url) {
         throw new Error("Chýba parameter URL pre načítanie kategórií.");
      }

      // Zavolanie endpointu /categories na získanie zoznamu kategórií
      const response = await fetch(`/categories?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
         throw new Error("Nepodarilo sa načítať zoznam kategórií.");
      }

      const categories = await response.json();

      // Generovanie riadkov tabuľky pre každú kategóriu
      categories.forEach((category) => {
         const row = document.createElement("tr");
         row.style.cursor = "pointer";
         const nameCell = document.createElement("td");
         nameCell.classList.add("fs-4");
         nameCell.textContent = category.name;
         row.appendChild(nameCell);
         const actionCell = document.createElement("td");
         row.appendChild(actionCell);
         row.addEventListener("click", () => openCategory(category.url, url, name, category.name));
         tableBody.appendChild(row);
      });
   } catch (error) {
      console.error(error.message);
      const errorRow = document.createElement("tr");
      const errorCell = document.createElement("td");
      errorCell.textContent = "Chyba pri načítaní kategórií.";
      errorCell.colSpan = 2;
      errorCell.classList.add("text-danger");
      errorRow.appendChild(errorCell);
      tableBody.appendChild(errorRow);
   }
});

function openCategory(url, subdomain, name, categoryName) {
   const redirect = `/category?url=${encodeURIComponent(url)}
   &subdomain=${encodeURIComponent(subdomain)}
   &name=${encodeURIComponent(name)}
   &category-name=${encodeURIComponent(categoryName)}`;
   window.location.href = redirect;
}
