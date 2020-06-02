/**
 * List of all functions
 *
 * - liveBlock(attr)
 * - liveForm(attr)
 *
 * - responsiveImage(string)    Relative to Liip filters
 * - uncloakLinks(attr)
 * - convertFormFromRot13(attr)
 * - readableEmail(attr)
 * - convertImageLinkToWebPLink()
 */

/**
 * Fetch (ajax) function permitting to get block via a POST request
 * (prevent from spam)
 *
 * @param {string} attribute
 */
export function liveBlock(attribute = "data-live") {
  document.querySelectorAll("[" + attribute + "]").forEach(item => {
    fetch(item.getAttribute(attribute), {
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      method: "POST",
      credentials: "same-origin"
    })
      .then(function(response) {
        return response.text();
      })
      .then(function(body) {
        item.removeAttribute(attribute);
        item.innerHTML = body;

        document.dispatchEvent(new Event("DOMChanged"));
      });
  });
}

/**
 * ajaxify-form
 */
export function liveForm(selector = '.live-form') {
  document.querySelectorAll(selector).forEach(item => {
    if (item.querySelector("form") !== null) {
      item.querySelector("form").addEventListener("submit", e => {
        e.preventDefault();
        sendForm(e);
      });
    }
  });

  var setLoader = function (form) {
    var $submitButton = getSubmitButton(form);
    if ($submitButton !== null) {
      var initialButton = $submitButton.outerHTML;
      $submitButton.innerHTML = '';
      $submitButton.outerHTML = '<div style="width:1em;height:1em;border: 3px solid #222;border-top-color: #fff;border-radius: 50%;  animation: 1s spin linear infinite;"></div><style>@keyframes spin {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
    }
  }
  
  var sendForm = function(form) {
     setLoader(form);
     
    var formData = new FormData(form.srcElement);
    fetch(form.srcElement.action, {
      method: "POST",
      body: formData,
      credentials: "same-origin"
    })
      .then(function(response) {
        return response.text();
      })
      .then(function(body) {
        form.srcElement.outerHTML = body;

        document.dispatchEvent(new Event("DOMChanged"));
      })
      .then(function() {
        document.dispatchEvent(new Event("DOMChanged"));
      });
  };

  var getSubmitButton = function(form) {
    if (form.srcElement.querySelector("[type=submit]") !== null) {
      return form.srcElement.querySelector("[type=submit]");
    }
    if (form.srcElement.getElementsByTagName("button") !== null) {
      return form.srcElement.getElementsByTagName("button")[0];
    }
    return null;
  };
}

/**
 * Transform image's path (src) produce with Liip to responsive path
 *
 * @param {string} src
 */
export function responsiveImage(src) {
  var screenWidth = window.innerWidth;
  if (screenWidth <= 576) {
    src = src.replace("/default/", "/xs/");
  } else if (screenWidth <= 768) {
    src = src.replace("/default/", "/sm/");
  } else if (screenWidth <= 992) {
    src = src.replace("/default/", "/md/");
  } else if (screenWidth <= 1200) {
    src = src.replace("/default/", "/lg/");
  } else {
    // 1200+
    src = src.replace("/default/", "/xl/");
  }

  return src;
}

/**
 * Convert elements wich contain attribute (data-href) in normal link (a href)
 * You can use a callback function to decrypt the link (eg: rot13ToText ;-))
 *
 * @param {string}  attribute
 */
export async function uncloakLinks(attribute = "data-rot") {
  var convertLink = function(element) {
    // fix "bug" with img
    if (element.getAttribute(attribute) === null) {
      var element = element.closest("[" + attribute + "]");
    }
    if (element.getAttribute(attribute) === null) return;
    var link = document.createElement("a");
    var href = element.getAttribute(attribute);
    element.removeAttribute(attribute);
    for (var i = 0, n = element.attributes.length; i < n; i++) {
      link.setAttribute(
        element.attributes[i].nodeName,
        element.attributes[i].nodeValue
      );
    }
    link.innerHTML = element.innerHTML;
    link.setAttribute(
      "href",
      responsiveImage(convertShortchutForLink(rot13ToText(href)))
    );
    element.parentNode.replaceChild(link, element);
    return link;
  };

  var convertThemAll = function(attribute) {
    [].forEach.call(document.querySelectorAll("[" + attribute + "]"), function(
      element
    ) {
      convertLink(element);
    });
  };

  var fireEventLinksBuilt = async function(element, event) {
    await document.dispatchEvent(new Event("linksBuilt"));

    var clickEvent = new Event(event.type);
    element.dispatchEvent(clickEvent);
  };

  var convertLinkOnEvent = async function(event) {
    // convert them all if it's an image (thanks this bug), permit to use gallery (baguetteBox)
    if (event.target.tagName == "IMG") {
      await convertThemAll(attribute);
      var element = event.target;
    } else {
      var element = convertLink(event.target);
    }
    fireEventLinksBuilt(element, event);
  };

  [].forEach.call(document.querySelectorAll("[" + attribute + "]"), function(
    element
  ) {
    element.addEventListener(
      "touchstart",
      function(e) {
        convertLinkOnEvent(e);
      },
      { once: true }
    );
    element.addEventListener(
      "click",
      function(e) {
        convertLinkOnEvent(e);
      },
      { once: true }
    );
    element.addEventListener(
      "mouseover",
      function(e) {
        convertLinkOnEvent(e);
      },
      { once: true }
    );
  });
}

