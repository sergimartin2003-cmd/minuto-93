/* =============================================================
   MINUTO 93 — ficha de producto (diálogo a pantalla completa)
   Galería + vista 3D + tallaje + petición de reserva.
   Expone: M93.util (ayudas comunes) y M93.ficha
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});

  /* ---------- ayudas comunes ---------------------------------- */

  function $(sel, ambito) { return (ambito || document).querySelector(sel); }
  function $$(sel, ambito) { return Array.prototype.slice.call((ambito || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var avisoTimer = null;
  function aviso(texto, esError) {
    var caja = $("[data-aviso]");
    if (!caja) return;
    caja.textContent = texto;
    caja.classList.toggle("is-error", !!esError);
    caja.classList.add("is-visible");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { caja.classList.remove("is-visible"); }, 3800);
  }

  function precio(v) {
    var n = Number(v);
    if (!isFinite(n)) return "—";
    return n.toLocaleString("es-ES") + " €";
  }

  /* Nombre visible de una categoría ("local" -> "Local") */
  function etiquetaTipo(t) {
    var cats = ((window.__BRAND__ || {}).categorias) || [];
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].clave === t) return cats[i].etiqueta;
    }
    return "Camiseta";
  }

  function disponibles(p) {
    return (p.tallas || []).filter(function (t) { return Number(t.stock) > 0; });
  }

  M93.util = {
    $: $, $$: $$, esc: esc, aviso: aviso,
    precio: precio, etiquetaTipo: etiquetaTipo, disponibles: disponibles
  };

  /* ---------- estado del diálogo ------------------------------- */

  var dlg, cuerpo, visor3d = null, actual = null, fotoActual = 0, tallaElegida = "";

  function marca() { return window.__BRAND__ || {}; }

  function urlFoto(ref) {
    return (M93.store && M93.store.urlDeFoto(ref)) || ref || "";
  }

  /* ---------- plantilla ---------------------------------------- */

  function plantilla(p, esAdmin) {
    var fotos = (p.fotos || []).filter(Boolean);
    if (!fotos.length) fotos = [""];
    var guia = marca().guia || null;
    var hayStock = disponibles(p).length > 0;

    var minis = fotos.map(function (f, i) {
      return (
        '<button class="gal__mini' + (i === 0 ? " is-activa" : "") + '" type="button" data-mini="' + i + '" ' +
        'aria-label="Ver foto ' + (i + 1) + '"><img src="' + esc(urlFoto(f)) + '" alt="" loading="lazy" /></button>'
      );
    }).join("");

    var tallas = (p.tallas || []).map(function (t) {
      var ok = Number(t.stock) > 0;
      return (
        '<button type="button" class="talla ' + (ok ? "is-disponible" : "is-agotada") + '" ' +
        (ok ? 'data-talla="' + esc(t.talla) + '"' : "disabled") + '>' + esc(t.talla) + "</button>"
      );
    }).join("");

    var medidas = guia
      ? '<table class="medidas"><thead><tr><th>Talla</th><th>Pecho × largo</th></tr></thead><tbody>' +
        guia.filas.map(function (f) {
          return "<tr><td>" + esc(f.talla) + "</td><td>" + esc(f.cm) + "</td></tr>";
        }).join("") +
        "</tbody></table><p class='tallas__nota'>" + esc(guia.nota) + "</p>"
      : "";

    var admin = esAdmin
      ? '<div class="ficha__admin">' +
        '<span class="mono">Modo admin</span>' +
        '<button class="mini-btn" type="button" data-ia-ficha>Reescribir con IA</button>' +
        '<button class="mini-btn" type="button" data-editar-ficha>Editar pieza</button>' +
        '<button class="mini-btn mini-btn--peligro" type="button" data-borrar-ficha>Eliminar</button>' +
        "</div>"
      : "";

    return (
      '<div class="ficha__grid">' +
        '<div class="gal" data-gal>' +
          '<div class="gal__marco">' +
            '<img data-gal-foto src="' + esc(urlFoto(fotos[0])) + '" alt="' + esc(p.nombre) + '" />' +
            '<canvas class="gal__lienzo" data-gal-3d></canvas>' +
          "</div>" +
          '<div class="gal__barra">' +
            '<div class="gal__miniaturas">' + minis + "</div>" +
            '<button class="mini-btn" type="button" data-toggle-3d>Ver en 3D</button>' +
          "</div>" +
          '<p class="gal__aviso mono" data-gal-aviso></p>' +
        "</div>" +

        '<div class="ficha__datos">' +
          '<div class="ficha__cabecera">' +
            '<span class="etiqueta">' + esc(etiquetaTipo(p.tipo)) + "</span>" +
            '<span class="etiqueta etiqueta--lima">' + esc(p.minuto || "Archivo") + "</span>" +
            '<span class="etiqueta">' + esc(p.estado || "Segunda mano") + "</span>" +
          "</div>" +

          '<h2 class="ficha__titulo">' + esc(p.nombre) + "</h2>" +
          '<p class="ficha__sub">' + esc(p.subtitulo || "") + "</p>" +
          '<p class="ficha__precio">' + precio(p.precio) + "</p>" +

          '<div class="ficha__bloque">' +
            "<h4>La pieza</h4>" +
            '<p class="ficha__descripcion" data-descripcion>' + esc(p.descripcion || "") + "</p>" +
            '<p class="mono ficha__firma-ia" data-firma-ia>Ficha redactada automáticamente y revisada a mano.</p>' +
          "</div>" +

          (p.historia
            ? '<div class="ficha__bloque"><h4>De dónde viene</h4><p>' + esc(p.historia) + "</p></div>"
            : "") +

          '<div class="ficha__bloque">' +
            "<h4>Tallas" + (hayStock ? "" : " · agotada") + "</h4>" +
            '<div class="tallas" data-tallas>' + (tallas || '<span class="mono">Sin tallas cargadas</span>') + "</div>" +
            (p.notaTalla ? '<p class="tallas__nota">' + esc(p.notaTalla) + "</p>" : "") +
          "</div>" +

          (medidas ? '<div class="ficha__bloque"><h4>' + esc(guia.titulo) + "</h4>" + medidas + "</div>" : "") +

          '<div class="ficha__acciones">' +
            '<a class="btn btn--solido" data-cta-mail href="#">Pedir esta pieza</a>' +
            '<a class="btn" data-cta-wa href="#" target="_blank" rel="noopener">Preguntar por WhatsApp</a>' +
          "</div>" +
          '<p class="mono" style="margin-top:.9rem">Sin carrito: se reserva hablando. Contestamos en 48 h.</p>' +

          admin +
        "</div>" +
      "</div>"
    );
  }

  /* ---------- enlaces de contacto ------------------------------ */

  function refrescarCTA() {
    if (!actual) return;
    var b = marca();
    var talla = tallaElegida ? " (talla " + tallaElegida + ")" : "";
    var asunto = "Reserva: " + actual.nombre + talla;
    var texto =
      "Hola, me interesa la pieza \"" + actual.nombre + "\" (" + actual.id + ")" + talla + ".\n" +
      "¿Sigue disponible?";
    var mail = $("[data-cta-mail]", cuerpo);
    var wa = $("[data-cta-wa]", cuerpo);
    if (mail) {
      mail.href = "mailto:" + (b.email || "") + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(texto);
      mail.textContent = tallaElegida ? "Pedir la talla " + tallaElegida : "Pedir esta pieza";
    }
    if (wa) {
      wa.href = "https://wa.me/" + String(b.whatsapp || "").replace(/[^0-9]/g, "") + "?text=" + encodeURIComponent(texto);
    }
  }

  /* ---------- galería y 3D ------------------------------------- */

  function mostrarFoto(i) {
    if (!actual) return;
    var fotos = (actual.fotos || []).filter(Boolean);
    if (!fotos.length) return;
    fotoActual = Math.max(0, Math.min(fotos.length - 1, i));
    var img = $("[data-gal-foto]", cuerpo);
    if (img) img.src = urlFoto(fotos[fotoActual]);
    $$("[data-mini]", cuerpo).forEach(function (b) {
      b.classList.toggle("is-activa", Number(b.dataset.mini) === fotoActual);
    });
    var gal = $("[data-gal]", cuerpo);
    if (gal && gal.classList.contains("is-3d")) cargar3D();
  }

  function textoModo(modo) {
    if (modo === "silueta") return "Modelo 3D generado desde la foto · relieve por silueta · arrastra para girar";
    if (modo === "luminancia") return "Modelo 3D generado desde la foto · relieve por luz · arrastra para girar";
    return "Volumen 3D sin relieve: abre la web desde un servidor o súbela a tu hosting para el modelado completo.";
  }

  function cargar3D() {
    var gal = $("[data-gal]", cuerpo);
    var lienzo = $("[data-gal-3d]", cuerpo);
    var nota = $("[data-gal-aviso]", cuerpo);
    if (!gal || !lienzo || !actual) return;

    if (!M93.vista3d || !M93.vista3d.disponible()) {
      if (nota) nota.textContent = "La vista 3D necesita WebGL. Tu navegador no lo permite ahora mismo.";
      return;
    }
    if (!visor3d) visor3d = M93.vista3d.crear(lienzo);
    if (!visor3d) {
      if (nota) nota.textContent = "No se pudo iniciar la vista 3D.";
      return;
    }
    if (nota) nota.textContent = "Construyendo el modelo…";
    var fotos = (actual.fotos || []).filter(Boolean);
    visor3d
      .cargar(urlFoto(fotos[fotoActual] || fotos[0]))
      .then(function (modo) { if (nota) nota.textContent = textoModo(modo); })
      .catch(function (e) {
        if (nota) nota.textContent = "No se pudo generar el 3D de esta foto.";
        console.warn("[ficha] 3D:", e);
      });
  }

  function alternar3D() {
    var gal = $("[data-gal]", cuerpo);
    var boton = $("[data-toggle-3d]", cuerpo);
    if (!gal) return;
    var activar = !gal.classList.contains("is-3d");
    gal.classList.toggle("is-3d", activar);
    if (boton) boton.textContent = activar ? "Ver fotos" : "Ver en 3D";
    if (activar) cargar3D();
    else {
      var nota = $("[data-gal-aviso]", cuerpo);
      if (nota) nota.textContent = "";
    }
  }

  function destruir3D() {
    if (visor3d) {
      visor3d.destruir();
      visor3d = null;
    }
  }

  /* ---------- eventos internos --------------------------------- */

  function conectar(esAdmin) {
    $$("[data-mini]", cuerpo).forEach(function (b) {
      b.addEventListener("click", function () { mostrarFoto(Number(b.dataset.mini)); });
    });

    var t3d = $("[data-toggle-3d]", cuerpo);
    if (t3d) t3d.addEventListener("click", alternar3D);

    $$("[data-talla]", cuerpo).forEach(function (b) {
      b.addEventListener("click", function () {
        tallaElegida = b.dataset.talla;
        $$("[data-talla]", cuerpo).forEach(function (o) { o.style.background = ""; o.style.color = ""; });
        b.style.background = "var(--lima)";
        refrescarCTA();
      });
    });

    if (esAdmin) {
      var bIA = $("[data-ia-ficha]", cuerpo);
      if (bIA) bIA.addEventListener("click", function () {
        bIA.disabled = true;
        bIA.textContent = "Escribiendo…";
        M93.ia.generar(actual).then(function (r) {
          M93.store.actualizarProducto(actual.id, { descripcion: r.texto });
          actual.descripcion = r.texto;
          var d = $("[data-descripcion]", cuerpo);
          if (d) d.textContent = r.texto;
          var f = $("[data-firma-ia]", cuerpo);
          if (f) f.textContent = r.motor === "claude"
            ? "Ficha escrita con Claude (claude-opus-5)."
            : "Ficha escrita con el redactor local de MINUTO 93.";
          bIA.disabled = false;
          bIA.textContent = "Reescribir con IA";
          aviso(r.aviso || "Ficha actualizada.");
          if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
        });
      });

      var bEd = $("[data-editar-ficha]", cuerpo);
      if (bEd) bEd.addEventListener("click", function () {
        cerrar();
        if (M93.admin) M93.admin.editar(actual.id);
      });

      var bDel = $("[data-borrar-ficha]", cuerpo);
      if (bDel) bDel.addEventListener("click", function () {
        if (!confirm("¿Eliminar «" + actual.nombre + "» del archivo?")) return;
        M93.store.borrarProducto(actual.id);
        cerrar();
        aviso("Pieza eliminada.");
        if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
      });
    }
  }

  /* ---------- API ---------------------------------------------- */

  function abrir(id) {
    dlg = dlg || $("[data-ficha]");
    cuerpo = cuerpo || $("[data-ficha-cuerpo]");
    if (!dlg || !cuerpo) return;

    var p = M93.store.producto(id);
    if (!p) { aviso("Esa pieza ya no está en el archivo.", true); return; }

    actual = p;
    fotoActual = 0;
    tallaElegida = "";
    destruir3D();

    var esAdmin = !!(M93.admin && M93.admin.activo());
    cuerpo.innerHTML = plantilla(p, esAdmin);
    cuerpo.scrollTop = 0;
    conectar(esAdmin);
    refrescarCTA();

    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute("open", "");

    document.documentElement.style.overflow = "hidden";
    if (history.replaceState) history.replaceState(null, "", "#pieza-" + p.id);
  }

  function cerrar() {
    if (!dlg) return;
    destruir3D();
    if (dlg.open && typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
    document.documentElement.style.overflow = "";
    actual = null;
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
  }

  function iniciar() {
    dlg = $("[data-ficha]");
    cuerpo = $("[data-ficha-cuerpo]");
    if (!dlg) return;
    var btn = $("[data-cerrar-ficha]");
    if (btn) btn.addEventListener("click", cerrar);
    dlg.addEventListener("close", function () {
      destruir3D();
      document.documentElement.style.overflow = "";
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) cerrar();   // clic en el fondo
    });
  }

  M93.ficha = { abrir: abrir, cerrar: cerrar, iniciar: iniciar };
})();
