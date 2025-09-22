// ------------------------------
// VARIABLES GLOBALES
// ------------------------------
let produits = [];
let panier = [];

// ------------------------------
// CHARGEMENT JSON
// ------------------------------
async function chargerProduits() {
  try {
    const response = await fetch("produits.json");
    produits = await response.json();
    afficherProduits(produits);
    populateCategories(produits);
  } catch (error) {
    console.error("Erreur chargement JSON:", error);
  }
}

// ------------------------------
// AFFICHAGE PRODUITS (GROUPÉS PAR CATÉGORIE)
// ------------------------------
function afficherProduits(prods) {
  const container = document.getElementById("produits-container");
  container.innerHTML = "";

  // Regrouper les produits par catégorie
  const groupes = {};
  prods.forEach(prod => {
    prod.categorie.forEach(cat => {
      if (!groupes[cat]) groupes[cat] = [];
      groupes[cat].push(prod);
    });
  });

  // Afficher chaque groupe
  Object.keys(groupes).forEach(categorie => {
    const section = document.createElement("section");
    section.className = "categorie-section";

    // Titre de la catégorie
    const titre = document.createElement("h2");
    titre.textContent = categorie;
    titre.style.textAlign = "left";
    titre.style.margin = "20px 0 10px";
    titre.style.fontSize = "1.3rem";
    section.appendChild(titre);

    // Grille des produits
    const grid = document.createElement("div");
    grid.className = "produits";
    grid.style.gridTemplateColumns = "repeat(2, 1fr)"; // 2 produits par ligne

    groupes[categorie].forEach(prod => {
      const div = document.createElement("div");
      div.className = "produit";

      // CARROUSEL IMAGE
      const carousel = document.createElement("div");
      carousel.className = "carousel";
      carousel.dataset.index = 0;
      prod.images.forEach((imgSrc, i) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = prod.nom;
        img.style.display = i === 0 ? "block" : "none";
        carousel.appendChild(img);
      });

      // Flèches
      const prev = document.createElement("span");
      prev.className = "prev";
      prev.innerHTML = "&#10094;";
      const next = document.createElement("span");
      next.className = "next";
      next.innerHTML = "&#10095;";
      carousel.appendChild(prev);
      carousel.appendChild(next);
      div.appendChild(carousel);

      // NOM
      const h3 = document.createElement("h3");
      h3.textContent = prod.nom;
      div.appendChild(h3);

      // PRIX
      const prix = document.createElement("div");
      prix.className = "prix";
      prix.textContent = prod.prix + " F";
      div.appendChild(prix);

      // DESCRIPTION
      const desc = document.createElement("div");
      desc.className = "description";
      desc.textContent = prod.description;
      div.appendChild(desc);

      // ÉTIQUETTES PROMO / NOUVEAU
      if (prod.promo && prod.promo > 0) {
        const promo = document.createElement("div");
        promo.className = "etiquette-promo";
        promo.textContent = `-${prod.promo}%`;
        div.appendChild(promo);
      }
      if (prod.nouveau) {
        const nouveau = document.createElement("div");
        nouveau.className = "etiquette-nouveau";
        nouveau.textContent = "NOUVEAU";
        div.appendChild(nouveau);
      }

      // BOUTON AJOUTER
      const button = document.createElement("button");
      button.textContent = prod.disponible ? "Ajouter au panier" : "Indisponible";
      button.disabled = !prod.disponible;
      if (prod.disponible) {
        button.onclick = (e) => {
          e.stopPropagation();
          ajouterPanier(prod);
        };
      }
      div.appendChild(button);

      // Toggle description
      div.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON") {
          desc.style.display = desc.style.display === "block" ? "none" : "block";
        }
      });

      grid.appendChild(div);
    });

    section.appendChild(grid);
    container.appendChild(section);
  });

  initCarousels();
}

// ------------------------------
// AJOUTER AU PANIER
// ------------------------------
function ajouterPanier(prod) {
  panier.push(prod);
  updatePanierUI();
  afficherNotification(`${prod.nom} ajouté au panier`);
}

// ------------------------------
// AFFICHAGE PANIER
// ------------------------------
function togglePanier() {
  const panierDiv = document.getElementById("panier");
  panierDiv.style.display = panierDiv.style.display === "block" ? "none" : "block";
}

