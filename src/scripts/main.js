const { colord } = require("colord");

const query = tag => 
  /** @type {HTMLElement[]} */ ([...document.querySelectorAll(tag)]);

function setupNavigation() {
  const pages = query("[data-page]");
  const navlinks = query("[data-navlink]");

  const togglePage = pageID => {
    pages.forEach(p => {
      const isCurrent = p.getAttribute("data-page") === pageID;
      p.hidden = !isCurrent;
    });
    navlinks.forEach(l => {
      const isCurrent = l.getAttribute("data-navlink") === pageID;
      isCurrent ? l.classList.add('current') : l.classList.remove('current');
    })
  }

  navlinks.forEach(l => 
    l.onclick = () => togglePage(l.getAttribute("data-navlink")));
}

function setupInputChecking() {
  const inputs = /** @type {HTMLInputElement[]} */ (query("input[pattern]"));
  inputs.forEach(i => {
    const isValid = () => 
      i.value.length === 4 || i.value.length === 7;

    const setColor = () => 
      i.parentElement.style.backgroundColor = isValid() ? i.value : '#eee';

    const setLabelTint = () => 
      isValid() && 
      colord(i.value).isDark() 
        ? i.classList.add('light') 
        : i.classList.remove('light');

    const assertHash = () => i.value.length === 0 && (i.value = '#');

    const assertValue = () => i.validity.patternMismatch
      ? i.value = i.getAttribute('value')
      : (i.setAttribute('value', i.value), setColor());

    assertHash();
    setLabelTint();
    setColor();

    i.oninput = function(e) {
      assertHash();
      setLabelTint();
      assertValue();
    }
  })
}

setupInputChecking();

setupNavigation();