/**
 * Gallery Filter Module
 * 
 * Implementează funcționalitatea de filtrare pentru galerie
 * Permite filtrarea elementelor galeriei pe categorii
 */

/**
 * Inițializează funcționalitatea de filtrare a galeriei
 * @param {string} filterSelector - Selectorul pentru butoanele de filtrare
 * @param {string} itemSelector - Selectorul pentru elementele care vor fi filtrate
 * @param {string} activeClass - Clasa pentru filtrul activ
 * @returns {Object} - API pentru controlul filtrelor
 */
export function initializeGalleryFilter(filterSelector = '.gallery__filter', itemSelector = '.gallery__item', activeClass = 'gallery__filter--active') {
    const filters = document.querySelectorAll(filterSelector);
    const items = document.querySelectorAll(itemSelector);
    
    if (!filters.length || !items.length) return null;
    
    // Stochează categoriile disponibile pentru statistici
    const categories = new Map();
    items.forEach(item => {
        const category = item.dataset.category;
        if (category) {
            if (!categories.has(category)) {
                categories.set(category, 0);
            }
            categories.set(category, categories.get(category) + 1);
        }
    });
    
    // Adaugă numărul de elemente pe fiecare categorie (opțional)
    filters.forEach(filter => {
        const filterValue = filter.getAttribute('data-filter');
        if (filterValue !== 'all') {
            const count = categories.get(filterValue) || 0;
            
            // Adaugă un badge cu numărul de elemente (opțional)
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'gallery__filter-count';
                badge.textContent = count;
                filter.appendChild(badge);
            }
        }
    });
    
    // Funcția care aplică filtrul
    const applyFilter = (filterValue) => {
        // Folosește o întârziere minimă pentru a permite browser-ului să proceseze schimbările
        // și pentru a crea un efect de cascadă
        let delay = 0;
        
        items.forEach(item => {
            if (filterValue === 'all' || item.dataset.category === filterValue) {
                // Arată elementele care corespund filtrului
                setTimeout(() => {
                    item.style.display = '';
                    setTimeout(() => {
                        item.classList.add('animate');
                    }, 10);
                }, delay);
                delay += 30; // Adaugă un delay pentru efectul de cascadă
            } else {
                // Ascunde elementele care nu corespund filtrului
                item.classList.remove('animate');
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300); // Așteaptă terminarea animației de fade-out
            }
        });
        
        // După filtrare, asigură-te că toate elementele sunt vizibile
        // în viewport prin scrollarea ușoară la începutul galeriei
        const gallerySection = document.querySelector('.gallery-section');
        if (gallerySection) {
            setTimeout(() => {
                gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    };
    
    // Adaugă event listeners pentru filtre
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Resetează clasa activă pentru toate filtrele
            filters.forEach(f => f.classList.remove(activeClass));
            
            // Adaugă clasa activă pe filtrul curent
            filter.classList.add(activeClass);
            
            // Aplică filtrul
            const filterValue = filter.getAttribute('data-filter');
            applyFilter(filterValue);
            
            // Opțional: actualizează URL-ul cu filtrul selectat
            try {
                const url = new URL(window.location);
                url.searchParams.set('filter', filterValue);
                window.history.replaceState({}, '', url);
            } catch (e) {
                console.error('Browser-ul nu suportă API-ul URL', e);
            }
        });
    });
    
    // Verifică dacă există un filtru în URL și aplică-l
    try {
        const url = new URL(window.location);
        const filterParam = url.searchParams.get('filter');
        
        if (filterParam) {
            // Găsește filtrul corespunzător
            const targetFilter = Array.from(filters).find(f => 
                f.getAttribute('data-filter') === filterParam
            );
            
            // Dacă găsește filtrul, click pe el
            if (targetFilter) {
                targetFilter.click();
                return;
            }
        }
    } catch (e) {
        console.error('Browser-ul nu suportă API-ul URL', e);
    }
    
    // Inițial, arată toate elementele
    applyFilter('all');
    
    // Returnează API pentru control extern
    return {
        /**
         * Setează filtrul activ
         * @param {string} filterValue - Valoarea filtrului (ex: 'all', 'category')
         */
        setFilter(filterValue) {
            // Găsește filtrul corespunzător
            const targetFilter = Array.from(filters).find(f => 
                f.getAttribute('data-filter') === filterValue
            );
            
            if (targetFilter) {
                targetFilter.click();
            }
        },
        
        /**
         * Resetează filtrul la 'all'
         */
        resetFilter() {
            this.setFilter('all');
        },
        
        /**
         * Returnează categoriile disponibile și numărul de elemente
         * @returns {Map} - Map cu categorii și numărul de elemente
         */
        getCategories() {
            return new Map(categories);
        }
    };
}
