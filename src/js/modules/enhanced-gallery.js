/**
 * Gallery Module - Enhanced Version
 * 
 * Acest modul implementează o galerie de imagini avansată cu lightbox
 * Suportă navigare keyboard, gesturi touch, imagini multiple, și animații
 */

// Configurație implicită pentru galerie
const defaultConfig = {
    gallerySelector: '.gallery',
    itemSelector: '.gallery__item',
    imageSelector: 'img',
    captionSelector: 'figcaption',
    lightboxClass: 'lightbox',
    activeClass: 'lightbox--active',
    closeButtonClass: 'lightbox__close',
    imageClass: 'lightbox__image',
    captionClass: 'lightbox__caption',
    counterClass: 'lightbox__counter',
    prevButtonClass: 'lightbox__button lightbox__button--prev',
    nextButtonClass: 'lightbox__button lightbox__button--next',
    enableKeyboard: true,
    enableSwipe: true,
    enableZoom: true,
    loop: true,
    preloadImages: 2,
    animationDuration: 300,
    closeOnClickOutside: true,
    enableThumbnails: true,
    thumbnailsClass: 'lightbox__thumbnails',
    thumbnailClass: 'lightbox__thumbnail',
    thumbnailActiveClass: 'lightbox__thumbnail--active',
    ariaLabels: {
        close: 'Închide galeria',
        prev: 'Imaginea anterioară',
        next: 'Imaginea următoare',
        image: 'Imagine',
        of: 'din'
    }
};

/**
 * Inițializează galeria cu lightbox
 * @param {Object} options - Opțiuni de configurare
 * @returns {Object} - API pentru controlul galeriei
 */
