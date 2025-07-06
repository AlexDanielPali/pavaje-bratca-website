/**
 * Performance Optimizations Module
 * 
 * Acest modul conține funcționalități pentru optimizarea performanței site-ului
 * prin tehnici avansate de încărcare și execuție JavaScript
 */

/**
 * Configurație implicită
 */
const defaultConfig = {
    minIdleTime: 1000, // timpul minim de inactivitate pentru a executa sarcini (ms)
    chunkSize: 3, // numărul de operațiuni per chunk
    priorityThreshold: 500, // pragul pentru sarcinile de prioritate înaltă (ms)
    enableIntersectionLoading: true, // activează încărcarea bazată pe IntersectionObserver
    debugMode: false // afișează log-uri de debug în consolă
};

/**
 * Clase de priorități pentru sarcini
 */
const PRIORITY = {
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
    IDLE: 'idle'
};

// Queue pentru sarcini
const taskQueue = {
    [PRIORITY.HIGH]: [],
    [PRIORITY.NORMAL]: [],
    [PRIORITY.LOW]: [],
    [PRIORITY.IDLE]: []
};

let isProcessing = false;
let config = { ...defaultConfig };

/**
 * Inițializează modulul de optimizare a performanței
 * @param {Object} options - Opțiuni de configurare
 * @returns {Object} - API pentru modulul de optimizare
 */
export function initializePerformance(options = {}) {
    // Merge options
    config = { ...defaultConfig, ...options };
    
    // Detectează suport pentru API-uri moderne
    const features = detectFeatures();
    
    // Start processing
    startProcessing();
    
    // Return public API
    return {
        /**
         * Adaugă o sarcină în coada de execuție
         * @param {Function} task - Funcția de executat
         * @param {string} priority - Prioritatea sarcinii (high, normal, low, idle)
         * @param {Object} options - Opțiuni suplimentare
         * @returns {Promise} - Promise care se rezolvă când sarcina este executată
         */
        enqueue(task, priority = PRIORITY.NORMAL, options = {}) {
            return new Promise((resolve, reject) => {
                const taskItem = {
                    task,
                    priority,
                    options,
                    resolve,
                    reject,
                    addedTime: Date.now()
                };
                
                taskQueue[priority].push(taskItem);
                
                if (config.debugMode) {
                    console.log(`Task adăugat în coada ${priority}`);
                }
                
                // Pentru sarcinile de prioritate înaltă, procesează imediat
                if (priority === PRIORITY.HIGH && !isProcessing) {
                    processQueue();
                }
            });
        },
        
        /**
         * Verifică starea cozilor de sarcini
         * @returns {Object} - Statistici despre cozile de sarcini
         */
        getStats() {
            return {
                high: taskQueue[PRIORITY.HIGH].length,
                normal: taskQueue[PRIORITY.NORMAL].length,
                low: taskQueue[PRIORITY.LOW].length,
                idle: taskQueue[PRIORITY.IDLE].length,
                isProcessing
            };
        },
        
        /**
         * Încarcă resurse JavaScript lazy
         * @param {string} url - URL-ul scriptului de încărcat
         * @param {Object} options - Opțiuni pentru încărcare
         * @returns {Promise} - Promise care se rezolvă când scriptul este încărcat
         */
        loadScript(url, options = {}) {
            const priority = options.priority || PRIORITY.NORMAL;
            
            return this.enqueue(() => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    
                    if (options.async) script.async = true;
                    if (options.defer) script.defer = true;
                    if (options.module) script.type = 'module';
                    if (options.integrity) script.integrity = options.integrity;
                    if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
                    
                    script.onload = resolve;
                    script.onerror = reject;
                    
                    document.head.appendChild(script);
                });
            }, priority);
        },
        
        /**
         * Încarcă resurse când sunt vizibile în viewport
         * @param {string} selector - Selector pentru elementele care declanșează încărcarea
         * @param {Function} callback - Funcție de callback la vizibilitate
         * @param {Object} options - Opțiuni pentru IntersectionObserver
         */
        loadWhenVisible(selector, callback, options = {}) {
            if (!config.enableIntersectionLoading || !('IntersectionObserver' in window)) {
                // Fallback pentru browsere fără suport
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    this.enqueue(() => callback(el), PRIORITY.NORMAL);
                });
                return;
            }
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.enqueue(() => callback(entry.target), PRIORITY.HIGH);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: options.rootMargin || '0px',
                threshold: options.threshold || 0.1
            });
            
            document.querySelectorAll(selector).forEach(el => {
                observer.observe(el);
            });
        },
        
        /**
         * Actualizează configurația
         * @param {Object} newOptions - Noile opțiuni
         */
        updateConfig(newOptions = {}) {
            config = { ...config, ...newOptions };
        }
    };
}

/**
 * Pornește procesarea sarcinilor
 */
