/**
 * List of all functions
 *
 * - getBlockFromSky(attr)
 * - formToSky(attr)
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
export function getBlockFromSky(attribute = "data-sky") {
  document.querySelectorAll("[" + attribute + "]").forEach(item => {
    fetch(item.getAttribute(attribute), {
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      method: "POST",
      // Later: maybe implement sending data form data-post
      // body: JSON.stringify({"contact": (document.getElementById("contact") !== null ? 1: 0)}),
      credentials: "same-origin"
    })
      .then(function(response) {
        return response.text();
      })
      .then(function(body) {
        item.removeAttribute("data-sky");
        item.innerHTML = body;

        // add export function to reDo on document dom ready
        if (typeof onPageLoaded === "function") {
          onPageLoaded();
        }
        if (typeof onDomLoaded === "function") {
          onDomLoaded();
        }
      });
  });
}

/**
 * ajaxify-form
 */
export function formToSky(userOptions = {}) {
  var options = {
    selector: ".ajax-form" // selector for ajax form
  };
  for (var attrname in userOptions) {
    options[attrname] = userOptions[attrname];
  }

  document.querySelectorAll(options.selector).forEach(item => {
    if (item.querySelector("form") !== null) {
      item.querySelector("form").addEventListener("submit", e => {
        e.preventDefault();
        sendFormToSky(e);
      });
    }
  });

  var sendFormToSky = function(form) {
    var $submitButton = getSubmitButton(form);
    if ($submitButton !== null) {
      var initialButton = getSubmitButton(form).outerHTML;
      $submitButton.outerHTML = '<i class="fa fa-spinner fa-spin"></i>';
    }

    //var formData = new FormData();
    var toSend = "";
    for (var i = 0; i < form.srcElement.length; ++i) {
      toSend +=
        encodeURI(form.srcElement[i].name) +
        "=" +
        encodeURI(form.srcElement[i].value) +
        "&";
    }

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener(
      "load",
      function() {
        form.srcElement.outerHTML = xmlhttp.responseText;
        formToSky();
      },
      false
    );
    xmlhttp.open("POST", form.srcElement.action, false);
    xmlhttp.setRequestHeader(
      "Content-type",
      "application/x-www-form-urlencoded"
    );
    xmlhttp.send(toSend);
  };

  var renderError = function(error) {
    var msg = "";
    for (var key in error) {
      if (error.hasOwnProperty(key)) {
        var obj = error[key];
        for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            msg += key + " : " + obj[prop] + "<br>";
          }
        }
      }
    }
    return msg;
  };

  var getSubmitButton = function(form) {
    if (form.srcElement.querySelector("[type=submit]") !== null) {
      return form.srcElement.querySelector("[type=submit]");
    }
    if (form.srcElement.getElementsByTagName("button") !== null) {
      return form.srcElement.getElementsByTagName("button");
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
        convertLinkOnFly(e);
      },
      { once: true }
    );
    element.addEventListener(
      "mouseover",
      function(e) {
        convertInLinksRot13OnFly(e);
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
