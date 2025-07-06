/**
 * Form Validation Module
 * 
 * Acest modul gestionează validarea formularelor și trimiterea acestora
 * Oferă funcționalitate pentru:
 * - Validare în timp real
 * - Mesaje de eroare personalizate
 * - Trimitere prin AJAX
 */

// Reguli de validare predefinite
const validationRules = {
    required: {
        validate: value => value.trim().length > 0,
        message: 'Acest câmp este obligatoriu.'
    },
    email: {
        validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Adresa de email nu este validă.'
    },
    phone: {
        validate: value => /^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/.test(value),
        message: 'Numărul de telefon nu este valid.'
    },
    minLength: {
        validate: (value, length) => value.trim().length >= length,
        message: (length) => `Acest câmp trebuie să conțină cel puțin ${length} caractere.`
    }
};

/**
 * Validează un câmp de formular în funcție de atributele data-*
 * @param {HTMLElement} field - Câmpul de validat
 * @returns {Object} - Rezultatul validării { valid: boolean, message: string }
 */
function validateField(field) {
    const value = field.value;
    let isValid = true;
    let errorMessage = '';
    
    // Verifică regula required
    if (field.hasAttribute('required') || field.hasAttribute('data-required')) {
        if (!validationRules.required.validate(value)) {
            isValid = false;
            errorMessage = field.getAttribute('data-required-message') || 
                          validationRules.required.message;
        }
    }
    
    // Verifică tipul de email
    if (isValid && (field.type === 'email' || field.hasAttribute('data-email'))) {
        if (!validationRules.email.validate(value) && value.trim() !== '') {
            isValid = false;
            errorMessage = field.getAttribute('data-email-message') || 
                          validationRules.email.message;
        }
    }
    
    // Verifică formatul de telefon
    if (isValid && field.hasAttribute('data-phone')) {
        if (!validationRules.phone.validate(value) && value.trim() !== '') {
            isValid = false;
            errorMessage = field.getAttribute('data-phone-message') || 
                          validationRules.phone.message;
        }
    }
    
    // Verifică lungimea minimă
    if (isValid && field.hasAttribute('data-min-length')) {
        const minLength = parseInt(field.getAttribute('data-min-length'), 10);
        if (!validationRules.minLength.validate(value, minLength) && value.trim() !== '') {
            isValid = false;
            errorMessage = field.getAttribute('data-min-length-message') || 
                          (typeof validationRules.minLength.message === 'function' ? 
                            validationRules.minLength.message(minLength) : 
                            validationRules.minLength.message);
        }
    }
    
    // Verifică pattern personalizat
    if (isValid && field.hasAttribute('pattern')) {
        const pattern = new RegExp(field.getAttribute('pattern'));
        if (!pattern.test(value) && value.trim() !== '') {
            isValid = false;
            errorMessage = field.getAttribute('data-pattern-message') || 
                          'Acest câmp nu respectă formatul cerut.';
        }
    }
    
    return { valid: isValid, message: errorMessage };
}

/**
 * Afișează sau ascunde un mesaj de eroare pentru un câmp
 * @param {HTMLElement} field - Câmpul asociat
 * @param {Object} validation - Rezultatul validării
 */
function toggleErrorMessage(field, validation) {
    // Caută containerul pentru mesaj de eroare
    let errorContainer = field.nextElementSibling;
    
    // Verifică dacă există și are clasa corectă, altfel creează unul
    if (!errorContainer || !errorContainer.classList.contains('form__error')) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'form__error';
        field.parentNode.insertBefore(errorContainer, field.nextSibling);
    }
    
    // Actualizează starea și mesajul
    if (!validation.valid) {
        field.classList.add('form__field--error');
        errorContainer.textContent = validation.message;
        errorContainer.style.display = 'block';
    } else {
        field.classList.remove('form__field--error');
        errorContainer.style.display = 'none';
    }
}

/**
 * Inițializează validarea pentru un formular
 * @param {string|HTMLFormElement} form - Selectorul sau elementul formularului
 * @param {Object} options - Opțiuni de configurare
 */
export function initializeFormValidation(form, options = {}) {
    // Default options
    const defaultOptions = {
        realtime: true,
        submitHandler: null,
        errorClass: 'form__field--error',
        successClass: 'form__field--valid'
    };
    
    // Merge options
    const config = { ...defaultOptions, ...options };
    
    // Get the form element
    const formElement = typeof form === 'string' ? 
                        document.querySelector(form) : 
                        form;
    
    if (!formElement) return;
    
    // Toate câmpurile care necesită validare
    const fields = formElement.querySelectorAll('input, textarea, select');
    
    // Adaugă eveniment pentru validare în timp real
    if (config.realtime) {
        fields.forEach(field => {
            ['input', 'blur', 'change'].forEach(eventType => {
                field.addEventListener(eventType, () => {
                    const validation = validateField(field);
                    toggleErrorMessage(field, validation);
                    
                    // Adaugă sau elimină clasa de succes
                    if (validation.valid && field.value.trim() !== '') {
                        field.classList.add(config.successClass);
                    } else {
                        field.classList.remove(config.successClass);
                    }
                });
            });
        });
    }
    
    // Adaugă eveniment de submit
    formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validează toate câmpurile
        let isFormValid = true;
        
        fields.forEach(field => {
            const validation = validateField(field);
            toggleErrorMessage(field, validation);
            
            if (!validation.valid) {
                isFormValid = false;
                
                // Adaugă focus pe primul câmp invalid
                if (field.classList.contains(config.errorClass)) {
                    field.focus();
                }
            }
        });
        
        // Dacă formularul este valid, continuă cu handler-ul de submit
        if (isFormValid && typeof config.submitHandler === 'function') {
            config.submitHandler(formElement);
        } else if (isFormValid) {
            // Dacă nu există handler personalizat, trimite formularul normal
            formElement.submit();
        }
    });
    
    return {
        validate: () => {
            // Validează toate câmpurile și returnează rezultatul
            let isFormValid = true;
            
            fields.forEach(field => {
                const validation = validateField(field);
                toggleErrorMessage(field, validation);
                
                if (!validation.valid) {
                    isFormValid = false;
                }
            });
            
            return isFormValid;
        },
        reset: () => {
            // Resetează formularul și stările de validare
            formElement.reset();
            
            fields.forEach(field => {
                field.classList.remove(config.errorClass, config.successClass);
                
                // Ascunde mesajele de eroare
                const errorContainer = field.nextElementSibling;
                if (errorContainer && errorContainer.classList.contains('form__error')) {
                    errorContainer.style.display = 'none';
                }
            });
        }
    };
}

/**
 * Trimite un formular prin AJAX
 * @param {HTMLFormElement} form - Formularul de trimis
 * @param {Object} options - Opțiuni pentru request
 * @returns {Promise} - Promise cu răspunsul
 */
export function submitFormAjax(form, options = {}) {
    // Default options
    const defaultOptions = {
        method: form.method || 'POST',
        url: form.action,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    };
    
    // Merge options
    const config = { ...defaultOptions, ...options };
    
    // Colectează datele din formular
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        data[key] = value;
    });
    
    // Creează și returnează un Promise
    return new Promise((resolve, reject) => {
        fetch(config.url, {
            method: config.method,
            headers: config.headers,
            body: JSON.stringify(data),
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(resolve)
        .catch(reject);
    });
}
