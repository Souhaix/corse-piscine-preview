(function () {
  const qs = new URLSearchParams(window.location.search);
  function cleanupGhlDuplicateEmbeds() {
    const keepFirst = (selector) => {
      const nodes = Array.from(document.querySelectorAll(selector));
      nodes.slice(1).forEach((node) => node.remove());
    };

    keepFirst(".site-header");
    keepFirst("main");
    keepFirst(".site-footer");
    keepFirst(".mobile-sticky");

    const styleLinks = Array.from(document.querySelectorAll('link[href*="corse-piscine-preview"][href*="styles"]'));
    const latest = styleLinks.find((link) => link.href.includes("styles-ghl-20260701-02.css"))
      || styleLinks.find((link) => link.href.includes("ghl-20260701-02"))
      || styleLinks[0];
    styleLinks.forEach((link) => {
      if (link !== latest) link.remove();
    });
  }

  cleanupGhlDuplicateEmbeds();
  window.addEventListener("load", cleanupGhlDuplicateEmbeds, { once: true });
  window.setTimeout(cleanupGhlDuplicateEmbeds, 0);
  window.setTimeout(cleanupGhlDuplicateEmbeds, 700);

  if (window.__CPP_LANDING_INITIALIZED__) return;
  window.__CPP_LANDING_INITIALIZED__ = true;

  const hiddenMap = {
    gclid: qs.get("gclid") || "",
    utm_source: qs.get("utm_source") || "",
    utm_medium: qs.get("utm_medium") || "",
    utm_campaign: qs.get("utm_campaign") || "",
    utm_term: qs.get("utm_term") || "",
    utm_content: qs.get("utm_content") || "",
    landing_page: window.location.pathname,
    device: window.matchMedia("(max-width: 759px)").matches ? "mobile" : "desktop",
    referrer: document.referrer || ""
  };

  document.querySelectorAll("[data-hidden-field]").forEach((field) => {
    const key = field.getAttribute("data-hidden-field");
    field.value = hiddenMap[key] || field.value || "";
  });

  function track(eventName, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, detail: detail || {} });
    if (window.console && console.debug) {
      console.debug("[tracking]", eventName, detail || {});
    }
  }

  document.querySelectorAll("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      const eventName = el.getAttribute("data-track");
      track(eventName, {
        source: eventName === "hero_form_start" ? "hero_cta_click" : "cta_click",
        text: el.textContent.trim(),
        href: el.getAttribute("href") || ""
      });
    });
  });

  function scrollCoqueAnchor(behavior = "smooth") {
    if (window.location.hash !== "#coque") return;
    const target = document.getElementById("coque");
    if (!target) return;
    const header = document.querySelector(".site-header");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerBottom - 24;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  function scheduleCoqueAnchor(behavior = "smooth") {
    [0, 260, 900].forEach((delay) => {
      window.setTimeout(() => scrollCoqueAnchor(delay ? "auto" : behavior), delay);
    });
  }

  window.addEventListener("load", () => {
    window.requestAnimationFrame(() => {
      scheduleCoqueAnchor("auto");
    });
  });

  window.addEventListener("hashchange", () => {
    window.requestAnimationFrame(() => scheduleCoqueAnchor("smooth"));
  });

  document.querySelectorAll("[data-format-choice]").forEach((el) => {
    el.addEventListener("click", () => {
      const formatSelect = document.getElementById("format");
      const value = el.getAttribute("data-format-choice");
      if (formatSelect && value) {
        formatSelect.value = value;
        formatSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });

  const faqButtons = Array.from(document.querySelectorAll("[data-faq-button]"));
  const reduceFaqMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setFaqState(button, open, options = {}) {
    const answerId = button.getAttribute("aria-controls");
    const answer = answerId ? document.getElementById(answerId) : null;
    const item = button.closest(".faq-item");
    if (!answer) return;

    const immediate = options.immediate || reduceFaqMotion;
    const isAlreadyOpen = button.getAttribute("aria-expanded") === "true";
    if (!options.force && isAlreadyOpen === open) return;

    button.setAttribute("aria-expanded", String(open));
    item?.classList.toggle("is-open", open);

    if (open) {
      answer.hidden = false;
      if (immediate) {
        answer.style.maxHeight = "none";
        return;
      }
      answer.style.maxHeight = "0px";
      answer.offsetHeight;
      answer.style.maxHeight = `${answer.scrollHeight}px`;
      window.setTimeout(() => {
        if (button.getAttribute("aria-expanded") === "true") {
          answer.style.maxHeight = "none";
        }
      }, 320);
      return;
    }

    if (immediate) {
      answer.hidden = true;
      answer.style.maxHeight = "0px";
      return;
    }

    answer.style.maxHeight = `${answer.scrollHeight}px`;
    answer.offsetHeight;
    answer.style.maxHeight = "0px";

    const hideWhenClosed = (event) => {
      if (event.propertyName !== "max-height") return;
      answer.removeEventListener("transitionend", hideWhenClosed);
      if (button.getAttribute("aria-expanded") === "false") {
        answer.hidden = true;
      }
    };
    answer.addEventListener("transitionend", hideWhenClosed);
  }

  if (faqButtons.length) {
    faqButtons.forEach((button, index) => {
      setFaqState(button, index === 0, { immediate: true, force: true });

      button.addEventListener("click", () => {
        const isOpen = button.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          setFaqState(button, false);
          return;
        }

        faqButtons.forEach((otherButton) => {
          setFaqState(otherButton, otherButton === button);
        });
      });
    });

    window.addEventListener("resize", () => {
      faqButtons.forEach((button) => {
        if (button.getAttribute("aria-expanded") !== "true") return;
        const answerId = button.getAttribute("aria-controls");
        const answer = answerId ? document.getElementById(answerId) : null;
        if (answer) answer.style.maxHeight = "none";
      });
    });
  }

  const form = document.getElementById("leadForm");
  const formError = document.getElementById("formError");
  const leadPanel = document.getElementById("formulaire");
  const mobileSticky = document.querySelector(".mobile-sticky");
  const siteHeader = document.querySelector(".site-header");

  if (form) {
    form.addEventListener("focusin", () => track("hero_form_start", { source: "form_focus" }), { once: true });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        if (formError) formError.hidden = false;
        form.reportValidity();
        return;
      }
      if (formError) formError.hidden = true;
      track(form.getAttribute("data-track-submit") || "hero_submit", {
        source: "form_submit",
        form_variant: form.querySelector("[name='form_variant']")?.value || "ghl_one_step_compact",
        format: form.elements.format.value,
        timeline: form.elements.timeline.value,
        commune: form.elements.commune.value
      });
      const thankYou = new URL(form.action, window.location.href);
      thankYou.searchParams.set("submitted", "1");
      thankYou.searchParams.set("format", form.elements.format.value);
      window.location.href = thankYou.toString();
    });
  }

  if (mobileSticky && leadPanel && "IntersectionObserver" in window) {
    const stickyHideTargets = [
      leadPanel,
      document.getElementById("contact"),
      document.querySelector(".site-footer")
    ].filter(Boolean);
    const visibleStickyHideTargets = new Set();
    const updateMobileSticky = () => {
      const hasScrolledPastIntro = window.scrollY > 260;
      const shouldHideSticky = !hasScrolledPastIntro || visibleStickyHideTargets.size > 0;
      mobileSticky.classList.toggle("is-hidden", shouldHideSticky);
      siteHeader?.classList.toggle("is-hidden-by-sticky", !shouldHideSticky);
    };
    const stickyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.02) {
          visibleStickyHideTargets.add(entry.target);
        } else {
          visibleStickyHideTargets.delete(entry.target);
        }
      });
      updateMobileSticky();
    }, { threshold: [0, 0.04, 0.16, 0.45], rootMargin: "96px 0px 96px 0px" });
    stickyHideTargets.forEach((target) => stickyObserver.observe(target));
    window.addEventListener("scroll", updateMobileSticky, { passive: true });
    updateMobileSticky();
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: "0px 0px 18% 0px" });
      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  const parallaxTarget = document.querySelector("[data-parallax]");
  if (parallaxTarget && !reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const offset = Math.min(window.scrollY * 0.08, 48);
        parallaxTarget.style.transform = `translateY(${offset}px) scale(1.055)`;
        ticking = false;
      });
    }, { passive: true });
  }
})();
