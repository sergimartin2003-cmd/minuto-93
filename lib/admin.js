/* =============================================================
   MINUTO 93 — modo administrador
   Alta, edición y borrado de piezas, gestión del buzón y ajustes.
   El acceso es una barrera de conveniencia del lado del cliente:
   sirve para que nadie toque el catálogo por accidente, no para
   guardar secretos. Todo vive en este navegador.
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});
  var U = M93.util;

  var CLAVE_POR_DEFECTO = "minuto93";
  var SESION = "m93.admin.sesion";

  var dlg, cuerpo;
  var editandoId = null;
  var borrador = { fotos: [], tallas: [] };
  var pestanaActiva = "piezas";

  var PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

  function categorias() {
    return ((window.__BRAND__ || {}).categorias) || [{ clave: "local", etiqueta: "Local" }];
  }

  /* ---------- acceso ------------------------------------------- */

  function hash(texto) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      var datos = new TextEncoder().encode("m93::" + texto);
      return crypto.subtle.digest("SHA-256", datos).then(function (buf) {
        return Array.prototype.map
          .call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); })
          .join("");
      });
    }
    // Respaldo sin crypto.subtle (navegadores antiguos / contextos raros)
    var h = 5381;
    for (var i = 0; i < texto.length; i++) h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
    return Promise.resolve("f" + h.toString(16));
  }

  function activo() {
    try { return sessionStorage.getItem(SESION) === "1"; } catch (e) { return false; }
  }

  function marcarSesion(v) {
    try { v ? sessionStorage.setItem(SESION, "1") : sessionStorage.removeItem(SESION); } catch (e) { /* nada */ }
  }

  function comprobar(clave) {
    var cfg = M93.store.config();
    if (!cfg.claveHash) {
      return Promise.resolve(clave === CLAVE_POR_DEFECTO);
    }
    return hash(clave).then(function (h) { return h === cfg.claveHash; });
  }

  /* ---------- pantalla de acceso -------------------------------- */

  function pintarAcceso(error) {
    var sinClave = !M93.store.config().claveHash;
    cuerpo.innerHTML =
      '<form class="acceso" data-form-acceso>' +
        '<p class="kicker">Zona interna</p>' +
        "<h2>Modo administrador</h2>" +
        "<p>Desde aquí se añaden y se quitan piezas del archivo, se lee el buzón y se ajusta la tienda.</p>" +
        '<div class="campo">' +
          '<label for="a-clave">Contraseña</label>' +
          '<input id="a-clave" type="password" autocomplete="current-password" required />' +
        "</div>" +
        (error ? '<p class="mono" style="color:#b3261e">' + U.esc(error) + "</p>" : "") +
        '<button class="btn btn--solido" type="submit">Entrar</button>' +
        (sinClave
          ? '<p class="mono">Contraseña inicial: <strong>' + CLAVE_POR_DEFECTO + "</strong>. Cámbiala en Ajustes en cuanto entres.</p>"
          : "") +
      "</form>";

    var f = U.$("[data-form-acceso]", cuerpo);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = U.$("#a-clave", cuerpo).value;
      comprobar(val).then(function (ok) {
        if (!ok) return pintarAcceso("Contraseña incorrecta.");
        marcarSesion(true);
        pintarPanel();
        U.aviso("Modo admin activado.");
        if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
      });
    });
  }

  /* ---------- panel -------------------------------------------- */

  function pintarPanel() {
    cuerpo.innerHTML =
      '<div class="admin">' +
        '<div class="admin__cabecera">' +
          "<h2>Panel de la tienda</h2>" +
          '<span class="mono" data-resumen></span>' +
          '<button class="mini-btn" type="button" data-salir>Salir del modo admin</button>' +
        "</div>" +

        '<div class="admin__pestanas">' +
          '<button class="chip" type="button" data-tab="piezas">Piezas</button>' +
          '<button class="chip" type="button" data-tab="buzon">Buzón</button>' +
          '<button class="chip" type="button" data-tab="ajustes">Ajustes</button>' +
        "</div>" +

        '<section class="admin__seccion" data-seccion="piezas"></section>' +
        '<section class="admin__seccion" data-seccion="buzon"></section>' +
        '<section class="admin__seccion" data-seccion="ajustes"></section>' +
      "</div>";

    U.$$("[data-tab]", cuerpo).forEach(function (b) {
      b.addEventListener("click", function () { cambiarPestana(b.dataset.tab); });
    });
    var salir = U.$("[data-salir]", cuerpo);
    if (salir) salir.addEventListener("click", function () {
      marcarSesion(false);
      cerrar();
      U.aviso("Has salido del modo admin.");
      if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
    });

    cambiarPestana(pestanaActiva);
  }

  function cambiarPestana(nombre) {
    pestanaActiva = nombre;
    U.$$("[data-tab]", cuerpo).forEach(function (b) {
      b.classList.toggle("is-activo", b.dataset.tab === nombre);
    });
    U.$$("[data-seccion]", cuerpo).forEach(function (s) {
      s.classList.toggle("is-visible", s.dataset.seccion === nombre);
    });
    if (nombre === "piezas") pintarPiezas();
    if (nombre === "buzon") pintarBuzon();
    if (nombre === "ajustes") pintarAjustes();
    actualizarResumen();
  }

  function actualizarResumen() {
    var r = U.$("[data-resumen]", cuerpo);
    if (!r) return;
    var n = M93.store.productos().length;
    var q = M93.store.peticiones().length;
    r.textContent = n + " piezas · " + q + " peticiones";
  }

  /* ---------- pestaña: piezas ----------------------------------- */

  function pintarPiezas() {
    var cont = U.$('[data-seccion="piezas"]', cuerpo);
    var lista = M93.store.productos();

    cont.innerHTML =
      '<div class="admin__aviso">' +
        "Lo que guardes aquí se queda en <strong>este navegador</strong>. Para llevártelo a otro " +
        "ordenador o publicarlo, usa <strong>Ajustes → Exportar catálogo</strong>." +
      "</div>" +

      '<form class="admin__form" data-form-pieza>' +
        '<h3 style="grid-column:1/-1" data-titulo-form>Añadir una pieza</h3>' +

        '<div class="campo"><label for="p-nombre">Nombre *</label>' +
          '<input id="p-nombre" name="nombre" type="text" required maxlength="60" placeholder="Roja de local" /></div>' +

        '<div class="campo"><label for="p-sub">Subtítulo</label>' +
          '<input id="p-sub" name="subtitulo" type="text" maxlength="60" placeholder="Temporada 98/99" /></div>' +

        '<div class="campo"><label for="p-tipo">Categoría</label>' +
          '<select id="p-tipo" name="tipo">' +
          categorias().map(function (c) {
            return '<option value="' + U.esc(c.clave) + '">' + U.esc(c.etiqueta) + "</option>";
          }).join("") +
          "</select></div>" +

        '<div class="campo"><label for="p-precio">Precio (€) *</label>' +
          '<input id="p-precio" name="precio" type="number" min="0" step="1" required placeholder="85" /></div>' +

        '<div class="campo"><label for="p-estado">Estado</label>' +
          '<input id="p-estado" name="estado" type="text" maxlength="40" placeholder="Usada · 8/10" /></div>' +

        '<div class="campo"><label for="p-minuto">Etiqueta corta</label>' +
          '<input id="p-minuto" name="minuto" type="text" maxlength="20" placeholder="Minuto 45+2" /></div>' +

        '<div class="campo campo--ancho"><label for="p-historia">De dónde viene</label>' +
          '<textarea id="p-historia" name="historia" rows="2" maxlength="300" placeholder="De un mercadillo de Sants, con el ticket dentro…"></textarea></div>' +

        '<div class="campo campo--ancho"><label for="p-desc">Descripción de la pieza</label>' +
          '<textarea id="p-desc" name="descripcion" rows="4" maxlength="900" placeholder="Pulsa «Escribir con IA» o escríbela tú."></textarea></div>' +

        '<div class="campo--ancho" style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center">' +
          '<button class="mini-btn" type="button" data-ia>Escribir con IA</button>' +
          '<span class="mono" data-ia-estado></span>' +
        "</div>" +

        '<fieldset class="admin__fieldset"><legend>Fotos</legend>' +
          '<input type="file" accept="image/*" multiple data-fotos />' +
          '<p class="mono" style="margin-top:.5rem">La primera foto es la principal. Se comprimen solas antes de guardarse.</p>' +
          '<div class="fotos-editor" data-fotos-lista></div>' +
        "</fieldset>" +

        '<fieldset class="admin__fieldset"><legend>Tallas y unidades</legend>' +
          '<div class="tallas-editor" data-preset></div>' +
          '<div class="tallas-editor" style="margin-top:.8rem" data-tallas-lista></div>' +
          '<div class="campo" style="margin-top:.8rem;max-width:260px">' +
            '<label for="p-nota-talla">Nota de tallaje</label>' +
            '<input id="p-nota-talla" name="notaTalla" type="text" maxlength="120" placeholder="Corte de época: más ancha de pecho." />' +
          "</div>" +
        "</fieldset>" +

        '<div class="campo--ancho" style="display:flex;gap:.7rem;flex-wrap:wrap">' +
          '<button class="btn btn--solido" type="submit" data-guardar>Guardar pieza</button>' +
          '<button class="btn" type="button" data-cancelar>Cancelar edición</button>' +
        "</div>" +
      "</form>" +

      '<h3 style="margin-top:2.5rem">Piezas en el archivo (' + lista.length + ")</h3>" +
      '<div class="lista-admin" data-lista-piezas></div>';

    U.$("[data-form-pieza]", cuerpo).addEventListener("submit", guardarPieza);
    U.$("[data-cancelar]", cuerpo).addEventListener("click", function () { resetForm(); });
    U.$("[data-fotos]", cuerpo).addEventListener("change", subirFotos);
    U.$("[data-ia]", cuerpo).addEventListener("click", escribirConIA);

    pintarPresets();
    pintarTallas();
    pintarFotos();
    pintarListaPiezas();

    if (editandoId) cargarEnForm(editandoId);
  }

  function pintarPresets() {
    var cont = U.$("[data-preset]", cuerpo);
    if (!cont) return;
    cont.innerHTML =
      PRESETS.map(function (t) {
        return '<button class="mini-btn" type="button" data-add-talla="' + U.esc(t) + '">+ ' + U.esc(t) + "</button>";
      }).join("") +
      '<button class="mini-btn" type="button" data-add-otra>+ otra…</button>';

    U.$$("[data-add-talla]", cont).forEach(function (b) {
      b.addEventListener("click", function () { anadirTalla(b.dataset.addTalla); });
    });
    U.$("[data-add-otra]", cont).addEventListener("click", function () {
      var t = prompt("¿Qué talla?");
      if (t) anadirTalla(t.trim());
    });
  }

  function anadirTalla(t) {
    if (!t) return;
    for (var i = 0; i < borrador.tallas.length; i++) {
      if (borrador.tallas[i].talla === t) return;
    }
    borrador.tallas.push({ talla: t, stock: 1 });
    pintarTallas();
  }

  function pintarTallas() {
    var cont = U.$("[data-tallas-lista]", cuerpo);
    if (!cont) return;
    if (!borrador.tallas.length) {
      cont.innerHTML = '<span class="mono">Sin tallas todavía. Añade las de arriba.</span>';
      return;
    }
    cont.innerHTML = borrador.tallas.map(function (t, i) {
      return (
        '<span class="talla-edit">' + U.esc(t.talla) +
        ' <input type="number" min="0" max="99" value="' + Number(t.stock) + '" data-stock="' + i + '" aria-label="Unidades de la talla ' + U.esc(t.talla) + '" />' +
        '<button type="button" data-quita-talla="' + i + '" aria-label="Quitar talla">✕</button></span>'
      );
    }).join("");

    U.$$("[data-stock]", cont).forEach(function (inp) {
      inp.addEventListener("input", function () {
        borrador.tallas[Number(inp.dataset.stock)].stock = Math.max(0, Number(inp.value) || 0);
      });
    });
    U.$$("[data-quita-talla]", cont).forEach(function (b) {
      b.addEventListener("click", function () {
        borrador.tallas.splice(Number(b.dataset.quitaTalla), 1);
        pintarTallas();
      });
    });
  }

  function subirFotos(e) {
    var archivos = Array.prototype.slice.call(e.target.files || []);
    if (!archivos.length) return;
    U.aviso("Procesando " + archivos.length + " foto(s)…");
    var cadena = Promise.resolve();
    archivos.forEach(function (a) {
      cadena = cadena.then(function () {
        return M93.store.guardarFoto(a).then(function (ref) {
          borrador.fotos.push(ref);
          pintarFotos();
        });
      });
    });
    cadena
      .then(function () { U.aviso("Fotos añadidas."); e.target.value = ""; })
      .catch(function (err) { U.aviso("No se pudo guardar alguna foto: " + err.message, true); });
  }

  function pintarFotos() {
    var cont = U.$("[data-fotos-lista]", cuerpo);
    if (!cont) return;
    if (!borrador.fotos.length) {
      cont.innerHTML = '<span class="mono">Sin fotos todavía.</span>';
      return;
    }
    cont.innerHTML = borrador.fotos.map(function (f, i) {
      return (
        '<span class="foto-mini"><img src="' + U.esc(M93.store.urlDeFoto(f)) + '" alt="" />' +
        '<button type="button" data-quita-foto="' + i + '" aria-label="Quitar foto">✕</button></span>'
      );
    }).join("");
    U.$$("[data-quita-foto]", cont).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = Number(b.dataset.quitaFoto);
        var ref = borrador.fotos[i];
        borrador.fotos.splice(i, 1);
        if (!editandoId) M93.store.borrarFoto(ref);
        pintarFotos();
      });
    });
  }

  function leerForm() {
    var f = U.$("[data-form-pieza]", cuerpo);
    return {
      nombre: f.nombre.value.trim(),
      subtitulo: f.subtitulo.value.trim(),
      tipo: f.tipo.value,
      precio: Number(f.precio.value) || 0,
      estado: f.estado.value.trim(),
      minuto: f.minuto.value.trim(),
      historia: f.historia.value.trim(),
      descripcion: f.descripcion.value.trim(),
      notaTalla: f.notaTalla.value.trim(),
      fotos: borrador.fotos.slice(),
      tallas: borrador.tallas.slice()
    };
  }

  function escribirConIA() {
    var datos = leerForm();
    if (!datos.nombre) { U.aviso("Ponle nombre a la pieza antes de escribir la ficha.", true); return; }
    var estado = U.$("[data-ia-estado]", cuerpo);
    var boton = U.$("[data-ia]", cuerpo);
    boton.disabled = true;
    if (estado) estado.textContent = "Escribiendo…";
    M93.ia.generar(datos).then(function (r) {
      U.$("#p-desc", cuerpo).value = r.texto;
      boton.disabled = false;
      if (estado) {
        estado.textContent = r.motor === "claude"
          ? "Escrita con Claude (claude-opus-5)."
          : "Escrita con el redactor local. Pulsa otra vez para otra versión.";
      }
      if (r.aviso) U.aviso(r.aviso, true);
    });
  }

  function guardarPieza(e) {
    e.preventDefault();
    var datos = leerForm();
    if (!datos.nombre || !datos.precio) {
      U.aviso("Faltan el nombre o el precio.", true);
      return;
    }
    if (!datos.fotos.length) {
      U.aviso("Añade al menos una foto: la ficha y el 3D la necesitan.", true);
      return;
    }
    if (editandoId) {
      M93.store.actualizarProducto(editandoId, datos);
      U.aviso("Pieza actualizada.");
    } else {
      M93.store.anadirProducto(datos);
      U.aviso("Pieza publicada en el archivo.");
    }
    resetForm();
    pintarPiezas();
    if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
  }

  function resetForm() {
    editandoId = null;
    borrador = { fotos: [], tallas: [] };
    var f = U.$("[data-form-pieza]", cuerpo);
    if (f) f.reset();
    var t = U.$("[data-titulo-form]", cuerpo);
    if (t) t.textContent = "Añadir una pieza";
    var est = U.$("[data-ia-estado]", cuerpo);
    if (est) est.textContent = "";
    pintarPresets();
    pintarTallas();
    pintarFotos();
  }

  function cargarEnForm(id) {
    var p = M93.store.producto(id);
    if (!p) return;
    editandoId = id;
    borrador = { fotos: (p.fotos || []).slice(), tallas: JSON.parse(JSON.stringify(p.tallas || [])) };
    var f = U.$("[data-form-pieza]", cuerpo);
    f.nombre.value = p.nombre || "";
    f.subtitulo.value = p.subtitulo || "";
    f.tipo.value = p.tipo || categorias()[0].clave;
    f.precio.value = p.precio || "";
    f.estado.value = p.estado || "";
    f.minuto.value = p.minuto || "";
    f.historia.value = p.historia || "";
    f.descripcion.value = p.descripcion || "";
    f.notaTalla.value = p.notaTalla || "";
    U.$("[data-titulo-form]", cuerpo).textContent = "Editando: " + p.nombre;
    pintarPresets();
    pintarTallas();
    pintarFotos();
    f.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pintarListaPiezas() {
    var cont = U.$("[data-lista-piezas]", cuerpo);
    if (!cont) return;
    var lista = M93.store.productos();
    if (!lista.length) {
      cont.innerHTML = '<p class="mono" style="padding:1.2rem 0">El archivo está vacío.</p>';
      return;
    }
    cont.innerHTML = lista.map(function (p) {
      var foto = M93.store.urlDeFoto((p.fotos || [])[0]);
      return (
        '<div class="fila">' +
          '<img class="fila__foto" src="' + U.esc(foto) + '" alt="" />' +
          '<div class="fila__texto"><strong>' + U.esc(p.nombre) + "</strong>" +
            '<span class="mono">' + U.esc(U.etiquetaTipo(p.tipo)) + " · " + U.esc(U.precio(p.precio)) +
            " · " + U.disponibles(p).length + " tallas</span></div>" +
          '<div class="fila__acciones">' +
            '<button class="mini-btn" type="button" data-ver="' + U.esc(p.id) + '">Ver ficha</button>' +
            '<button class="mini-btn" type="button" data-editar="' + U.esc(p.id) + '">Editar</button>' +
            '<button class="mini-btn mini-btn--peligro" type="button" data-borrar="' + U.esc(p.id) + '">Borrar</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");

    U.$$("[data-ver]", cont).forEach(function (b) {
      b.addEventListener("click", function () { cerrar(); M93.ficha.abrir(b.dataset.ver); });
    });
    U.$$("[data-editar]", cont).forEach(function (b) {
      b.addEventListener("click", function () { cargarEnForm(b.dataset.editar); });
    });
    U.$$("[data-borrar]", cont).forEach(function (b) {
      b.addEventListener("click", function () {
        var p = M93.store.producto(b.dataset.borrar);
        if (!p || !confirm("¿Borrar «" + p.nombre + "»? No se puede deshacer.")) return;
        M93.store.borrarProducto(p.id);
        if (editandoId === p.id) resetForm();
        pintarPiezas();
        actualizarResumen();
        if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
        U.aviso("Pieza borrada.");
      });
    });
  }

  /* ---------- pestaña: buzón ------------------------------------ */

  function pintarBuzon() {
    var cont = U.$('[data-seccion="buzon"]', cuerpo);
    var lista = M93.store.peticiones();
    cont.innerHTML =
      "<h3>Peticiones recibidas (" + lista.length + ")</h3>" +
      '<p class="mono" style="margin:.6rem 0 1.4rem">Las marcadas como públicas salen en el muro de la web.</p>' +
      '<div class="lista-admin" data-lista-buzon></div>';

    var caja = U.$("[data-lista-buzon]", cont);
    if (!lista.length) {
      caja.innerHTML = '<p class="mono" style="padding:1.2rem 0">Todavía no hay peticiones.</p>';
      return;
    }
    caja.innerHTML = lista.map(function (q) {
      return (
        '<div class="fila">' +
          '<div class="fila__texto"><strong>' + U.esc(q.pieza) + "</strong>" +
            '<span class="mono">' + U.esc(q.nombre || "anónimo") + " · " + U.esc(q.tipo || "—") +
            " · talla " + U.esc(q.talla || "—") + " · " + U.esc(q.fecha || "") +
            (q.contacto ? " · " + U.esc(q.contacto) : "") + "</span></div>" +
          '<div class="fila__acciones">' +
            (q.contacto ? '<a class="mini-btn" href="mailto:' + U.esc(q.contacto) + '">Responder</a>' : "") +
            '<button class="mini-btn" type="button" data-publicar="' + U.esc(q.id) + '">' +
              (q.publica ? "Ocultar del muro" : "Publicar en el muro") + "</button>" +
            '<button class="mini-btn mini-btn--peligro" type="button" data-borrar-q="' + U.esc(q.id) + '">Borrar</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");

    U.$$("[data-publicar]", caja).forEach(function (b) {
      b.addEventListener("click", function () {
        M93.store.alternarPeticion(b.dataset.publicar);
        pintarBuzon();
        if (M93.app && M93.app.repintarMuro) M93.app.repintarMuro();
      });
    });
    U.$$("[data-borrar-q]", caja).forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("¿Borrar esta petición?")) return;
        M93.store.borrarPeticion(b.dataset.borrarQ);
        pintarBuzon();
        actualizarResumen();
        if (M93.app && M93.app.repintarMuro) M93.app.repintarMuro();
      });
    });
  }

  /* ---------- pestaña: ajustes ---------------------------------- */

  function pintarAjustes() {
    var cont = U.$('[data-seccion="ajustes"]', cuerpo);
    var cfg = M93.store.config();

    cont.innerHTML =
      '<form class="admin__form" data-form-clave>' +
        '<h3 style="grid-column:1/-1">Contraseña</h3>' +
        '<div class="campo"><label for="c-nueva">Nueva contraseña</label>' +
          '<input id="c-nueva" type="password" minlength="4" required autocomplete="new-password" /></div>' +
        '<div class="campo"><label for="c-rep">Repítela</label>' +
          '<input id="c-rep" type="password" minlength="4" required autocomplete="new-password" /></div>' +
        '<div class="campo--ancho"><button class="btn btn--solido" type="submit">Cambiar contraseña</button></div>' +
      "</form>" +

      '<form class="admin__form" data-form-ia style="margin-top:2rem">' +
        '<h3 style="grid-column:1/-1">Redacción de fichas</h3>' +
        '<p class="campo--ancho" style="color:var(--tinta-2);font-size:.92rem">' +
          "Por defecto las fichas las escribe el redactor local, que funciona sin conexión y sin coste. " +
          "Si pegas una API key de Anthropic, las escribirá Claude (modelo claude-opus-5). " +
          "<strong>La clave se guarda en este navegador</strong>: úsala sólo en tu ordenador, nunca en uno compartido." +
        "</p>" +
        '<div class="campo campo--ancho"><label for="c-key">API key de Anthropic (opcional)</label>' +
          '<input id="c-key" type="password" placeholder="sk-ant-…" value="' + U.esc(cfg.apiKey || "") + '" autocomplete="off" /></div>' +
        '<div class="campo--ancho" style="display:flex;gap:.6rem;flex-wrap:wrap">' +
          '<button class="btn btn--solido" type="submit">Guardar clave</button>' +
          '<button class="btn" type="button" data-borrar-key>Quitar clave</button>' +
        "</div>" +
      "</form>" +

      '<div style="margin-top:2.4rem">' +
        "<h3>Catálogo</h3>" +
        '<p class="mono" style="margin:.6rem 0 1.2rem">Exporta para hacer copia de seguridad o para pasarlo a otro navegador.</p>' +
        '<div style="display:flex;gap:.7rem;flex-wrap:wrap">' +
          '<button class="btn btn--solido" type="button" data-exportar>Exportar catálogo</button>' +
          '<label class="btn" style="cursor:pointer">Importar catálogo' +
            '<input type="file" accept="application/json,.json" data-importar hidden /></label>' +
          '<button class="btn" type="button" data-restaurar>Volver al catálogo original</button>' +
        "</div>" +
      "</div>";

    U.$("[data-form-clave]", cont).addEventListener("submit", function (e) {
      e.preventDefault();
      var a = U.$("#c-nueva", cont).value, b = U.$("#c-rep", cont).value;
      if (a.length < 4) return U.aviso("Mínimo 4 caracteres.", true);
      if (a !== b) return U.aviso("Las dos contraseñas no coinciden.", true);
      hash(a).then(function (h) {
        M93.store.guardarConfig({ claveHash: h });
        U.aviso("Contraseña cambiada.");
        e.target.reset();
      });
    });

    U.$("[data-form-ia]", cont).addEventListener("submit", function (e) {
      e.preventDefault();
      M93.store.guardarConfig({ apiKey: U.$("#c-key", cont).value.trim() });
      U.aviso("Clave guardada en este navegador.");
    });

    U.$("[data-borrar-key]", cont).addEventListener("click", function () {
      M93.store.guardarConfig({ apiKey: "" });
      U.$("#c-key", cont).value = "";
      U.aviso("Clave eliminada. Vuelve el redactor local.");
    });

    U.$("[data-exportar]", cont).addEventListener("click", function () {
      M93.store.exportar().then(function (datos) {
        var blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "minuto93-catalogo-" + new Date().toISOString().slice(0, 10) + ".json";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        U.aviso("Catálogo exportado.");
      });
    });

    U.$("[data-importar]", cont).addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var lector = new FileReader();
      lector.onload = function () {
        try {
          M93.store.importar(JSON.parse(lector.result))
            .then(function (n) {
              U.aviso("Importadas " + n + " piezas.");
              pintarPiezas();
              if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
              if (M93.app && M93.app.repintarMuro) M93.app.repintarMuro();
            })
            .catch(function (err) { U.aviso(err.message, true); });
        } catch (err) {
          U.aviso("Ese archivo no es un catálogo válido.", true);
        }
      };
      lector.readAsText(f);
    });

    U.$("[data-restaurar]", cont).addEventListener("click", function () {
      if (!confirm("Esto borra tus cambios y vuelve al catálogo que viene con la web. ¿Seguro?")) return;
      M93.store.restaurarSemilla();
      pintarPiezas();
      if (M93.app && M93.app.repintarArchivo) M93.app.repintarArchivo();
      if (M93.app && M93.app.repintarMuro) M93.app.repintarMuro();
      U.aviso("Catálogo original restaurado.");
    });
  }

  /* ---------- apertura / cierre --------------------------------- */

  function abrir() {
    dlg = dlg || U.$("[data-admin]");
    cuerpo = cuerpo || U.$("[data-panel-cuerpo]");
    if (!dlg || !cuerpo) return;
    if (activo()) pintarPanel();
    else pintarAcceso("");
    if (typeof dlg.showModal === "function") { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute("open", "");
    document.documentElement.style.overflow = "hidden";
  }

  function cerrar() {
    if (!dlg) return;
    if (dlg.open && typeof dlg.close === "function") dlg.close();
    else dlg.removeAttribute("open");
    document.documentElement.style.overflow = "";
  }

  function editar(id) {
    editandoId = id;
    pestanaActiva = "piezas";
    abrir();
  }

  function iniciar() {
    dlg = U.$("[data-admin]");
    cuerpo = U.$("[data-panel-cuerpo]");
    if (!dlg) return;
    var btn = U.$("[data-cerrar-admin]");
    if (btn) btn.addEventListener("click", cerrar);
    dlg.addEventListener("close", function () { document.documentElement.style.overflow = ""; });

    U.$$("[data-abrir-admin]").forEach(function (b) {
      b.addEventListener("click", function () { abrir(); });
    });

    // Atajo: Ctrl + Shift + A
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        abrir();
      }
    });
  }

  M93.admin = { iniciar: iniciar, abrir: abrir, cerrar: cerrar, editar: editar, activo: activo };
})();
