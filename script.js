/* ============================================================
   SCRIPT.JS — Portfolio Livre (ZHARDWARE)
   Gère : PageFlip (tournage de pages), navigation prev/next/dots,
   menu mobile + sous-menus, starfield,
   formulaire de contact via EmailJS.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     0) THEME TOGGLE — Basculer entre thème clair et sombre
     ============================================================ */
  const themeToggleBtn = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const htmlElement = document.documentElement;
  
  // Récupérer le thème sauvegardé ou utiliser sombre par défaut
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // Appliquer le thème sauvegardé au chargement
  function applyTheme(theme) {
    if (theme === 'light') {
      htmlElement.classList.add('theme-light');
      if (themeIcon) {
        themeIcon.classList.remove('bx-moon');
        themeIcon.classList.add('bx-sun');
      }
    } else {
      htmlElement.classList.remove('theme-light');
      if (themeIcon) {
        themeIcon.classList.remove('bx-sun');
        themeIcon.classList.add('bx-moon');
      }
    }
  }
  
  // Appliquer le thème sauvegardé
  applyTheme(savedTheme);
  
  // Gérer le clic sur le bouton de thème
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = htmlElement.classList.contains('theme-light');
      const newTheme = isLight ? 'dark' : 'light';
      
      // Animation de rotation
      themeToggleBtn.classList.add('rotating');
      setTimeout(() => {
        themeToggleBtn.classList.remove('rotating');
      }, 500);
      
      // Appliquer et sauvegarder le nouveau thème
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  /* ============================================================
     1) PAGEFLIP — coeur du livre
     ============================================================ */
  const flipBookEl = document.getElementById("flipBook");
  let pageFlip = null;
  const menuIcon = document.getElementById("menu-icon");
  const navbar = document.getElementById("book-toc");
  const submenuItems = Array.from(
    document.querySelectorAll(".nav-item.has-submenu"),
  );

  // Alias : certains liens de navigation pointent vers un chapitre
  // qui n'a pas de page dédiée (ex: "service" -> première page services)
  const CHAPTER_ALIASES = {
    service: "maintenance",
    portfolio: "portfolio-selection", // Boutons "voir mes réalisations" pointent vers portfolio-selection
  };

  function resolveChapter(name) {
    return CHAPTER_ALIASES[name] || name;
  }

  function matchesChapter(link, activeChapter) {
    const chapter = link.getAttribute("data-chapter");
    const chapterGroup = link.getAttribute("data-chapter-group");

    if (chapter === activeChapter) return true;
    if (!chapterGroup || !activeChapter) return false;

    return (
      activeChapter === chapterGroup ||
      activeChapter.startsWith(`${chapterGroup}-`)
    );
  }

  function getChapterLabel(chapter) {
    const navLink = document.querySelector(
      `.book-toc a[data-chapter="${chapter}"]`,
    );
    return navLink ? navLink.textContent.replace(/\s+/g, " ").trim() : chapter;
  }

  function setMenuOpen(isOpen) {
    if (menuIcon) {
      menuIcon.classList.toggle("bx-x", isOpen);
      menuIcon.setAttribute("aria-expanded", String(isOpen));
      menuIcon.setAttribute(
        "aria-label",
        isOpen ? "Fermer le menu" : "Ouvrir le menu",
      );
    }
    if (navbar) navbar.classList.toggle("active", isOpen);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function setSubmenuOpen(item, isOpen, options = {}) {
    if (!item) return;
    const { focusTarget = "none" } = options;
    const parentLink = item.querySelector(".nav-parent");
    const submenu = item.querySelector(".nav-submenu");
    if (!parentLink || !submenu) return;

    item.classList.toggle("submenu-open", isOpen);
    parentLink.setAttribute("aria-expanded", String(isOpen));
    submenu.hidden = !isOpen;

    if (!isOpen) return;

    const menuItems = submenu.querySelectorAll('[role="menuitem"]');
    if (focusTarget === "first") menuItems[0]?.focus();
    if (focusTarget === "last") menuItems[menuItems.length - 1]?.focus();
  }

  function closeAllSubmenus(exceptItem = null) {
    submenuItems.forEach((item) => {
      if (item !== exceptItem) setSubmenuOpen(item, false);
    });
  }

  function closeTransientNavigation() {
    closeMenu();
    closeAllSubmenus();
  }

  if (flipBookEl && window.St && window.St.PageFlip) {
    const pages = flipBookEl.querySelectorAll(".flip-page");
    const pageSheets = Array.from(pages, (page) => page.querySelector(".page-sheet"));

    pageFlip = new St.PageFlip(flipBookEl, {
      width: 550,
      height: 733,
      size: "stretch",
      minWidth: 260,
      maxWidth: 1200,
      minHeight: 360,
      maxHeight: 1600,
      maxShadowOpacity: 0.5,
      showCover: true,
      mobileScrollSupport: true,
      usePortrait: true,
      autoSize: true,
      drawShadow: true,
    });

    pageFlip.loadFromHTML(pages);

    // Empêche PageFlip de capter les interactions dans les zones de saisie.
    const protectedInteractiveSelectors = [
      ".contact-form",
      ".contact-form input",
      ".contact-form textarea",
      ".contact-form button",
      ".contact-form label",
      ".contact-form select",
      ".contact-form option",
    ];

    const stopFlipPropagation = (event) => {
      event.stopPropagation();
    };

    document
      .querySelectorAll(protectedInteractiveSelectors.join(", "))
      .forEach((element) => {
        ["pointerdown", "mousedown", "touchstart", "click"].forEach((eventName) => {
          element.addEventListener(eventName, stopFlipPropagation, {
            passive: true,
          });
        });
      });

    /* --- Construit la liste ordonnée des chapitres (un dot par chapitre) --- */
    const chapterOrder = [];
    pages.forEach((p, index) => {
      const chapter = p.getAttribute("data-chapter");
      if (chapter && !chapterOrder.some((c) => c.chapter === chapter)) {
        chapterOrder.push({ chapter, firstPageIndex: index });
      }
    });

    /* --- Génère les points de navigation (dots) --- */
    const dotsContainer = document.getElementById("bookDots");
    const focusDotByIndex = (targetIndex) => {
      if (!dotsContainer) return;
      const dotButtons = Array.from(dotsContainer.querySelectorAll(".book-dot"));
      if (!dotButtons.length) return;

      const safeIndex =
        ((targetIndex % dotButtons.length) + dotButtons.length) %
        dotButtons.length;

      dotButtons.forEach((button, index) => {
        button.tabIndex = index === safeIndex ? 0 : -1;
      });
      dotButtons[safeIndex].focus();
    };

    if (dotsContainer) {
      chapterOrder.forEach((entry, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "book-dot";
        dot.setAttribute("aria-label", `Aller au chapitre ${getChapterLabel(entry.chapter)}`);
        dot.setAttribute("aria-pressed", "false");
        dot.tabIndex = index === 0 ? 0 : -1;
        dot.dataset.chapter = entry.chapter;
        dot.addEventListener("click", () => {
          pageFlip.flip(entry.firstPageIndex);
        });
        dot.addEventListener("keydown", (e) => {
          const dotButtons = Array.from(
            dotsContainer.querySelectorAll(".book-dot"),
          );
          const currentIndex = dotButtons.indexOf(dot);

          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            focusDotByIndex(currentIndex + 1);
          }

          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            focusDotByIndex(currentIndex - 1);
          }

          if (e.key === "Home") {
            e.preventDefault();
            focusDotByIndex(0);
          }

          if (e.key === "End") {
            e.preventDefault();
            focusDotByIndex(dotButtons.length - 1);
          }

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            dot.click();
          }
        });
        dotsContainer.appendChild(dot);
      });
    }

    const pageLabel = document.getElementById("bookPageLabel");
    const prevBtn = document.getElementById("bookPrev");
    const nextBtn = document.getElementById("bookNext");

    function updateActivePageEffects(pageIndex) {
      const totalPages = pages.length;
      const activePageIndexes = new Set([pageIndex]);

      if (pageIndex === 0) {
        activePageIndexes.add(1);
      } else if (pageIndex >= totalPages - 1) {
        activePageIndexes.add(totalPages - 2);
      } else if (pageIndex % 2 === 0) {
        activePageIndexes.add(pageIndex - 1);
      } else {
        activePageIndexes.add(pageIndex + 1);
      }

      pageSheets.forEach((sheet, index) => {
        if (!sheet || sheet.classList.contains("cover-sheet")) return;
        sheet.classList.toggle("is-page-active", activePageIndexes.has(index));
      });
    }

    function currentChapterFor(pageIndex) {
      let current = chapterOrder[0];
      for (const entry of chapterOrder) {
        if (entry.firstPageIndex <= pageIndex) current = entry;
        else break;
      }
      return current ? current.chapter : null;
    }

    function updateUI(pageIndex) {
      const total = pageFlip.getPageCount();

      // Libellé de page
      if (pageLabel) {
        if (pageIndex === 0) {
          pageLabel.textContent = "Couverture";
        } else if (pageIndex === total - 1) {
          pageLabel.textContent = "Fin du livre";
        } else {
          pageLabel.textContent = `Page ${pageIndex + 1} / ${total}`;
        }
      }

      // Boutons prev/next désactivés aux extrémités
      if (prevBtn) prevBtn.disabled = pageIndex <= 0;
      if (nextBtn) nextBtn.disabled = pageIndex >= total - 1;

      // Dot actif
      const activeChapter = currentChapterFor(pageIndex);
      if (dotsContainer) {
        dotsContainer.querySelectorAll(".book-dot").forEach((d) => {
          const isActive = d.dataset.chapter === activeChapter;
          d.classList.toggle("active", isActive);
          d.setAttribute("aria-pressed", String(isActive));
          d.tabIndex = isActive ? 0 : -1;
        });
      }

      // Lien de nav actif (header)
      document.querySelectorAll(".book-toc a[data-chapter]").forEach((a) => {
        const isActive = matchesChapter(a, activeChapter);
        a.classList.toggle(
          "active",
          isActive,
        );
        if (isActive) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });

      updateActivePageEffects(pageIndex);
    }

    pageFlip.on("flip", (e) => {
      updateUI(e.data);
      if (typeof window.__onBookFlip === "function") {
        window.__onBookFlip(e.data);
      }
    });
    updateUI(0);

    if (prevBtn) prevBtn.addEventListener("click", () => pageFlip.flipPrev());
    if (nextBtn) nextBtn.addEventListener("click", () => pageFlip.flipNext());

    // Navigation clavier (flèches), désactivée si on tape dans un champ
    document.addEventListener("keydown", (e) => {
      const activeElement = document.activeElement;
      const tag = activeElement ? activeElement.tagName : "";

      if (e.key === "Escape") {
        closeTransientNavigation();
        return;
      }

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        activeElement?.isContentEditable ||
        activeElement?.closest("#bookDots") ||
        activeElement?.closest(".nav-submenu") ||
        activeElement?.id === "menu-icon"
      ) {
        return;
      }

      if (e.key === "ArrowRight") pageFlip.flipNext();
      if (e.key === "ArrowLeft") pageFlip.flipPrev();
    });

    // Fonction globale de navigation par chapitre (data-goto, liens du menu)
    window.goToChapter = function (chapterName) {
      const resolved = resolveChapter(chapterName);
      const entry = chapterOrder.find((c) => c.chapter === resolved);
      if (entry) pageFlip.flip(entry.firstPageIndex);
      closeAllSubmenus();
    };
  } else if (flipBookEl) {
    console.error(
      "❌ PageFlip (St.PageFlip) non disponible — vérifier le chargement de page-flip.browser.min.js",
    );
    flipBookEl.classList.add("flip-fallback");
    flipBookEl.querySelectorAll(".page-sheet:not(.cover-sheet)").forEach((sheet) => {
      sheet.classList.add("is-page-active");
    });
    const controls = document.querySelector(".book-controls");
    if (controls) controls.style.display = "none";
    const hint = document.querySelector(".book-hint");
    if (hint)
      hint.textContent =
        "Le mode livre interactif n'a pas pu se charger. Faites défiler pour lire.";
  }

  /* --- Boutons/liens qui naviguent vers un chapitre --- */
  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const chapter = el.getAttribute("data-goto");
      if (window.goToChapter) window.goToChapter(chapter);
    });
  });

  document
    .querySelectorAll(".book-toc a[data-chapter], .nav-submenu a[data-chapter]")
    .forEach((el) => {
      el.addEventListener("click", (e) => {
        const parentItem = el.closest(".nav-item.has-submenu");
        const isParentTrigger = el.classList.contains("nav-parent");

        if (
          isParentTrigger &&
          parentItem &&
          !parentItem.classList.contains("submenu-open")
        ) {
          e.preventDefault();
          closeAllSubmenus(parentItem);
          setSubmenuOpen(parentItem, true);
          return;
        }

        e.preventDefault();
        const chapter = el.getAttribute("data-chapter");
        if (window.goToChapter) window.goToChapter(chapter);

        // Ferme le menu mobile après un clic
        closeTransientNavigation();
      });
    });

  /* ============================================================
     2) MENU MOBILE + SOUS-MENUS
     ============================================================ */
  if (menuIcon && navbar) {
    menuIcon.addEventListener("click", () => {
      const willOpen = !navbar.classList.contains("active");
      setMenuOpen(willOpen);
      if (!willOpen) closeAllSubmenus();
    });
  }

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 900) closeTransientNavigation();
    },
    { passive: true },
  );

  // Sous-menus (À propos / Services) : clic sur le chevron pour ouvrir/fermer
  submenuItems.forEach((item) => {
    const parentLink = item.querySelector(".nav-parent");
    const caret = item.querySelector(".nav-caret");
    const submenu = item.querySelector(".nav-submenu");
    if (!parentLink || !submenu) return;

    setSubmenuOpen(item, false);

    if (caret) {
      caret.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !item.classList.contains("submenu-open");
        closeAllSubmenus(isOpen ? item : null);
        setSubmenuOpen(item, isOpen);
      });
    }

    parentLink.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        closeAllSubmenus(item);
        setSubmenuOpen(item, true, { focusTarget: "first" });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        closeAllSubmenus(item);
        setSubmenuOpen(item, true, { focusTarget: "last" });
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setSubmenuOpen(item, false);
        parentLink.focus();
      }
    });

    const submenuLinks = Array.from(
      submenu.querySelectorAll('a[role="menuitem"]'),
    );

    submenuLinks.forEach((link, index) => {
      link.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setSubmenuOpen(item, false);
          parentLink.focus();
        }

        if (e.key === "ArrowDown") {
          e.preventDefault();
          submenuLinks[(index + 1) % submenuLinks.length]?.focus();
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          submenuLinks[
            (index - 1 + submenuLinks.length) % submenuLinks.length
          ]?.focus();
        }

        if (e.key === "Home") {
          e.preventDefault();
          submenuLinks[0]?.focus();
        }

        if (e.key === "End") {
          e.preventDefault();
          submenuLinks[submenuLinks.length - 1]?.focus();
        }
      });
    });
  });

  // Ferme les sous-menus ouverts si on clique ailleurs
  document.addEventListener("click", (e) => {
    submenuItems.forEach((item) => {
      if (!item.contains(e.target)) setSubmenuOpen(item, false);
    });
  });

  /* ============================================================
     3) STARFIELD — fond animé (canvas)
     ============================================================ */
  function initStarfield() {
    const container = document.querySelector(".starfield");
    if (!container) return;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const compactViewportQuery = window.matchMedia("(max-width: 768px)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    const canvas = document.createElement("canvas");
    canvas.id = "starfield-canvas";
    canvas.className = "starfield-canvas";
    container.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let DPR = 1;
    let width = 0,
      height = 0;
    let stars = [];
    let shootingStars = [];
    let lastTime = 0;
    const density = 0.00028;
    let animationFrameId = null;
    let shootingStarIntervalId = null;
    let currentProfile = null;

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    function getProfile() {
      const reducedMotion = reducedMotionQuery.matches;
      const compactViewport =
        compactViewportQuery.matches || coarsePointerQuery.matches;

      if (reducedMotion) {
        return {
          animate: false,
          densityMultiplier: 0.18,
          maxDpr: 1,
          maxFrameRate: 12,
          spawnChance: 0,
          spawnInterval: 0,
          maxShootingStars: 0,
        };
      }

      if (compactViewport) {
        return {
          animate: true,
          densityMultiplier: 0.42,
          maxDpr: 1.1,
          maxFrameRate: 24,
          spawnChance: 0.3,
          spawnInterval: 1800,
          maxShootingStars: 1,
        };
      }

      return {
        animate: true,
        densityMultiplier: 1,
        maxDpr: 1.35,
        maxFrameRate: 36,
        spawnChance: 0.65,
        spawnInterval: 1200,
        maxShootingStars: 2,
      };
    }

    function createStar(initial) {
      return {
        x: rand(0, width),
        y: initial ? rand(0, height) : -10,
        z: rand(0.3, 1),
        size: rand(0.4, 1.6),
        speed: rand(6, 30) * 0.02,
        alpha: rand(0.3, 1),
        twinkle: rand(0.002, 0.02),
      };
    }

    function resize() {
      currentProfile = currentProfile || getProfile();
      DPR = Math.min(currentProfile.maxDpr, Math.max(1, window.devicePixelRatio || 1));
      width = container.clientWidth;
      height = container.clientHeight;
      if (!width || !height) return;

      canvas.width = Math.round(width * DPR);
      canvas.height = Math.round(height * DPR);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const targetCount = Math.max(
        currentProfile.animate ? 28 : 12,
        Math.round(width * height * density * currentProfile.densityMultiplier),
      );
      stars = [];
      for (let i = 0; i < targetCount; i++) stars.push(createStar(true));
      shootingStars = [];
    }

    function spawnShootingStar() {
      if (!currentProfile?.animate) return;
      if (shootingStars.length >= currentProfile.maxShootingStars) return;

      shootingStars.push({
        x: rand(width * 0.2, width * 1.1),
        y: rand(-height * 0.2, height * 0.2),
        len: rand(width * 0.12, width * 0.28),
        speed: rand(1200, 2400) / 1000,
        angle: -rand(20, 40) * (Math.PI / 180),
        life: 0,
        maxLife: rand(800, 1600),
      });
    }

    function update(dt) {
      for (const s of stars) {
        s.y += s.speed * dt * 0.06 * s.z;
        s.x -= s.speed * dt * 0.01 * (0.2 + (1 - s.z));
        s.alpha += Math.sin(dt * s.twinkle) * 0.0008;
        if (s.y > height + 20 || s.x < -20) {
          Object.assign(s, createStar(false));
          s.y = -10;
        }
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const st = shootingStars[i];
        st.life += dt;
        st.x += Math.cos(st.angle) * st.speed * dt;
        st.y += Math.sin(st.angle) * st.speed * dt;
        if (st.life > st.maxLife) shootingStars.splice(i, 1);
      }
    }

    function render() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
        const a = Math.max(0, Math.min(1, s.alpha));
        g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
        g.addColorStop(0.6, `rgba(255,255,255,${0.25 * a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(s.x - s.size, s.y - s.size, s.size * 2, s.size * 2);
      }

      for (const st of shootingStars) {
        const lx = st.x - Math.cos(st.angle) * st.len;
        const ly = st.y - Math.sin(st.angle) * st.len;
        const grad = ctx.createLinearGradient(lx, ly, st.x, st.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.6, "rgba(255,255,255,0.6)");
        grad.addColorStop(1, "rgba(255,255,255,1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(st.x, st.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.arc(st.x, st.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function stopLoop(shouldRender = true) {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      lastTime = 0;
      if (shouldRender) render();
    }

    function loop(ts) {
      if (!currentProfile?.animate || document.hidden) {
        animationFrameId = null;
        return;
      }

      if (!lastTime) lastTime = ts;
      const minFrameDelay = 1000 / currentProfile.maxFrameRate;
      const elapsed = ts - lastTime;

      if (elapsed < minFrameDelay) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(elapsed, 80);
      lastTime = ts;
      update(dt);
      render();
      animationFrameId = requestAnimationFrame(loop);
    }

    function restartShootingStars() {
      window.clearInterval(shootingStarIntervalId);
      shootingStarIntervalId = null;

      if (!currentProfile?.animate || currentProfile.spawnInterval <= 0) return;

      shootingStarIntervalId = window.setInterval(() => {
        if (!document.hidden && Math.random() < currentProfile.spawnChance) {
          spawnShootingStar();
        }
      }, currentProfile.spawnInterval);
    }

    function startLoop() {
      if (!currentProfile?.animate || document.hidden || animationFrameId !== null) {
        render();
        return;
      }

      lastTime = 0;
      animationFrameId = requestAnimationFrame(loop);
    }

    function applyProfile() {
      const nextProfile = getProfile();
      const profileChanged =
        !currentProfile ||
        Object.keys(nextProfile).some(
          (key) => nextProfile[key] !== currentProfile[key],
        );

      currentProfile = nextProfile;
      container.dataset.motion = currentProfile.animate ? "animated" : "static";

      if (profileChanged) {
        resize();
        restartShootingStars();
      }

      if (currentProfile.animate && !document.hidden) startLoop();
      else stopLoop(true);
    }

    function handleVisibilityChange() {
      if (document.hidden) stopLoop(false);
      else startLoop();
    }

    resize();
    applyProfile();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener("change", applyProfile);
    compactViewportQuery.addEventListener("change", applyProfile);
    coarsePointerQuery.addEventListener("change", applyProfile);
  }

  initStarfield();

  /* ============================================================
     4b) COUVERTURE — animations d'écriture
     ============================================================ */
  function initCoverAnimations() {
    const coverFront = document.getElementById("coverFront");
    const coverBack = document.querySelector(".cover-back");
    
    // Fonction pour initialiser une couverture
    function setupCover(cover) {
      if (!cover) return null;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const titleLines = cover.querySelectorAll("[data-title-line]");
      const typeTarget = cover.querySelector("[data-typewriter]");
      const typeTextEl = cover.querySelector(".cover-type-text");

      let typewriterTimer = null;
      let typewriterActive = false;
      // Rythme néon : power-on rapide et régulier
      let letterBaseDelay = 420;
      const TYPE_SPEED = 34;
      const DELETE_SPEED = 22;
      const HOLD_FULL_MS = 1800;
      const HOLD_EMPTY_MS = 450;

      function splitTitleLetters() {
        titleLines.forEach((line, lineIndex) => {
        const text = line.getAttribute("data-title-line") || "";
        line.textContent = "";
        [...text].forEach((char, charIndex) => {
          const span = document.createElement("span");
          span.className =
            char === " " ? "cover-letter is-space" : "cover-letter";
          span.textContent = char === " " ? "\u00A0" : char;
          const delay = letterBaseDelay + lineIndex * 380 + charIndex * 48;
          span.style.transitionDelay = `${delay}ms`;
          line.appendChild(span);
        });
      });
    }

    function clearTypewriter() {
      typewriterActive = false;
      if (typewriterTimer) {
        window.clearTimeout(typewriterTimer);
        typewriterTimer = null;
      }
      if (typeTarget) typeTarget.classList.remove("is-done");
      if (typeTextEl) typeTextEl.textContent = "";
    }

    function schedule(fn, ms) {
      if (!typewriterActive) return;
      typewriterTimer = window.setTimeout(fn, ms);
    }

    function runTypewriter(options = {}) {
      if (!typeTarget || !typeTextEl) return;
      clearTypewriter();

      const raw = typeTarget.getAttribute("data-type-lines") || "";
      const lines = raw.split("|").map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return;

      if (reducedMotion) {
        typeTextEl.textContent = lines[0] || "";
        return;
      }

      typewriterActive = true;
      typeTarget.classList.remove("is-done");

      // Boucle infinie : tape → pause → efface → phrase suivante → …
      const startDelay =
        options.immediate === true ? 0 : letterBaseDelay + 1000;
      let phraseIndex = 0;
      let charIndex = 0;
      let mode = "type"; // type | hold | delete

      function render(text) {
        typeTextEl.textContent = text;
      }

      function tick() {
        if (!typewriterActive) return;

        const phrase = lines[phraseIndex] || "";

        if (mode === "type") {
          if (charIndex <= phrase.length) {
            render(phrase.slice(0, charIndex));
            charIndex += 1;
            schedule(tick, TYPE_SPEED);
            return;
          }
          // Phrase complète : garde l’affichage, curseur reste actif
          mode = "hold";
          schedule(tick, HOLD_FULL_MS);
          return;
        }

        if (mode === "hold") {
          mode = "delete";
          schedule(tick, DELETE_SPEED);
          return;
        }

        // delete
        if (charIndex > 0) {
          charIndex -= 1;
          render(phrase.slice(0, charIndex));
          schedule(tick, DELETE_SPEED);
          return;
        }

        // Vide → phrase suivante (boucle)
        phraseIndex = (phraseIndex + 1) % lines.length;
        mode = "type";
        charIndex = 0;
        schedule(tick, HOLD_EMPTY_MS);
      }

      schedule(tick, startDelay);
    }

    function playCoverIntro() {
      // Reset pour rejouer l'animation du boot
      cover.classList.remove("is-animated");
      clearTypewriter();

      // Force reflow pour relancer les transitions CSS
      void cover.offsetWidth;

      if (reducedMotion) {
        cover.classList.add("is-animated");
        if (typeTextEl) {
          const raw = typeTarget?.getAttribute("data-type-lines") || "";
          const lines = raw
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
          typeTextEl.textContent = lines[0] || "";
        }
        return;
      }

      requestAnimationFrame(() => {
        cover.classList.add("is-animated");
        runTypewriter({ immediate: false });
      });
    }

      splitTitleLetters();
      playCoverIntro();
      
      return {
        playCoverIntro,
        clearTypewriter
      };
    }
    
    // Initialiser les deux couvertures
    const frontCover = setupCover(coverFront);
    const backCover = setupCover(coverBack);

    // Boucle terminal uniquement sur la couverture ; stop ailleurs
    window.__onBookFlip = function (pageIndex) {
      const totalPages = document.querySelectorAll('.flip-page').length;
      const lastPageIndex = totalPages - 1;
      
      // Activer typewriter sur couverture avant (0) ET arrière (dernière page)
      if (pageIndex === 0 && frontCover) {
        frontCover.playCoverIntro();
      } else if (pageIndex === lastPageIndex && backCover) {
        backCover.playCoverIntro();
      } else {
        if (frontCover) frontCover.clearTypewriter();
        if (backCover) backCover.clearTypewriter();
      }
    };
  }

  initCoverAnimations();

  /* ============================================================
     4) EMAILJS — formulaire de contact
     ============================================================ */
  const EMAILJS_PUBLIC_KEY = "V-I50F9aWBxEWV9ak";
  const EMAILJS_SERVICE_ID = "service_gfg6urf";
  const EMAILJS_TEMPLATE_ID = "template_92mxlsr";
  let emailJsReadyPromise = null;

  function initializeEmailJsSdk() {
    if (typeof emailjs === "undefined") return false;
    emailjs.init(EMAILJS_PUBLIC_KEY);
    return true;
  }

  function ensureEmailJsReady() {
    if (typeof emailjs !== "undefined") {
      initializeEmailJsSdk();
      return Promise.resolve(emailjs);
    }

    if (emailJsReadyPromise) return emailJsReadyPromise;

    emailJsReadyPromise = new Promise((resolve, reject) => {
      const fallbackScript = document.createElement("script");
      // Version exacte, et la meme que la copie locale de index.html : une seule empreinte
      // couvre les deux fichiers. Auparavant ce repli chargeait la v4 alors que le code
      // appelle emailjs.init("cle") et send(service, template, params), soit la signature
      // v3 — il pouvait donc echouer silencieusement.
      // integrity + crossOrigin : si le CDN renvoyait un autre contenu, le navigateur le
      // refuse au lieu de l'executer.
      fallbackScript.src =
        "https://cdn.jsdelivr.net/npm/@emailjs/browser@3.12.1/dist/email.min.js";
      fallbackScript.integrity =
        "sha384-VDbnsk/qjpIVHPQMkJiROI+vW/7cw0k8TFYVLUabm7EWoLEDwcXh09XQ6gQ86Y0B";
      fallbackScript.crossOrigin = "anonymous";
      fallbackScript.async = true;

      fallbackScript.onload = () => {
        if (initializeEmailJsSdk()) resolve(emailjs);
        else reject(new Error("EmailJS charge mais indisponible"));
      };

      fallbackScript.onerror = () => {
        reject(new Error("Impossible de charger EmailJS"));
      };

      document.head.appendChild(fallbackScript);
    }).catch((error) => {
      emailJsReadyPromise = null;
      throw error;
    });

    return emailJsReadyPromise;
  }

  if (typeof emailjs !== "undefined") {
    initializeEmailJsSdk();
  } else {
    console.warn("EmailJS SDK non charge au demarrage");
  }

  const contactForm = document.getElementById("contactForm");
  const formFeedback = document.getElementById("formFeedback");
  const feedbackText = document.getElementById("feedbackText");
  const FORM_MIN_SUBMIT_DELAY_MS = 3000;
  let isFormSubmitting = false;
  let feedbackTimeoutId = null;
  const formLoadedAt = Date.now();

  function showFeedback(message, type = "info") {
    if (!formFeedback || !feedbackText) return;
    feedbackText.textContent = message;
    formFeedback.classList.toggle("is-error", type === "error");
    formFeedback.classList.toggle("is-success", type === "success");
    formFeedback.setAttribute("role", type === "error" ? "alert" : "status");
    formFeedback.hidden = false;
    formFeedback.style.display = "block";
    formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });

    window.clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = window.setTimeout(() => {
      formFeedback.style.display = "none";
      formFeedback.hidden = true;
      formFeedback.classList.remove("is-error", "is-success");
    }, 6000);
  }

  function setFieldInvalid(field, isInvalid) {
    if (!field) return;
    if (isInvalid) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }

  function clearFieldInvalidState(form) {
    Array.from(form.elements).forEach((field) => {
      if (field instanceof HTMLElement) setFieldInvalid(field, false);
    });
  }

  function validateContactForm(form) {
    const nameField = form.elements["name"];
    const emailField = form.elements["email"];
    const phoneField = form.elements["phone"];
    const subjectField = form.elements["subject"];
    const messageField = form.elements["message"];
    const websiteField = form.elements["website"];
    const values = {
      name: nameField?.value.trim() || "",
      email: emailField?.value.trim() || "",
      phone: phoneField?.value.trim() || "",
      subject: subjectField?.value.trim() || "",
      message: messageField?.value.trim() || "",
      website: websiteField?.value.trim() || "",
    };

    clearFieldInvalidState(form);
    let firstInvalidField = null;

    const invalidate = (field) => {
      if (!field) return;
      setFieldInvalid(field, true);
      if (!firstInvalidField) firstInvalidField = field;
    };

    if (values.website) {
      return {
        blocked: true,
        message:
          "Merci, votre message a bien été pris en compte. Nous revenons vers vous bientôt.",
      };
    }

    if (Date.now() - formLoadedAt < FORM_MIN_SUBMIT_DELAY_MS) {
      return {
        message:
          "Merci de patienter quelques secondes avant d'envoyer votre message.",
      };
    }

    // Bornes hautes : elles doublent les maxlength du HTML, qui se contournent trivialement
    // (le formulaire est en novalidate, le vrai garde-fou est ici). Sans elles, un message de
    // plusieurs Mo partirait vers le quota EmailJS. Le telephone est deja borne a 25 par sa
    // regex, l'objet a 120 juste en dessous.
    if (values.name.length < 2 || values.name.length > 80) invalidate(nameField);
    if (
      values.email.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
    )
      invalidate(emailField);
    if (values.phone && !/^[+\d\s().-]{6,25}$/.test(values.phone))
      invalidate(phoneField);
    if (values.subject.length > 120) invalidate(subjectField);
    if (values.message.length < 10 || values.message.length > 2000)
      invalidate(messageField);

    if (firstInvalidField) {
      return {
        message:
          "Veuillez corriger les champs mis en évidence avant l'envoi.",
        firstInvalidField,
      };
    }

    return { values };
  }

  if (contactForm) {
    contactForm.addEventListener("input", (e) => {
      const field = e.target;
      if (field instanceof HTMLElement && field.hasAttribute("aria-invalid")) {
        setFieldInvalid(field, false);
      }
    });

    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (isFormSubmitting) {
        showFeedback("Un envoi est déjà en cours. Merci de patienter.", "error");
        return;
      }

      const validation = validateContactForm(this);
      if (validation.blocked) {
        this.reset();
        clearFieldInvalidState(this);
        showFeedback(validation.message, "success");
        return;
      }

      if (validation.message) {
        validation.firstInvalidField?.focus();
        showFeedback(validation.message, "error");
        return;
      }

      const { name, email, phone, subject, message } = validation.values;
      const templateParams = {
        to_email: "zbertrand.61907@gmail.com",
        from_name: name,
        from_email: email,
        phone: phone || "Non fourni",
        subject: subject || "Pas de sujet spécifié",
        message: message,
      };

      isFormSubmitting = true;
      this.setAttribute("aria-busy", "true");

      const submitBtn = this.querySelector('input[type="submit"]');
      const originalText = submitBtn ? submitBtn.value : "";
      if (submitBtn) {
        submitBtn.value = "Envoi en cours...";
        submitBtn.disabled = true;
      }

      try {
        const emailJsClient = await ensureEmailJsReady();
        await emailJsClient.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
        );
        showFeedback(
          "Message envoyé avec succès. Je vous répondrai bientôt.",
          "success",
        );
        contactForm.reset();
        clearFieldInvalidState(contactForm);
      } catch (error) {
        console.error("❌ Erreur EmailJS:", error);
        showFeedback(
          "L'envoi du message a echoue. Merci de reessayer dans un instant.",
          "error",
        );
      } finally {
        isFormSubmitting = false;
        contactForm.removeAttribute("aria-busy");
        if (submitBtn) {
          submitBtn.value = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }
});
