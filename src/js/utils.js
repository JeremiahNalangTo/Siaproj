(function () {
  function $id(id) { return document.getElementById(id); }
  function el(tag, attrs = {}, children = '') {
    const e = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    if (typeof children === 'string') e.insertAdjacentHTML('beforeend', children);
    return e;
  }
  function nameFull(u) {
    if (!u) return '';
    return `${u.surname || ''}, ${u.givenName || ''} ${u.middleInitial || ''}`.trim();
  }
  window.__utils = { $id, el, nameFull };
})();