function updatePanierUI() {
  const liste = document.getElementById("liste-panier");
  liste.innerHTML = "";
  let total = 0;

  panier.forEach((p, index) => {
    const li = document.createElement("li");
    li.innerHTML = `${p.nom} - ${p.prix} F 
                    <button class="supprimer" data-index="${index}">Supprimer</button>`;
    liste.appendChild(li);
    total += p.prix;
  });

  // Total
  const totalDiv = document.createElement("div");
  totalDiv.className = "total-panier";
  totalDiv.textContent = `Total : ${total} F`;
  liste.appendChild(totalDiv);

  // Boutons supprimer
  document.querySelectorAll(".supprimer").forEach(btn => {
    btn.onclick = (e) => {
      const idx = e.target.dataset.index;
      panier.splice(idx, 1);
      updatePanierUI();
    };
  });

  document.getElementById("compteur-panier").textContent = panier.length;
}

// ------------------------------
// COMMANDE PANIER
// ------------------------------
function commanderPanier() {
  if (panier.length === 0) return alert("Panier vide !");
  let message = "Bonjour, je souhaite commander:\n";
  panier.forEach(p => message += `- ${p.nom} : ${p.prix} F\n`);
  const url = `https://wa.me/221774903440?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// ------------------------------
// NOTIFICATION
// ------------------------------
function afficherNotification(msg) {
  const notif = document.createElement("div");
  notif.className = "notification";
  notif.textContent = msg;
  document.body.appendChild(notif);
  notif.style.opacity = "0";
  setTimeout(() => notif.style.opacity = "1", 50);
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => notif.remove(), 500);
  }, 2000);
}

// ------------------------------
// FILTRE / RECHERCHE / TRI
// ------------------------------
document.getElementById("categorie-select").addEventListener("change", filtrerProduits);
document.getElementById("search-bar").addEventListener("input", filtrerProduits);

document.getElementById("filter-price-btn")?.addEventListener("click", filtrerProduits);
document.getElementById("sort-popular")?.addEventListener("click", () => {
  produits.sort((a,b) => (b.popularite || 0) - (a.popularite || 0));
  filtrerProduits();
});

function filtrerProduits() {
  const cat = document.getElementById("categorie-select").value;
  const search = document.getElementById("search-bar").value.toLowerCase();
  const minPrice = parseFloat(document.getElementById("min-price")?.value || 0);
  const maxPrice = parseFloat(document.getElementById("max-price")?.value || Infinity);

  let filtered = produits.filter(p => {
    const inCat = cat === "all" || p.categorie.includes(cat);
    const inSearch = p.nom.toLowerCase().includes(search);
    const inPrice = p.prix >= minPrice && p.prix <= maxPrice;
    return inCat && inSearch && inPrice;
  });

  afficherProduits(filtered);
}

// ------------------------------
// POPULATE CATEGORIES
// ------------------------------
function populateCategories(prods) {
  const select = document.getElementById("categorie-select");
  const cats = new Set();
  prods.forEach(p => p.categorie.forEach(c => cats.add(c)));
  cats.forEach(c => {
    if (![...select.options].some(o => o.value === c)) {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    }
  });
}

// ------------------------------
// CARROUSEL PRODUITS
// ------------------------------
function initCarousels() {
  const carousels = document.querySelectorAll(".carousel");
  carousels.forEach(carousel => {
    const imgs = carousel.querySelectorAll("img");
    let index = 0;
    const prev = carousel.querySelector(".prev");
    const next = carousel.querySelector(".next");

    function showImage(i) {
      imgs.forEach((img,j) => img.style.display = j===i?"block":"none");
    }

    prev.onclick = e => { e.stopPropagation(); index=(index-1+imgs.length)%imgs.length; showImage(index); };
    next.onclick = e => { e.stopPropagation(); index=(index+1)%imgs.length; showImage(index); };

    let startX = 0;
    carousel.addEventListener("touchstart", e=>{startX=e.touches[0].clientX;});
    carousel.addEventListener("touchend", e=>{
      const endX=e.changedTouches[0].clientX;
      if(endX-startX>50) index=(index-1+imgs.length)%imgs.length;
      if(startX-endX>50) index=(index+1)%imgs.length;
      showImage(index);
    });

    setInterval(()=>{ index=(index+1)%imgs.length; showImage(index); },5000);
  });
}

// ------------------------------
// BACKGROUND LOGOS
// ------------------------------
let activeLogo = 0;
const logos = document.querySelectorAll(".bg-logo");
setInterval(()=>{
  logos.forEach(l=>l.classList.remove("active"));
  logos[activeLogo].classList.add("active");
  activeLogo=(activeLogo+1)%logos.length;
},4000);

// ------------------------------
// MENU SOCIAL
// ------------------------------
function toggleSocial() {
  const menu = document.getElementById("menu-social");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// ------------------------------
// INIT
// ------------------------------
window.onload = () => { chargerProduits(); };