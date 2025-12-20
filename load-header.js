// Load header.html into the page
(function() {
    fetch('/header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
        })
        .catch(error => console.error('Error loading header:', error));
})();
