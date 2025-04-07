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

setupNavigation();