/**
 * Social Sharing Module
 * 
 * Acest modul oferă funcționalități de partajare pe rețele sociale
 * și facilitează distribuirea conținutului de pe site
 */

/**
 * Configurația implicită pentru rețele sociale
 */
const DEFAULT_NETWORKS = {
    facebook: {
        name: 'Facebook',
        shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}&t={title}',
        icon: 'fab fa-facebook-f'
    },
    twitter: {
        name: 'Twitter',
        shareUrl: 'https://twitter.com/intent/tweet?url={url}&text={title}',
        icon: 'fab fa-twitter'
    },
    whatsapp: {
        name: 'WhatsApp',
        shareUrl: 'https://api.whatsapp.com/send?text={title}%20{url}',
        icon: 'fab fa-whatsapp'
    },
    email: {
        name: 'Email',
        shareUrl: 'mailto:?subject={title}&body={url}',
        icon: 'fas fa-envelope'
    }
};

/**
 * Inițializează funcționalitatea de partajare socială
 * @param {string} selector - Selectorul pentru containerul de butoane
 * @param {Object} options - Opțiuni de configurare
 */
export function initializeSocialSharing(selector = '.social-share', options = {}) {
    const containers = document.querySelectorAll(selector);
    
    if (!containers.length) return null;
    
    // Configurație
    const config = {
        networks: DEFAULT_NETWORKS,
        shareData: {
            url: window.location.href,
            title: document.title,
            description: getMetaDescription(),
            image: getMetaImage()
        },
        ...options
    };
    
    // Procesează fiecare container
    containers.forEach(container => {
        // Obține opțiunile specifice containerului
        const containerData = {
            url: container.dataset.shareUrl || config.shareData.url,
            title: container.dataset.shareTitle || config.shareData.title,
            description: container.dataset.shareDescription || config.shareData.description,
            image: container.dataset.shareImage || config.shareData.image
        };
        
        // Creează butoanele de partajare
        const networks = container.dataset.networks ? 
            container.dataset.networks.split(',').map(n => n.trim()) : 
            Object.keys(config.networks);
        
        // Verifică dacă sunt butoane deja create
        if (!container.querySelector('.social-share-button')) {
            createShareButtons(container, networks, config.networks, containerData);
        }
        
        // Verifică dacă API-ul Web Share este disponibil și adaugă butonul nativ
        if (navigator.share && !container.querySelector('.social-share-native')) {
            createNativeShareButton(container, containerData);
        }
    });
    
    return {
        refresh() {
            containers.forEach(container => {
                container.innerHTML = '';
                
                const containerData = {
                    url: container.dataset.shareUrl || config.shareData.url,
                    title: container.dataset.shareTitle || config.shareData.title,
                    description: container.dataset.shareDescription || config.shareData.description,
                    image: container.dataset.shareImage || config.shareData.image
                };
                
                const networks = container.dataset.networks ? 
                    container.dataset.networks.split(',').map(n => n.trim()) : 
                    Object.keys(config.networks);
                
                createShareButtons(container, networks, config.networks, containerData);
                
                if (navigator.share) {
                    createNativeShareButton(container, containerData);
                }
            });
        }
    };
}

/**
 * Creează butoanele de partajare socială
 * @param {HTMLElement} container - Containerul pentru butoane
 * @param {Array} networks - Rețelele pentru care se creează butoane
 * @param {Object} networkConfig - Configurația rețelelor
 * @param {Object} shareData - Datele pentru partajare
 */
function createShareButtons(container, networks, networkConfig, shareData) {
    networks.forEach(networkName => {
        const network = networkConfig[networkName];
        
        if (!network) return;
        
        // Creează butonul
        const button = document.createElement('a');
        button.href = formatShareUrl(network.shareUrl, shareData);
        button.className = `social-share-button social-share-button--${networkName}`;
        button.setAttribute('aria-label', `Partajează pe ${network.name}`);
        button.setAttribute('title', `Partajează pe ${network.name}`);
        button.setAttribute('rel', 'noopener noreferrer');
        button.setAttribute('target', '_blank');
        
        // Adaugă icon
        button.innerHTML = `<i class="${network.icon}" aria-hidden="true"></i>`;
        
        // Adaugă event listener pentru deschiderea în popup
        button.addEventListener('click', (e) => {
            if (networkName !== 'email') {
                e.preventDefault();
                openSharePopup(button.href, network.name);
            }
        });
        
        // Adaugă în container
        container.appendChild(button);
    });
}

/**
 * Creează buton pentru API-ul nativ de partajare
 * @param {HTMLElement} container - Containerul pentru butoane
 * @param {Object} shareData - Datele pentru partajare
 */
function createNativeShareButton(container, shareData) {
    const button = document.createElement('button');
    button.className = 'social-share-button social-share-native';
    button.setAttribute('aria-label', 'Partajează');
    button.setAttribute('title', 'Partajează');
    
    // Adaugă icon
    button.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i>';
    
    // Adaugă event listener pentru API-ul Web Share
    button.addEventListener('click', async () => {
        try {
            await navigator.share({
                title: shareData.title,
                text: shareData.description,
                url: shareData.url
            });
            console.log('Content shared successfully');
        } catch (err) {
            console.error('Error sharing content:', err);
        }
    });
    
    // Adaugă în container
    container.appendChild(button);
}

/**
 * Formatează URL-ul de partajare cu datele specifice
 * @param {string} template - Template-ul URL-ului
 * @param {Object} data - Datele pentru înlocuire
 * @returns {string} - URL-ul formatat
 */
function formatShareUrl(template, data) {
    return template
        .replace('{url}', encodeURIComponent(data.url))
        .replace('{title}', encodeURIComponent(data.title))
        .replace('{description}', encodeURIComponent(data.description))
        .replace('{image}', encodeURIComponent(data.image));
}

/**
 * Deschide un popup pentru partajare
 * @param {string} url - URL-ul de deschis
 * @param {string} title - Titlul ferestrei
 */
function openSharePopup(url, title) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);
    
    window.open(
        url,
        title,
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
    );
}

/**
 * Obține descrierea din meta tag
 * @returns {string} - Descrierea sau string gol
 */
function getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute('content') : '';
}

/**
 * Obține imaginea din meta tag og:image
 * @returns {string} - URL-ul imaginii sau string gol
 */
function getMetaImage() {
    const metaImage = document.querySelector('meta[property="og:image"]');
    return metaImage ? metaImage.getAttribute('content') : '';
}
