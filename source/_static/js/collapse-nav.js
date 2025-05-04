document.addEventListener('DOMContentLoaded', function() {
    // Wait for theme to fully initialize
    setTimeout(function() {
        // Collapse all non-active sections
        const sections = document.querySelectorAll('.md-nav__item--section');
        sections.forEach(section => {
            const toggle = section.querySelector('.md-nav__toggle');
            const nested = section.querySelector('.md-nav');

            // Skip active sections and their parents
            if (!section.classList.contains('md-nav__item--active') &&
                !nested.classList.contains('md-nav--active')) {
                if (toggle) toggle.checked = false;
                if (nested) nested.style.display = 'none';
            }
        });

        // Properly handle clicks after our modifications
        document.querySelectorAll('.md-nav__toggle').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const nested = this.closest('.md-nav__item').querySelector('.md-nav');
                if (nested) nested.style.display = this.checked ? 'block' : 'none';
            });
        });
    }, 200);
});