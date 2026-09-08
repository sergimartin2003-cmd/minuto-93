/* =============================================================
   MINUTO 93 — arranque de la web
   Monta el archivo, las tablas de tallaje y el muro del buzón,
   y enciende los efectos. Cada init va aislado: si uno falla,
   el resto sigue funcionando.
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});
  var U = M93.util;
  var marca = window.__BRAND__ || {};
  var filtroActual = "todo";

  function safe(fn, nombre) {
    try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); }
  }

  /* =============================================================
     ARCHIVO
     ============================================================= */

  function tarjeta(p, i) {
    var fotos = (p.fotos || []).filter(Boolean);
    var f1 = M93.store.urlDeFoto(fotos[0] || "");
    var f2 = fotos[1] ? M93.store.urlDeFoto(fotos[1]) : "";
    var disp = U.disponibles(p);
    var etiqueta = "";
    if (!disp.length) etiqueta = "Agotada";
    else if (disp.length === 1) etiqueta = "Última talla";

    return (
      '<article class="tarjeta" data-tipo="' + U.esc(p.tipo) + '">' +
        '<button class="tarjeta__enlace" type="button" data-abrir="' + U.esc(p.id) + '" ' +
          'aria-label="Ver la ficha de ' + U.esc(p.nombre) + '">' +
          '<figure class="tarjeta__foto">' +
            '<span class="tarjeta__indice">' + ("0" + (i + 1)).slice(-2) + "</span>" +
            (etiqueta ? '<span class="tarjeta__etiqueta">' + etiqueta + "</span>" : "") +
            '<img src="' + U.esc(f1) + '" alt="' + U.esc(p.nombre) + '" loading="lazy" decoding="async" />' +
            (f2 ? '<img src="' + U.esc(f2) + '" alt="" loading="lazy" decoding="async" />' : "") +
          "</figure>" +
          '<div class="tarjeta__pie">' +
            "<h3>" + U.esc(p.nombre) + "</h3>" +
            '<p class="mono">' + U.esc(p.subtitulo || U.etiquetaTipo(p.tipo)) + "</p>" +
            '<p class="tarjeta__tallas">' +
              (disp.length
                ? "Tallas " + disp.map(function (t) { return U.esc(t.talla); }).join(" · ")
                : "Sin stock") +
            "</p>" +
            '<p class="tarjeta__precio">' + U.precio(p.precio) + "</p>" +
          "</div>" +
        "</button>" +
      "</article>"
    );
  }

  function repintarArchivo() {
    var caja = U.$("[data-archivo]");
    if (!caja) return;
    var lista = M93.store.productos().filter(function (p) {
      return filtroActual === "todo" || p.tipo === filtroActual;
    });

    caja.innerHTML = lista.length
      ? lista.map(tarjeta).join("")
      : '<p class="archivo__vacio mono">Ahora mismo no hay piezas de este tipo. Pídelo en el buzón y lo buscamos.</p>';

    U.$$("[data-abrir]", caja).forEach(function (b) {
      b.addEventListener("click", function () { M93.ficha.abrir(b.dataset.abrir); });
    });

    var cuenta = U.$("[data-cuenta]");
    if (cuenta) cuenta.textContent = lista.length + (lista.length === 1 ? " pieza" : " piezas");

    if (window.ScrollTrigger) { try { ScrollTrigger.refresh(); } catch (e) { /* nada */ } }
  }

  /* Los filtros se construyen con las categorías que de verdad tienen
     piezas, así que añadir o quitar una en el admin los actualiza solo. */
  function montarFiltros() {
    var caja = U.$("[data-filtros]");
    if (!caja) return;

    var lista = M93.store.productos();
    var usadas = {};
    lista.forEach(function (p) { if (p.tipo) usadas[p.tipo] = true; });

    var cats = (marca.categorias || []).filter(function (c) { return usadas[c.clave]; });
    if (!cats.length) { caja.innerHTML = ""; return; }
    if (!usadas[filtroActual]) filtroActual = "todo";

    caja.innerHTML =
      '<button type="button" class="chip' + (filtroActual === "todo" ? " is-activo" : "") + '" data-filtro="todo">Todo</button>' +
      cats.map(function (c) {
        return '<button type="button" class="chip' + (filtroActual === c.clave ? " is-activo" : "") +
          '" data-filtro="' + U.esc(c.clave) + '">' + U.esc(c.etiqueta) + "</button>";
      }).join("") +
      '<span class="filtros__cuenta mono" data-cuenta></span>';

    U.$$("[data-filtro]", caja).forEach(function (b) {
      b.addEventListener("click", function () {
        filtroActual = b.dataset.filtro;
        U.$$("[data-filtro]", caja).forEach(function (o) { o.classList.toggle("is-activo", o === b); });
        repintarArchivo();
      });
    });
  }

  /* =============================================================
     TALLAJE
     ============================================================= */

  function montarGuias() {
    var caja = U.$("[data-guias]");
    var g = marca.guia;
    if (!caja || !g) return;
    caja.innerHTML =
      '<div class="tabla">' +
        "<h3>" + U.esc(g.titulo) + "</h3>" +
        "<p>" + U.esc(g.nota) + "</p>" +
        "<table><thead><tr><th>Talla</th><th>Pecho × largo</th></tr></thead><tbody>" +
        g.filas.map(function (f) {
          return "<tr><td>" + U.esc(f.talla) + "</td><td>" + U.esc(f.cm) + "</td></tr>";
        }).join("") +
        "</tbody></table>" +
      "</div>" +
      '<div class="tabla tabla--nota">' +
        "<h3>Cómo medir la tuya</h3>" +
        "<p>Coge una camiseta que te siente como quieres que te siente ésta y ponla en plano " +
        "sobre la cama, sin estirar. Mide el pecho de costura a costura por debajo de la manga " +
        "y el largo desde el punto más alto del hombro hasta el bajo. Compara esos dos números " +
        "con la tabla y con las medidas de la ficha.</p>" +
        "<p>Cada pieza tiene además su propia nota de tallaje: una camiseta de portero de los 90 " +
        "nunca talla como una de campo, y una de los 2000 tampoco talla como una de ahora.</p>" +
      "</div>";
  }

  /* =============================================================
     BUZÓN
     ============================================================= */

  function repintarMuro() {
    var caja = U.$("[data-muro]");
    if (!caja) return;
    var lista = M93.store.peticiones().filter(function (q) { return q.publica !== false; }).slice(0, 6);
    caja.innerHTML = lista.length
      ? lista.map(function (q) {
          return (
            "<li><p>" + U.esc(q.pieza) + "</p>" +
            '<span class="mono">' + U.esc(q.nombre || "anónimo") +
            (q.tipo ? " · " + U.esc(U.etiquetaTipo(q.tipo)) : "") +
            (q.talla ? " · " + U.esc(q.talla) : "") + "</span></li>"
          );
        }).join("")
      : '<li><p>El muro está vacío. Estrénalo tú.</p></li>';
  }

  function initFormulario() {
    var form = U.$("[data-form-buzon]");
    if (!form) return;
    var estado = U.$("[data-estado-form]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nombre = form.nombre.value.trim();
      var pieza = form.pieza.value.trim();

      U.$$(".campo", form).forEach(function (c) { c.classList.remove("is-error"); });
      if (!nombre || !pieza) {
        if (!nombre) form.nombre.closest(".campo").classList.add("is-error");
        if (!pieza) form.pieza.closest(".campo").classList.add("is-error");
        if (estado) {
          estado.textContent = "Necesitamos tu nombre y qué buscas.";
          estado.className = "mono is-error";
        }
        return;
      }

      M93.store.anadirPeticion({
        nombre: nombre,
        tipo: form.tipo.value,
        pieza: pieza,
        talla: form.talla.value.trim(),
        contacto: form.contacto.value.trim(),
        publica: form.publica.checked
      });

      repintarMuro();
      form.reset();
      if (estado) {
        estado.textContent = "Anotado. Lo revisamos el lunes y te escribimos si aparece.";
        estado.className = "mono is-ok";
      }
      U.aviso("Petición guardada en el buzón.");
    });
  }

  /* =============================================================
     EFECTOS
     ============================================================= */

  function initSplash() {
    var splash = U.$("[data-splash]");
    if (!splash) return;
    var esconder = function () {
      splash.classList.add("is-out");
      setTimeout(function () { splash.classList.add("is-fuera"); }, 1200);
    };
    if (document.readyState === "complete") setTimeout(esconder, 700);
    else window.addEventListener("load", function () { setTimeout(esconder, 500); });
    setTimeout(esconder, 4000);           // red de seguridad
    setTimeout(function () { splash.classList.add("is-fuera"); }, 5200);
  }

  function initNav() {
    var nav = U.$("[data-nav]");
    var burger = U.$("[data-burger]");
    if (!nav || !burger) return;

    burger.addEventListener("click", function () {
      var abierta = nav.classList.toggle("is-abierta");
      burger.setAttribute("aria-expanded", abierta ? "true" : "false");
    });
    U.$$(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-abierta");
        burger.setAttribute("aria-expanded", "false");
      });
    });

    // Enlace activo según la sección visible
    var secciones = ["archivo", "historia", "tallaje", "buzon"]
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if ("IntersectionObserver" in window && secciones.length) {
      var io = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (en) {
            if (!en.isIntersecting) return;
            U.$$(".nav__links a").forEach(function (a) {
              a.classList.toggle("is-activo", a.getAttribute("href") === "#" + en.target.id);
            });
          });
        },
        { threshold: 0.15, rootMargin: "-30% 0px -55% 0px" }
      );
      secciones.forEach(function (s) { io.observe(s); });
    }
  }

  function initAnclas() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      var offset = 76;
      window.scrollTo({
        top: destino.getBoundingClientRect().top + window.scrollY - offset,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
  }

  function initReveals() {
    var objetivos = U.$$(".reveal");
    if (!objetivos.length) return;

    if (!("IntersectionObserver" in window)) {
      objetivos.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        });
      },
      { threshold: 0.02, rootMargin: "0px 0px -4% 0px" }
    );
    objetivos.forEach(function (el) { io.observe(el); });

    // Red de seguridad: a los 6 s nada puede seguir invisible
    setTimeout(function () {
      U.$$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.4) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* Parte el texto en palabras conservando <br> y etiquetas en línea */
  function partirPalabras(el) {
    var limpio = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", limpio);
    function envolver(texto) {
      return texto
        .split(/(\s+)/)
        .map(function (w) {
          return /^\s+$/.test(w) || !w
            ? w
            : '<span class="split-word" aria-hidden="true">' + U.esc(w) + "</span>";
        })
        .join("");
    }
    var html = Array.prototype.map.call(el.childNodes, function (nodo) {
      if (nodo.nodeType === 3) return envolver(nodo.textContent);
      if (nodo.nodeName === "BR") return "<br>";
      if (nodo.nodeType === 1) {
        var tag = nodo.tagName.toLowerCase();
        return "<" + tag + ">" + envolver(nodo.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return U.$$(".split-word", el);
  }

  function initTitulares() {
    var titulares = U.$$("[data-split]");
    if (!titulares.length) return;

    titulares.forEach(function (el) {
      el.classList.remove("reveal");
      var palabras = partirPalabras(el);
      if (!window.gsap || !window.ScrollTrigger) return;

      gsap.set(palabras, { y: 26, opacity: 0 });
      gsap.to(palabras, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.045,
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: el, start: "top 92%", once: true }
      });
    });

    // Red de seguridad: pase lo que pase, a los 5 s el titular se lee entero
    setTimeout(function () {
      var palabras = U.$$("[data-split] .split-word").filter(function (w) {
        return w.style.opacity !== "" && Number(w.style.opacity) < 1;
      });
      if (!palabras.length) return;
      try { gsap.killTweensOf(palabras); } catch (e) { /* nada */ }
      palabras.forEach(function (w) { w.style.opacity = ""; w.style.transform = ""; });
    }, 5000);
  }

  function initContadores() {
    var nodos = U.$$("[data-contador]");
    if (!nodos.length) return;

    // La primera cifra es el número real de piezas del archivo
    var primero = nodos[0];
    if (primero && primero.dataset.contador === "5") {
      primero.dataset.contador = String(M93.store.productos().length);
    }

    function animar(el) {
      var fin = Number(el.dataset.contador) || 0;
      var sufijo = el.dataset.sufijo || "";
      var t0 = performance.now();
      var dur = 1100;
      function paso(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fin * e) + sufijo;
        if (p < 1) requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    }

    if (!("IntersectionObserver" in window)) {
      nodos.forEach(animar);
      return;
    }
    var io = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          animar(en.target);
          io.unobserve(en.target);
        });
      },
      { threshold: 0.05 }
    );
    nodos.forEach(function (n) { io.observe(n); });

    // Red de seguridad: si el navegador congela la animación (pestaña en
    // segundo plano), la cifra final se escribe igual, sin contar.
    setTimeout(function () {
      nodos.forEach(function (n) {
        if (n.textContent === "0") n.textContent = (Number(n.dataset.contador) || 0) + (n.dataset.sufijo || "");
      });
    }, 6000);
  }

  function initParalaje() {
    if (!window.gsap || !window.ScrollTrigger) return;
    U.$$("[data-parallax]").forEach(function (el) {
      gsap.fromTo(
        el,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: 0.6 }
        }
      );
    });
  }

  function initReloj() {
    var reloj = U.$("[data-reloj]");
    if (!reloj) return;
    var n = 90;
    setInterval(function () {
      n = n >= 93 ? 90 : n + 1;
      reloj.textContent = n + "′";
    }, 2600);
  }

  function initAno() {
    var el = U.$("[data-ano]");
    if (el) el.textContent = new Date().getFullYear();
  }

  function initEnlaceDirecto() {
    var h = location.hash || "";
    if (h.indexOf("#pieza-") === 0) {
      var id = h.slice(7);
      setTimeout(function () { M93.ficha.abrir(id); }, 400);
    }
  }

  function initImagenesRotas() {
    document.addEventListener(
      "error",
      function (e) {
        var el = e.target;
        if (el && el.tagName === "IMG" && !el.dataset.roto) {
          el.dataset.roto = "1";
          el.style.background = "var(--papel-3)";
          el.removeAttribute("src");
        }
      },
      true
    );
  }

  /* =============================================================
     ARRANQUE
     ============================================================= */

  function repintarTodo() {
    montarFiltros();
    repintarArchivo();
  }

  M93.app = { repintarArchivo: repintarTodo, repintarMuro: repintarMuro };

  function arrancar() {
    safe(initSplash, "initSplash");
    safe(initImagenesRotas, "initImagenesRotas");
    safe(montarGuias, "montarGuias");
    safe(montarFiltros, "montarFiltros");
    safe(repintarArchivo, "repintarArchivo");
    safe(repintarMuro, "repintarMuro");
    safe(initFormulario, "initFormulario");
    safe(initNav, "initNav");
    safe(initAnclas, "initAnclas");
    safe(initReveals, "initReveals");
    safe(initContadores, "initContadores");
    safe(initReloj, "initReloj");
    safe(initAno, "initAno");

    if (M93.ficha) safe(M93.ficha.iniciar, "ficha");
    if (M93.admin) safe(M93.admin.iniciar, "admin");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (e) { /* nada */ }
      safe(initTitulares, "initTitulares");
      safe(initParalaje, "initParalaje");
    } else {
      U.$$("[data-split]").forEach(function (el) { el.classList.remove("reveal"); });
    }

    // Las fotos guardadas por el admin viven en IndexedDB: al hidratarlas
    // hay que volver a pintar para que aparezcan.
    if (M93.store && M93.store.hidratar) {
      M93.store.hidratar().then(function () {
        safe(repintarTodo, "repintar(hidratado)");
        safe(initEnlaceDirecto, "initEnlaceDirecto");
      });
    } else {
      safe(initEnlaceDirecto, "initEnlaceDirecto");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