/**
 * Convert action attr encoded in rot 13 to normal action with default attr `data-frot`
 *
 * @param {string}  attribute
 */
export function convertFormFromRot13(attribute = "data-frot") {
  [].forEach.call(document.querySelectorAll("[" + attribute + "]"), function(
    element
  ) {
    var action = element.getAttribute(attribute);
    element.removeAttribute(attribute);
    element.setAttribute(
      "action",
      convertShortchutForLink(rot13ToText(action))
    );
  });
}

export function convertShortchutForLink(str) {
  if (str.charAt(0) == "-") {
    return str.replace("-", "http://");
  }
  if (str.charAt(0) == "_") {
    return str.replace("_", "https://");
  }
  if (str.charAt(0) == "@") {
    return str.replace("@", "mailto:");
  }
  return str;
}

/**
 * readableEmail(selector) Transform an email encoded with rot13 in a readable mail (and add mailto:)
 *
 * @param {string}  text
 */
export function readableEmail(selector) {
  document.querySelectorAll(selector).forEach(function(item) {
    var mail = rot13ToText(item.textContent);
    item.innerHTML = '<a href="mailto:' + mail + '">' + mail + "</a>";
    if (selector.charAt(0) == ".") {
      item.classList.remove(selector.substring(1));
    }
  });
}

/**
 * Decode rot13
 *
 * @param {string}  str
 */
export function rot13ToText(str) {
  return str.replace(/[a-zA-Z]/g, function(c) {
    return String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
    );
  });
}

export function testWebPSupport() {
  var elem = document.createElement("canvas");

  if (elem.getContext && elem.getContext("2d")) {
    return elem.toDataURL("image/webp").indexOf("data:image/webp") == 0;
  }

  return false;
}

/**
 * Used in ThemeComponent
 */
export function convertImageLinkToWebPLink() {
  var switchToWebP = function() {
    [].forEach.call(document.querySelectorAll("a[dwl]"), function(element) {
      var href = responsiveImage(element.getAttribute("dwl"));
      element.setAttribute("href", href);
      element.removeAttribute("dwl");
    });
  };

  if (testWebPSupport()) switchToWebP();
}

/**
 * Simple Image Lazy Loader
 * original from : https://davidwalsh.name/lazyload-image-fade
 *
 * @param {string}  attribute
 *
 * @example
 * imgLazyLoad()
 * <span data-img=/img/me.png>Tagada</span> or <img data-img=/img/me.png alt=Tagada>
 *
 * will be converted to
 *
 * <img src=/img/me.png alt=Tagada />
 * 
 * still used in piedvert. To remove ?!
 */
export function imgLazyLoad(attribute = "data-img") {
  [].forEach.call(document.querySelectorAll("[" + attribute + "]"), function(
    img
  ) {
    var newDomImg = document.createElement("img");
    var src = img.getAttribute(attribute);
    img.removeAttribute(attribute);
    for (var i = 0, n = img.attributes.length; i < n; i++) {
      newDomImg.setAttribute(
        img.attributes[i].nodeName,
        img.attributes[i].nodeValue
      );
    }
    if (newDomImg.getAttribute("alt") === null && img.textContent != "") {
      newDomImg.setAttribute("alt", img.textContent);
    }
    newDomImg.setAttribute(
      "src",
      typeof responsiveImage === "function" ? responsiveImage(src) : src
    );
    img.outerHTML = newDomImg.outerHTML;
  });
}