export function initializeGallery(options = {}) {
    // Merge options
    const config = { ...defaultConfig, ...options };
    
    // State pentru galerie
    const state = {
        currentIndex: 0,
        isZoomed: false,
        dragStartX: 0,
        dragEndX: 0,
        isDragging: false,
        panStartX: 0,
        panStartY: 0,
        lastTranslateX: 0,
        lastTranslateY: 0,
        scale: 1,
        initialized: false,
        galleries: []
    };
    
    // Găsește toate galeriile de pe pagină
    const galleries = document.querySelectorAll(config.gallerySelector);
    
    if (!galleries.length) return null;
    
    // Creează lightbox dacă nu există
    let lightbox = document.querySelector(`.${config.lightboxClass}`);
    
    if (!lightbox) {
        lightbox = createLightbox(config);
        document.body.appendChild(lightbox);
    }
    
    // Obține elementele din lightbox
    const lightboxImage = lightbox.querySelector(`.${config.imageClass}`);
    const lightboxCaption = lightbox.querySelector(`.${config.captionClass}`);
    const lightboxCounter = lightbox.querySelector(`.${config.counterClass}`);
    const closeButton = lightbox.querySelector(`.${config.closeButtonClass}`);
    const prevButton = lightbox.querySelector(`.${config.prevButtonClass}`);
    const nextButton = lightbox.querySelector(`.${config.nextButtonClass}`);
    const thumbnailsContainer = config.enableThumbnails ? lightbox.querySelector(`.${config.thumbnailsClass}`) : null;
    
    // Preload Images Cache
    const imagesCache = new Map();
    
    // Procesează fiecare galerie
    galleries.forEach((gallery, galleryIndex) => {
        const galleryItems = gallery.querySelectorAll(config.itemSelector);
        
        if (!galleryItems.length) return;
        
        // Adaugă galeria în state
        state.galleries.push({
            element: gallery,
            items: Array.from(galleryItems),
            index: galleryIndex
        });
        
        // Adaugă evenimente pentru elementele din galerie
        galleryItems.forEach((item, itemIndex) => {
            const link = item.tagName === 'A' ? item : item.querySelector('a');
            
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openLightbox(galleryIndex, itemIndex);
                });
            } else {
                item.addEventListener('click', () => {
                    openLightbox(galleryIndex, itemIndex);
                });
            }
        });
    });
    
    // Adaugă event listeners pentru lightbox
    closeButton.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', showPrevImage);
    nextButton.addEventListener('click', showNextImage);
    
    // Click în afara imaginii închide lightbox-ul
    if (config.closeOnClickOutside) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
    
    // Event listeners pentru keyboard
    if (config.enableKeyboard) {
        document.addEventListener('keydown', handleKeyboardNavigation);
    }
    
    // Event listeners pentru touch/swipe
    if (config.enableSwipe) {
        lightboxImage.addEventListener('touchstart', handleTouchStart, { passive: true });
        lightboxImage.addEventListener('touchmove', handleTouchMove, { passive: true });
        lightboxImage.addEventListener('touchend', handleTouchEnd);
    }
    
    // Event listeners pentru zoom
    if (config.enableZoom) {
        lightboxImage.addEventListener('click', toggleZoom);
        lightboxImage.addEventListener('mousedown', handleDragStart);
        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        lightboxImage.addEventListener('wheel', handleMouseWheel, { passive: false });
    }
    
    /**
     * Funcție pentru deschiderea lightbox-ului
     * @param {number} galleryIndex - Indexul galeriei
     * @param {number} itemIndex - Indexul elementului din galerie
     */
    function openLightbox(galleryIndex, itemIndex) {
        const gallery = state.galleries[galleryIndex];
        if (!gallery) return;
        
        state.currentGalleryIndex = galleryIndex;
        state.currentIndex = itemIndex;
        
        updateLightboxContent();
        
        // Dezactivează scroll pe pagină
        document.body.style.overflow = 'hidden';
        
        // Afișează lightbox-ul
        lightbox.style.display = 'flex';
        setTimeout(() => {
            lightbox.classList.add(config.activeClass);
        }, 10);
        
        // Actualizează thumbnails dacă sunt activate
        if (config.enableThumbnails) {
            updateThumbnails();
        }
        
        // Preload imagini adiacente
        preloadAdjacentImages();
    }
    
    /**
     * Actualizează conținutul lightbox-ului cu imaginea curentă
     */
    function updateLightboxContent() {
        const gallery = state.galleries[state.currentGalleryIndex];
        const item = gallery.items[state.currentIndex];
        
        if (!item) return;
        
        // Resetează zoom și pan
        resetZoom();
        
        // Obține URL-ul imaginii
        const imageElement = item.querySelector(config.imageSelector);
        let imageUrl = '';
        
        if (imageElement) {
            // Verifică dacă există un data-full sau imagini mai mari
            imageUrl = imageElement.dataset.full || 
                       imageElement.dataset.large || 
                       imageElement.src;
            
            // Actualizează imaginea din lightbox
            lightboxImage.src = imageUrl;
            lightboxImage.alt = imageElement.alt || '';
            
            // Așteaptă încărcarea imaginii
            lightboxImage.onload = () => {
                lightboxImage.style.opacity = '1';
            };
            
            // Ascunde imaginea până se încarcă
            lightboxImage.style.opacity = '0';
        }
        
        // Actualizează caption
        const captionElement = item.querySelector(config.captionSelector);
        lightboxCaption.textContent = captionElement ? captionElement.textContent : '';
        lightboxCaption.style.display = lightboxCaption.textContent ? 'block' : 'none';
        
        // Actualizează counter
        if (lightboxCounter) {
            lightboxCounter.textContent = `${state.currentIndex + 1} ${config.ariaLabels.of} ${gallery.items.length}`;
        }
        
        // Actualizează state pentru butoane prev/next
        updateNavigationState();
        
        // Actualizează URL-ul paginii cu un hash pentru deep linking
        if (history.replaceState) {
            const imageId = item.id || `gallery-${state.currentGalleryIndex}-${state.currentIndex}`;
            history.replaceState(null, null, `#${imageId}`);
        }
        
        // Actualizează thumbnail activ
        if (config.enableThumbnails) {
            const thumbnails = thumbnailsContainer.querySelectorAll(`.${config.thumbnailClass}`);
            thumbnails.forEach((thumb, idx) => {
                if (idx === state.currentIndex) {
                    thumb.classList.add(config.thumbnailActiveClass);
                } else {
                    thumb.classList.remove(config.thumbnailActiveClass);
                }
            });
        }
    }
    
    /**
     * Creează și actualizează thumbnails
     */
    function updateThumbnails() {
        if (!thumbnailsContainer) return;
        
        // Golește containerul de thumbnails
        thumbnailsContainer.innerHTML = '';
        
        const gallery = state.galleries[state.currentGalleryIndex];
        
        // Adaugă thumbnails pentru fiecare imagine
        gallery.items.forEach((item, idx) => {
            const imageElement = item.querySelector(config.imageSelector);
            if (!imageElement) return;
            
            const thumbnail = document.createElement('button');
            thumbnail.className = `${config.thumbnailClass} ${idx === state.currentIndex ? config.thumbnailActiveClass : ''}`;
            thumbnail.setAttribute('aria-label', `${config.ariaLabels.image} ${idx + 1}`);
            
            // Creează imagine pentru thumbnail
            const thumbImg = document.createElement('img');
            thumbImg.src = imageElement.src;
            thumbImg.alt = '';
            thumbImg.loading = 'lazy';
            
            thumbnail.appendChild(thumbImg);
            
            // Adaugă event listener
            thumbnail.addEventListener('click', () => {
                state.currentIndex = idx;
                updateLightboxContent();
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    /**
     * Actualizează starea butoanelor de navigare
     */
    function updateNavigationState() {
        const gallery = state.galleries[state.currentGalleryIndex];
        
        if (!config.loop) {
            prevButton.disabled = state.currentIndex === 0;
            nextButton.disabled = state.currentIndex === gallery.items.length - 1;
            
            prevButton.classList.toggle('lightbox__button--disabled', prevButton.disabled);
            nextButton.classList.toggle('lightbox__button--disabled', nextButton.disabled);
        } else {
            prevButton.disabled = false;
            nextButton.disabled = false;
            prevButton.classList.remove('lightbox__button--disabled');
            nextButton.classList.remove('lightbox__button--disabled');
        }
    }
    
    /**
     * Preîncarcă imaginile adiacente
     */
    function preloadAdjacentImages() {
        const gallery = state.galleries[state.currentGalleryIndex];
        
        for (let i = 1; i <= config.preloadImages; i++) {
            // Preload next
            preloadImage(getAdjustedIndex(state.currentIndex + i, gallery.items.length));
            
            // Preload prev
            preloadImage(getAdjustedIndex(state.currentIndex - i, gallery.items.length));
        }
    }
    
    /**
     * Preîncarcă o imagine după index
     * @param {number} index - Indexul imaginii de preîncărcat
     */
    function preloadImage(index) {
        const gallery = state.galleries[state.currentGalleryIndex];
        const item = gallery.items[index];
        
        if (!item) return;
        
        const imageElement = item.querySelector(config.imageSelector);
        if (!imageElement) return;
        
        const imageUrl = imageElement.dataset.full || 
                         imageElement.dataset.large || 
                         imageElement.src;
        
        // Verifică dacă imaginea este deja în cache
        if (imagesCache.has(imageUrl)) return;
        
        // Creează un nou element de imagine pentru preîncărcare
        const preloadImg = new Image();
        preloadImg.src = imageUrl;
        
        // Adaugă în cache
        imagesCache.set(imageUrl, preloadImg);
    }
    
    /**
     * Afișează imaginea anterioară
     */
    function showPrevImage() {
        const gallery = state.galleries[state.currentGalleryIndex];
        state.currentIndex = getAdjustedIndex(state.currentIndex - 1, gallery.items.length);
        updateLightboxContent();
    }
    
    /**
     * Afișează imaginea următoare
     */
    function showNextImage() {
        const gallery = state.galleries[state.currentGalleryIndex];
        state.currentIndex = getAdjustedIndex(state.currentIndex + 1, gallery.items.length);
        updateLightboxContent();
    }
    
    /**
     * Închide lightbox-ul
     */
    function closeLightbox() {
        // Animație de închidere
        lightbox.classList.remove(config.activeClass);
        
        // După animație, ascunde complet
        setTimeout(() => {
            lightbox.style.display = 'none';
            
            // Resetează zoom
            resetZoom();
            
            // Restaurează scroll-ul paginii
            document.body.style.overflow = '';
            
            // Elimină hash-ul din URL
            if (history.replaceState) {
                history.replaceState(null, null, window.location.pathname);
            }
        }, config.animationDuration);
    }
    
    /**
     * Gestionează navigarea cu tastatură
     * @param {KeyboardEvent} e - Evenimentul keyboard
     */
    function handleKeyboardNavigation(e) {
        if (!lightbox.classList.contains(config.activeClass)) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
            case ' ':
                // Space bar toggles zoom
                if (config.enableZoom) {
                    e.preventDefault();
                    toggleZoom();
                }
                break;
        }
    }
    
    /**
     * Gestionează începutul unui touch
     * @param {TouchEvent} e - Evenimentul touch
     */
    function handleTouchStart(e) {
        if (state.isZoomed) return;
        
        state.dragStartX = e.touches[0].clientX;
    }
    
    /**
     * Gestionează mișcarea unui touch
     * @param {TouchEvent} e - Evenimentul touch
     */
    function handleTouchMove(e) {
        if (state.isZoomed) return;
        
        state.dragEndX = e.touches[0].clientX;
    }
    
    /**
     * Gestionează sfârșitul unui touch
     */
    function handleTouchEnd() {
        if (state.isZoomed) return;
        
        const dragThreshold = 50; // pixeli
        const dragDistance = state.dragEndX - state.dragStartX;
        
        if (dragDistance > dragThreshold) {
            showPrevImage();
        } else if (dragDistance < -dragThreshold) {
            showNextImage();
        }
    }
    
    /**
     * Toggle zoom pe imagine
     * @param {MouseEvent} e - Evenimentul mouse
     */
    function toggleZoom(e) {
        if (!config.enableZoom) return;
        
        state.isZoomed = !state.isZoomed;
        
        if (state.isZoomed) {
            // Zoom in la poziția mouse-ului
            lightboxImage.classList.add('lightbox__image--zoomed');
            
            if (e) {
                const rect = lightboxImage.getBoundingClientRect();
                const offsetX = (e.clientX - rect.left) / rect.width;
                const offsetY = (e.clientY - rect.top) / rect.height;
                
                lightboxImage.style.transformOrigin = `${offsetX * 100}% ${offsetY * 100}%`;
                state.scale = 2; // zoom level
            }
        } else {
            // Zoom out
            resetZoom();
        }
    }
    
    /**
     * Resetează zoom și pan
     */
    function resetZoom() {
        lightboxImage.classList.remove('lightbox__image--zoomed');
        lightboxImage.style.transform = 'translate(0, 0) scale(1)';
        lightboxImage.style.transformOrigin = 'center center';
        state.isZoomed = false;
        state.scale = 1;
        state.lastTranslateX = 0;
        state.lastTranslateY = 0;
    }
    
    /**
     * Gestionează începutul drag pentru pan
     * @param {MouseEvent} e - Evenimentul mouse
     */
    function handleDragStart(e) {
        if (!state.isZoomed) return;
        
        state.isDragging = true;
        state.panStartX = e.clientX;
        state.panStartY = e.clientY;
        
        lightboxImage.style.cursor = 'grabbing';
    }
    
    /**
     * Gestionează mișcarea drag pentru pan
     * @param {MouseEvent} e - Evenimentul mouse
     */
    function handleDragMove(e) {
        if (!state.isDragging || !state.isZoomed) return;
        
        const deltaX = e.clientX - state.panStartX;
        const deltaY = e.clientY - state.panStartY;
        
        const newTranslateX = state.lastTranslateX + deltaX;
        const newTranslateY = state.lastTranslateY + deltaY;
        
        lightboxImage.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${state.scale})`;
    }
    
    /**
     * Gestionează sfârșitul drag pentru pan
     */
    function handleDragEnd() {
        if (!state.isDragging || !state.isZoomed) return;
        
        state.lastTranslateX += state.panStartX - state.panStartX + (state.dragEndX - state.dragStartX);
        state.lastTranslateY += state.panStartY - state.panStartY + (state.dragEndY - state.dragStartY);
        
        state.isDragging = false;
        lightboxImage.style.cursor = 'grab';
    }
    
    /**
     * Gestionează zoom cu mouse wheel
     * @param {WheelEvent} e - Evenimentul wheel
     */
    function handleMouseWheel(e) {
        if (!config.enableZoom) return;
        
        e.preventDefault();
        
        // Calculează noul nivel de zoom
        let newScale = state.scale;
        
        if (e.deltaY < 0) {
            // Zoom in
            newScale = Math.min(state.scale * 1.1, 5);
        } else {
            // Zoom out
            newScale = Math.max(state.scale / 1.1, 1);
        }
        
        // Dacă ajungem la scala 1, resetăm zoom-ul
        if (newScale <= 1.05) {
            resetZoom();
            return;
        }
        
        // Actualizează state
        state.scale = newScale;
        state.isZoomed = true;
        
        // Aplică zoom
        lightboxImage.classList.add('lightbox__image--zoomed');
        lightboxImage.style.transform = `translate(${state.lastTranslateX}px, ${state.lastTranslateY}px) scale(${state.scale})`;
    }
    
    /**
     * Obține index ajustat pentru navigare circulară
     * @param {number} index - Indexul inițial
     * @param {number} length - Lungimea array-ului
     * @returns {number} - Indexul ajustat
     */
    function getAdjustedIndex(index, length) {
        if (config.loop) {
            // Navigare circulară
            if (index < 0) {
                return length - 1;
            } else if (index >= length) {
                return 0;
            }
        } else {
            // Fără navigare circulară
            if (index < 0) {
                return 0;
            } else if (index >= length) {
                return length - 1;
            }
        }
        
        return index;
    }
    
    // Returnează API public pentru galerie
    return {
        open: openLightbox,
        close: closeLightbox,
        next: showNextImage,
        prev: showPrevImage,
        
        /**
         * Distruge galeria și curăță evenimentele
         */
        destroy() {
            // Elimină event listeners
            if (config.enableKeyboard) {
                document.removeEventListener('keydown', handleKeyboardNavigation);
            }
            
            if (config.enableZoom) {
                lightboxImage.removeEventListener('click', toggleZoom);
                lightboxImage.removeEventListener('mousedown', handleDragStart);
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                lightboxImage.removeEventListener('wheel', handleMouseWheel);
            }
            
            // Elimină lightbox din DOM
            if (lightbox.parentNode) {
                lightbox.parentNode.removeChild(lightbox);
            }
            
            // Resetează cache-ul
            imagesCache.clear();
        },
        
        /**
         * Actualizează opțiunile galeriei
         * @param {Object} newOptions - Noile opțiuni
         */
        updateOptions(newOptions = {}) {
            Object.assign(config, newOptions);
            
            // Actualizează starea UI-ului pe baza noilor opțiuni
            updateNavigationState();
            
            // Actualizează thumbnail-urile dacă este cazul
            if (config.enableThumbnails) {
                updateThumbnails();
            }
        }
    };
}

/**
 * Creează elementul lightbox
 * @param {Object} config - Configurația lightbox-ului
 * @returns {HTMLElement} - Elementul lightbox creat
 */
function createLightbox(config) {
    const lightbox = document.createElement('div');
    lightbox.className = config.lightboxClass;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Galerie imagini');
    
    // Template pentru lightbox
    lightbox.innerHTML = `
        <div class="lightbox__container">
            <button class="${config.closeButtonClass}" aria-label="${config.ariaLabels.close}">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
            
            <div class="lightbox__content">
                <img class="${config.imageClass}" alt="" loading="eager">
                <div class="${config.captionClass}"></div>
                
                <div class="lightbox__controls">
                    <button class="${config.prevButtonClass}" aria-label="${config.ariaLabels.prev}">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    
                    <div class="${config.counterClass}"></div>
                    
                    <button class="${config.nextButtonClass}" aria-label="${config.ariaLabels.next}">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
            
            ${config.enableThumbnails ? `<div class="${config.thumbnailsClass}"></div>` : ''}
        </div>
    `;
    
    return lightbox;
}