function startProcessing() {
    // Procesează sarcinile la intervale regulate
    setInterval(() => {
        if (!isProcessing) {
            processQueue();
        }
    }, 100);
    
    // Procesează în timpul idle
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(processIdleTasks, { timeout: 1000 });
    } else {
        // Fallback pentru browsere fără suport pentru requestIdleCallback
        setTimeout(processIdleTasks, 1000);
    }
}

/**
 * Procesează cozile de sarcini în ordinea priorităților
 */
function processQueue() {
    if (isProcessing) return;
    
    isProcessing = true;
    
    // Verifică sarcinile de prioritate ridicată care așteaptă de prea mult timp
    promoteOldTasks();
    
    // Procesează sarcinile din cozi în ordinea priorităților
    const taskLists = [
        taskQueue[PRIORITY.HIGH],
        taskQueue[PRIORITY.NORMAL],
        taskQueue[PRIORITY.LOW]
    ];
    
    // Găsește prima coadă cu sarcini
    let currentQueue = taskLists.find(queue => queue.length > 0);
    
    if (currentQueue && currentQueue.length > 0) {
        // Execută un număr limitat de sarcini pentru a evita blocarea
        const tasksToProcess = currentQueue.splice(0, config.chunkSize);
        
        Promise.all(
            tasksToProcess.map(taskItem => {
                try {
                    return Promise.resolve(taskItem.task())
                        .then(result => taskItem.resolve(result))
                        .catch(error => taskItem.reject(error));
                } catch (error) {
                    taskItem.reject(error);
                    return Promise.resolve(); // Continuăm cu următoarea sarcină
                }
            })
        )
        .finally(() => {
            isProcessing = false;
            
            // Dacă mai sunt sarcini, programează următoarea iterație
            if (taskQueue[PRIORITY.HIGH].length > 0) {
                setTimeout(processQueue, 0);
            }
        });
    } else {
        isProcessing = false;
    }
}

/**
 * Procesează sarcinile în timpul idle
 * @param {IdleDeadline|undefined} deadline - Deadline pentru idle callback
 */
function processIdleTasks(deadline) {
    const hasDeadline = typeof deadline !== 'undefined' && typeof deadline.timeRemaining === 'function';
    
    // Verifică dacă avem timp disponibil
    while (
        taskQueue[PRIORITY.IDLE].length > 0 && 
        (!hasDeadline || deadline.timeRemaining() > 0)
    ) {
        const taskItem = taskQueue[PRIORITY.IDLE].shift();
        
        try {
            const result = taskItem.task();
            taskItem.resolve(result);
        } catch (error) {
            taskItem.reject(error);
        }
    }
    
    // Programează următoarea iterație
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(processIdleTasks, { timeout: 1000 });
    } else {
        setTimeout(processIdleTasks, 1000);
    }
}

/**
 * Promovează sarcinile vechi la prioritate mai mare
 */
function promoteOldTasks() {
    const currentTime = Date.now();
    
    // Promovează din NORMAL la HIGH dacă așteaptă de prea mult timp
    const normalToPromote = taskQueue[PRIORITY.NORMAL].filter(task => 
        currentTime - task.addedTime > config.priorityThreshold
    );
    
    if (normalToPromote.length > 0) {
        taskQueue[PRIORITY.NORMAL] = taskQueue[PRIORITY.NORMAL].filter(task => 
            currentTime - task.addedTime <= config.priorityThreshold
        );
        taskQueue[PRIORITY.HIGH].push(...normalToPromote);
        
        if (config.debugMode) {
            console.log(`${normalToPromote.length} sarcini promovate de la NORMAL la HIGH`);
        }
    }
    
    // Promovează din LOW la NORMAL dacă așteaptă de prea mult timp
    const lowToPromote = taskQueue[PRIORITY.LOW].filter(task => 
        currentTime - task.addedTime > config.priorityThreshold * 2
    );
    
    if (lowToPromote.length > 0) {
        taskQueue[PRIORITY.LOW] = taskQueue[PRIORITY.LOW].filter(task => 
            currentTime - task.addedTime <= config.priorityThreshold * 2
        );
        taskQueue[PRIORITY.NORMAL].push(...lowToPromote);
        
        if (config.debugMode) {
            console.log(`${lowToPromote.length} sarcini promovate de la LOW la NORMAL`);
        }
    }
}

/**
 * Detectează suportul pentru API-uri moderne
 * @returns {Object} - Obiect cu flags pentru features
 */
function detectFeatures() {
    return {
        intersectionObserver: 'IntersectionObserver' in window,
        idleCallback: 'requestIdleCallback' in window,
        resizeObserver: 'ResizeObserver' in window,
        mutationObserver: 'MutationObserver' in window,
        matchMedia: 'matchMedia' in window,
        passiveEvents: (function() {
            let passive = false;
            try {
                const options = Object.defineProperty({}, 'passive', {
                    get: function() {
                        passive = true;
                    }
                });
                window.addEventListener('test', null, options);
                window.removeEventListener('test', null, options);
            } catch (e) {}
            return passive;
        })()
    };
}
