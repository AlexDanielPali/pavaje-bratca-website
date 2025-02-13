export function initializeSlider() {
    const sliders = document.querySelectorAll('.gallery__slider');
    
    sliders.forEach(slider => {
        const slides = slider.querySelector('.gallery__slides');
        const prevButton = slider.querySelector('.gallery__prev');
        const nextButton = slider.querySelector('.gallery__next');

        if (!slides || !prevButton || !nextButton) return;

        let currentSlide = 0;
        const slideElements = slides.children;
        const totalSlides = slideElements.length;

        function updateSlides() {
            const offset = -currentSlide * 100;
            slides.style.transform = `translateX(${offset}%)`;
        }

        prevButton.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateSlides();
        });

        nextButton.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlides();
        });

        // Initialize
        updateSlides();
    });
}