                                                                                                                                                    let fontSice = 100;

document.getElementById('accessibility-toggle').addEventListener("click", () => {
    document.getElementById('accessibility-menu').classList.toggle('hidden');
});

function adjustFontSize(change) {
    fontSice = Math.max(70, Math.min(200, fontSice + change * 10));
    document.body.style.fontSize = fontSice + '%';
    document.getElementById('font-size-display').innerText = fontSice + '%';
}

function toggleDyslexicFont(checkboox) {
    document.body.style.fontFamily = checkbox.checked ? "'OpenDyslexic', sans-serif'" : '';
}

function setContrast(type) {
    document.body.classList.remove('contrast-dark', 'contrast-high');
    if (type === 'dark') {
        document.body.classList.add('contrast-dark');
    } else if (type === 'high') {
        document.body.classList.add('contrast-high');
    }
}

function toggleHighlightTitles(checkboox) {
    const titles = document.querySelectorAll('h1, h2, h3');
    titles.forEach(el => el.style.backgroundColor = checkboox.checked ? '#ffff99' : '');
}

function toggleHighlightLinks(checkboox) {
    const links = document.querySelectorAll('a');
    links.forEach(el => el.style.backgroundColor = checkboox.checked ? '#ccffcc' : '');
}

function toggleBigCursor(checkboox) {
    document.body.style.cursor = checkboox.checked ? 'url(https://cur.cursors-4u.net/mechanics/mec-1/mec70.cur), auto' : '';
}