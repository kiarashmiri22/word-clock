(function () {
  "use strict";
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* 1. Loader (with safety timeout so it never gets stuck) */
  var loader = document.querySelector(".loader");
  function hideLoader() {
    if (loader) loader.classList.add("loaded");
  }
  window.addEventListener("load", function () {
    hideLoader();
    setTimeout(function () {
      var hero = document.querySelector(".hero");
      if (hero) hero.classList.add("is-in");
    }, 300);
  });
  setTimeout(hideLoader, 3500); // fallback

  /* 2. Cursor glow — only on fine pointers, skip if reduced motion */
  var cursorGlow = document.getElementById("cursor-glow");
  if (cursorGlow && finePointer && !reduceMotion) {
    var mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
    });
    (function loop() {
      cursorGlow.style.transform =
        "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  } else if (cursorGlow) {
    cursorGlow.style.display = "none";
  }

  /* 3. Navbar scroll state */
  var nav = document.getElementById("nav");
  window.addEventListener(
    "scroll",
    function () {
      nav.classList.toggle("scrolled", window.scrollY > 50);
    },
    { passive: true },
  );

  /* 4. Mobile menu */
  var burgerBtn = document.getElementById("burger-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  function setMenu(open) {
    burgerBtn.classList.toggle("active", open);
    mobileMenu.classList.toggle("active", open);
    burgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burgerBtn.addEventListener("click", function () {
    setMenu(!mobileMenu.classList.contains("active"));
  });
  document.querySelectorAll(".mobile-menu__link").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });

  /* 5. Theme switcher (+ dynamic browser theme-color) */
  var sunIcon = document.querySelector(".sun-icon");
  var moonIcon = document.querySelector(".moon-icon");
  var metaTheme = document.getElementById("meta-theme-color");
  function updateIcons(theme) {
    if (!sunIcon || !moonIcon) return;
    sunIcon.style.display = theme === "dark" ? "block" : "none";
    moonIcon.style.display = theme === "dark" ? "none" : "block";
  }
  function syncMeta(theme) {
    if (metaTheme)
      metaTheme.setAttribute(
        "content",
        theme === "dark" ? "#0c0c0b" : "#f8f6f2",
      );
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme");
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("halden-theme", next);
    } catch (e) {}
    updateIcons(next);
    syncMeta(next);
  }
  ["theme-toggle", "mobile-theme-toggle"].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener("click", toggleTheme);
  });
  var currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  updateIcons(currentTheme);
  syncMeta(currentTheme);

  /* 6. Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal-up");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  /* 7. Image load / error handling (fade skeletons, graceful fallback) */
  document
    .querySelectorAll(".about__image, .collection-card__img, .process__image")
    .forEach(function (img) {
      var wrap = img.closest(
        ".about__image-container, .collection-card__img-wrap, .process__image-wrap",
      );
      var sk = wrap ? wrap.querySelector(".skeleton") : null;
      function ok() {
        if (sk) sk.classList.add("fade-out");
        img.classList.add("loaded");
      }
      function fail() {
        if (sk) sk.classList.add("fade-out");
        img.classList.add("loaded");
        if (wrap) wrap.classList.add("img-fallback");
        img.style.opacity = "0";
      }
      if (img.complete) {
        img.naturalWidth > 0 ? ok() : fail();
      }
      img.addEventListener("load", ok);
      img.addEventListener("error", fail);
    });

  /* 8. Testimonials carousel */
  var slides = Array.prototype.slice.call(
    document.querySelectorAll(".t-slide"),
  );
  var dots = Array.prototype.slice.call(document.querySelectorAll(".t-dot"));
  var idx = 0,
    timer = null;
  function show(i) {
    slides.forEach(function (s, k) {
      s.classList.toggle("active", k === i);
    });
    dots.forEach(function (d, k) {
      d.classList.toggle("active", k === i);
    });
    idx = i;
  }
  function restart() {
    if (timer) clearInterval(timer);
    if (!reduceMotion && slides.length > 1)
      timer = setInterval(function () {
        show((idx + 1) % slides.length);
      }, 6000);
  }
  dots.forEach(function (d, k) {
    d.addEventListener("click", function () {
      show(k);
      restart();
    });
  });
  if (slides.length) {
    show(0);
    restart();
    var tWrap = document.querySelector(".testimonials");
    tWrap.addEventListener("mouseenter", function () {
      if (timer) clearInterval(timer);
    });
    tWrap.addEventListener("mouseleave", restart);
  }

  /* 9. Product quick-view modal */
  var modal = document.getElementById("product-modal");
  var mImg = document.getElementById("modal-img");
  var mImgWrap = document.getElementById("modal-img-wrap");
  var mTitle = document.getElementById("modal-title");
  var mDesc = document.getElementById("modal-desc");
  var mPrice = document.getElementById("modal-price");
  var mSpecs = document.getElementById("modal-specs");
  var lastFocused = null;
  function openModal(card) {
    lastFocused = document.activeElement;
    mTitle.textContent = card.dataset.title || "";
    mDesc.textContent = card.dataset.desc || "";
    mPrice.textContent = card.dataset.price || "";
    mImg.src = card.dataset.img || "";
    mImg.alt = card.dataset.title || "";
    mImgWrap.classList.remove("img-fallback");
    mImg.onerror = function () {
      mImgWrap.classList.add("img-fallback");
      mImg.style.opacity = "0";
    };
    mImg.onload = function () {
      mImg.style.opacity = "1";
    };
    mSpecs.innerHTML = "";
    (card.dataset.specs || "").split("·").forEach(function (s) {
      if (s.trim()) {
        var el = document.createElement("span");
        el.textContent = s.trim();
        mSpecs.appendChild(el);
      }
    });
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".modal__close");
    if (closeBtn) closeBtn.focus();
  }
  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }
  document.querySelectorAll(".collection-card").forEach(function (card) {
    card.addEventListener("click", function () {
      openModal(card);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(card);
      }
    });
  });
  modal.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  /* Global Escape: close menu + modal */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal.classList.contains("open")) closeModal();
      if (mobileMenu.classList.contains("active")) setMenu(false);
    }
  });

  /* 10. Contact form: loading + success/error states */
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action") || "";
      var btn = form.querySelector(".form-btn");
      if (action.indexOf("YOUR_FORM_ID") !== -1) {
        status.textContent =
          "Demo mode — add your Formspree ID to the form's action to enable sending.";
        status.className = "form-status show";
        return;
      }
      var original = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
      status.className = "form-status";
      status.textContent = "";
      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (res.ok) {
            form.reset();
            status.textContent =
              "Thank you — your inquiry has been sent. We'll be in touch shortly.";
            status.className = "form-status show success";
          } else {
            throw new Error("bad response");
          }
        })
        .catch(function () {
          status.textContent =
            "Something went wrong. Please email us directly at hello@haldenclocks.com.";
          status.className = "form-status show error";
        })
        .finally(function () {
          btn.disabled = false;
          btn.textContent = original;
        });
    });
  }

  /* 11. WORD CLOCK PARSING */
  var WORD_INDICES = {
    IT: [0, 1],
    IS: [3, 4],
    A: [11],
    QUARTER: [13, 14, 15, 16, 17, 18, 19],
    TWENTY: [22, 23, 24, 25, 26, 27],
    FIVE_MIN: [28, 29, 30, 31],
    HALF: [33, 34, 35, 36],
    TEN_MIN: [38, 39, 40],
    TO: [42, 43],
    PAST: [44, 45, 46, 47],
    ONE: [55, 56, 57],
    TWO: [74, 75, 76],
    THREE: [61, 62, 63, 64, 65],
    FOUR: [66, 67, 68, 69],
    FIVE_HOUR: [70, 71, 72, 73],
    SIX: [58, 59, 60],
    SEVEN: [88, 89, 90, 91, 92],
    EIGHT: [77, 78, 79, 80, 81],
    NINE: [51, 52, 53, 54],
    TEN_HOUR: [99, 100, 101],
    ELEVEN: [82, 83, 84, 85, 86, 87],
    TWELVE: [93, 94, 95, 96, 97, 98],
    OCLOCK: [104, 105, 106, 107, 108, 109],
  };
  var cells = document.querySelectorAll("#word-clock-grid .clock-cell");
  var digitalClock = document.getElementById("digital-clock");
  var lastKey = "";

  function updateWordClock() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var active = [];
    active.push.apply(active, WORD_INDICES.IT);
    active.push.apply(active, WORD_INDICES.IS);

    var hourOffset = minute >= 33 ? 1 : 0;

    if (minute >= 3 && minute <= 7) {
      active.push.apply(
        active,
        WORD_INDICES.FIVE_MIN.concat(WORD_INDICES.PAST),
      );
    } else if (minute >= 8 && minute <= 12) {
      active.push.apply(active, WORD_INDICES.TEN_MIN.concat(WORD_INDICES.PAST));
    } else if (minute >= 13 && minute <= 17) {
      active.push.apply(
        active,
        WORD_INDICES.A.concat(WORD_INDICES.QUARTER, WORD_INDICES.PAST),
      );
    } else if (minute >= 18 && minute <= 22) {
      active.push.apply(active, WORD_INDICES.TWENTY.concat(WORD_INDICES.PAST));
    } else if (minute >= 23 && minute <= 27) {
      active.push.apply(
        active,
        WORD_INDICES.TWENTY.concat(WORD_INDICES.FIVE_MIN, WORD_INDICES.PAST),
      );
    } else if (minute >= 28 && minute <= 32) {
      active.push.apply(active, WORD_INDICES.HALF.concat(WORD_INDICES.PAST));
    } else if (minute >= 33 && minute <= 37) {
      active.push.apply(
        active,
        WORD_INDICES.TWENTY.concat(WORD_INDICES.FIVE_MIN, WORD_INDICES.TO),
      );
    } else if (minute >= 38 && minute <= 42) {
      active.push.apply(active, WORD_INDICES.TWENTY.concat(WORD_INDICES.TO));
    } else if (minute >= 43 && minute <= 47) {
      active.push.apply(
        active,
        WORD_INDICES.A.concat(WORD_INDICES.QUARTER, WORD_INDICES.TO),
      );
    } else if (minute >= 48 && minute <= 52) {
      active.push.apply(active, WORD_INDICES.TEN_MIN.concat(WORD_INDICES.TO));
    } else if (minute >= 53 && minute <= 57) {
      active.push.apply(active, WORD_INDICES.FIVE_MIN.concat(WORD_INDICES.TO));
    } else {
      active.push.apply(active, WORD_INDICES.OCLOCK);
    }

    var currentHour = (hour + hourOffset) % 12;
    if (currentHour === 0) currentHour = 12;
    var hourMap = {
      1: "ONE",
      2: "TWO",
      3: "THREE",
      4: "FOUR",
      5: "FIVE_HOUR",
      6: "SIX",
      7: "SEVEN",
      8: "EIGHT",
      9: "NINE",
      10: "TEN_HOUR",
      11: "ELEVEN",
      12: "TWELVE",
    };
    active.push.apply(active, WORD_INDICES[hourMap[currentHour]]);

    // PERF: only touch the DOM when the illuminated set actually changes
    var key = active
      .slice()
      .sort(function (a, b) {
        return a - b;
      })
      .join(",");
    if (key !== lastKey) {
      cells.forEach(function (c) {
        c.classList.remove("is-active");
      });
      active.forEach(function (i) {
        if (cells[i]) cells[i].classList.add("is-active");
      });
      lastKey = key;
    }

    if (digitalClock) {
      digitalClock.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }
  updateWordClock();
  setInterval(updateWordClock, 1000);
})();
const letters = document.querySelectorAll("#logoText span");

letters.forEach((letter, index) => {
  letter.animate(
    [
      {
        opacity: 0,
        transform: "translateY(70px) rotateX(90deg)",
      },
      {
        opacity: 1,
        transform: "translateY(0) rotateX(0deg)",
      },
    ],

    {
      duration: 1000,

      delay: index * 120,

      fill: "forwards",

      easing: "cubic-bezier(.19,1,.22,1)",
    },
  );
});

const logo = document.querySelector(".luxury-logo");

const glow = document.createElement("div");

glow.style.cssText = `
position:absolute;
width:350px;
height:350px;
border-radius:50%;
background:radial-gradient(circle,
rgba(255,220,120,.35),
transparent 70%);
pointer-events:none;
filter:blur(45px);
transform:translate(-50%,-50%);
transition:opacity .3s;
opacity:0;
`;

logo.appendChild(glow);

logo.addEventListener("mousemove", (e) => {
  const rect = logo.getBoundingClientRect();

  glow.style.left = e.clientX - rect.left + "px";

  glow.style.top = e.clientY - rect.top + "px";

  glow.style.opacity = 1;
});

logo.addEventListener("mouseleave", () => {
  glow.style.opacity = 0;
});
