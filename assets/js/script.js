// DOM
const selfieRoger = document.getElementById('selfieRoger');
const selfieLouise = document.getElementById('selfieLouise');
const specialCreative = document.getElementById('specialCreative');
const petsCat = document.getElementById('petsCat');
const videoGallery = document.getElementById('videoGallery');
const stats = document.getElementById('stats');

// --- Utils ---
const by = (k) => (a,b)=> (a[k]||'').localeCompare(b[k]||'');

function cardTemplate(it, idx, list){
  const tpl = document.getElementById('cardTpl');
  const node = tpl.content.firstElementChild.cloneNode(true);
  const img = node.querySelector('.thumb');

  if(it.type === "video"){ 
    const vid = document.createElement("video");
    vid.src = it.src;
    vid.controls = true;
    vid.preload = "none"; // 👈 ikke last før play
    vid.className = "thumb";
    if(it.poster) vid.poster = it.poster;
    img.replaceWith(vid);
  } else {
    // 👇 bruk thumbnail i grid
    img.src = it.thumb || it.src;
    img.alt = it.title || "Bilde";
    img.loading = "lazy";       // 👈 last først når synlig
    img.decoding = "async";     // 👈 avlast hovedtråden
    img.dataset.index = idx;
    img.addEventListener('click', ()=> openLightbox(idx, list));
  }

  if(it.category === "selfie") node.classList.add("selfie");

  node.querySelector('.title').textContent = it.title || '';
  node.querySelector('.tags').textContent = `${it.category} · ${it.subcategory || ""}`;
  return node;
}

function renderGallery(items, container){
  container.innerHTML = '';
  container.classList.add('gallery');
  items.forEach((it, idx)=> container.append(cardTemplate(it, idx, items)));
}

function updateStats(all){
  const total = all.length;
  const selfies = all.filter(it=>it.category==="selfie").length;
  const specials = all.filter(it=>it.category==="special").length;
  const pets = all.filter(it=>it.category==="pets").length;
  const videos = all.filter(it=>it.type==="video").length;
  stats.textContent = `${total} elementer totalt — ${selfies} selfies, ${specials} special, ${pets} pets, ${videos} video`;
}

// --- Lightbox ---
let currentList = [];
let activeIndex = -1;
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbTitle = document.getElementById('lbTitle');
const lbTags = document.getElementById('lbTags');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

function openLightbox(idx, list){
  currentList = list;
  activeIndex = idx;
  const it = currentList[activeIndex];

  // 👇 bruk full-versjonen i lightbox
  lbImg.src = it.full || it.src;
  lbTitle.textContent = it.title || "";
  lbTags.textContent = `${it.category} · ${it.subcategory || ""}`;
  lb.classList.add('open');
}

function closeLightbox(){ lb.classList.remove('open'); }

function nav(delta){
  if(currentList.length===0) return;
  activeIndex = (activeIndex + delta + currentList.length) % currentList.length;
  openLightbox(activeIndex, currentList);
}

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', ()=> nav(-1));
lbNext.addEventListener('click', ()=> nav(1));

document.addEventListener('keydown', (e)=>{
  if(e.key === "Escape") closeLightbox();
});

// --- Init ---
async function loadGallery(url, container){
  const res = await fetch(url);
  const items = await res.json();
  items.sort(by('title'));
  renderGallery(items, container);
  return items;
}

async function init(){
  const all = [];

  all.push(...await loadGallery('./assets/data/selfieRoger.json', selfieRoger));
  all.push(...await loadGallery('./assets/data/selfieLouise.json', selfieLouise));
  all.push(...await loadGallery('./assets/data/specialCreative.json', specialCreative));
  all.push(...await loadGallery('./assets/data/petsCat.json', petsCat));
  all.push(...await loadGallery('./assets/data/videos.json', videoGallery));

  updateStats(all);
}

async function loadPrompts(){
  try {
    const res = await fetch('./assets/data/prompts.json');
    const prompts = await res.json();
    const container = document.getElementById('promptsGallery');
    if(!container) return;

    container.innerHTML = prompts.map(p => `
      <div class="prompt-card">
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        ${p.exampleImage ? `<img src="${p.exampleImage}" alt="${p.title}" />` : ""}
        <small>Kategori: ${p.category}</small>
      </div>
    `).join('');
  } catch(err){
    console.error("Kunne ikke laste prompts.json", err);
  }
}

// --- Hero filter ---
const filterButtons = document.querySelectorAll('.filter-btn[data-category]');
const sections = document.querySelectorAll('main section');
const subcategoryFilters = document.getElementById('subcategoryFilters');

const subcategories = {
  selfie: ["Roger","Louise"],
  special: ["creative"],
  pets: ["cat"],
  video: ["transform","scenes","soldier"]
};

function clearActive(container){
  container.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.category;

    clearActive(btn.parentElement);
    btn.classList.add('active');

    sections.forEach(sec => {
      if (category === "all") {
        sec.style.display = "block";
      } else {
        sec.style.display = sec.id.startsWith(category) ? "block" : "none";
      }
    });

    renderSubcategoryFilters(category);
  });
});

function renderSubcategoryFilters(category){
  subcategoryFilters.innerHTML = "";
  if(category === "all") return;

  const subs = subcategories[category] || [];
  subs.forEach(sub=>{
    const btn = document.createElement("button");
    btn.className = "filter-btn sub-btn";
    btn.textContent = sub;
    btn.addEventListener("click", ()=>{
      clearActive(subcategoryFilters);
      btn.classList.add("active");

      sections.forEach(sec=> sec.style.display="none");

      const section = document.getElementById(category+"Section");
      if(section){
        section.style.display="block";
        section.querySelectorAll(".subsection").forEach(s => s.style.display="none");

        const containerId = `${category}${sub}`;
        const el = document.getElementById(containerId);
        if(el){
          el.parentElement.style.display = "block";
          el.classList.add("gallery", "sub-gallery");
        }
      }
    });
    subcategoryFilters.appendChild(btn);
  });
}

init();
loadPrompts();
