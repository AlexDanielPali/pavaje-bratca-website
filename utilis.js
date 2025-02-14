export function updateDateTime() {
    const dateElement = document.getElementById('date');
    const timeElement = document.getElementById('time');

    function update() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };

        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('ro-RO', options);
        }

        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ro-RO');
        }
    }

    update();
    setInterval(update, 1000);
}