/* =============================================================
   MINUTO 93 — capa de datos
   - Catálogo, peticiones y ajustes  ->  localStorage
   - Fotos subidas desde el admin    ->  IndexedDB (blobs)
   Sin JS moderno de módulos: todo cuelga de window.M93
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});

  var LS_PRODUCTOS = "m93.productos.v1";
  var LS_PETICIONES = "m93.peticiones.v1";
  var LS_CONFIG = "m93.config.v1";
  var DB_NAME = "m93-fotos";
  var DB_STORE = "fotos";

  /* ---------- utilidades ------------------------------------- */

  function leerLS(clave, porDefecto) {
    try {
      var crudo = localStorage.getItem(clave);
      if (!crudo) return porDefecto;
      var valor = JSON.parse(crudo);
      return valor == null ? porDefecto : valor;
    } catch (e) {
      console.warn("[store] no se pudo leer", clave, e);
      return porDefecto;
    }
  }

  function escribirLS(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.warn("[store] no se pudo guardar", clave, e);
      return false;
    }
  }

  function clon(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function nuevoId(prefijo) {
    return (
      prefijo +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  /* ---------- IndexedDB para las fotos ------------------------ */

  var dbPromesa = null;

  function abrirDB() {
    if (dbPromesa) return dbPromesa;
    dbPromesa = new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error("sin IndexedDB"));
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    }).catch(function (e) {
      console.warn("[store] IndexedDB no disponible:", e);
      return null;
    });
    return dbPromesa;
  }

  function idbPoner(clave, blob) {
    return abrirDB().then(function (db) {
      if (!db) throw new Error("sin IndexedDB");
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(blob, clave);
        tx.oncomplete = function () { resolve(clave); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function idbSacar(clave) {
    return abrirDB().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        var tx = db.transaction(DB_STORE, "readonly");
        var req = tx.objectStore(DB_STORE).get(clave);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { resolve(null); };
      });
    });
  }

  function idbBorrar(clave) {
    return abrirDB().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        var tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(clave);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    });
  }

  function idbClaves() {
    return abrirDB().then(function (db) {
      if (!db) return [];
      return new Promise(function (resolve) {
        var tx = db.transaction(DB_STORE, "readonly");
        var req = tx.objectStore(DB_STORE).getAllKeys();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { resolve([]); };
      });
    });
  }

  /* Caché ref -> URL utilizable en un <img> */
  var urls = Object.create(null);

  function urlDeFoto(ref) {
    if (!ref) return "";
    if (ref.indexOf("idb:") !== 0) return ref;      // ruta normal del disco
    return urls[ref] || "";                          // blob hidratado
  }

  function hidratar() {
    return idbClaves()
      .then(function (claves) {
        return Promise.all(
          claves.map(function (clave) {
            return idbSacar(clave).then(function (blob) {
              if (!blob) return;
              try {
                urls["idb:" + clave] = URL.createObjectURL(blob);
              } catch (e) { /* nada */ }
            });
          })
        );
      })
      .catch(function () { return null; });
  }

  /* Redimensiona y comprime antes de guardar: fotos ligeras = web rápida */
  function guardarFoto(archivo) {
    var MAX = 1600;
    return new Promise(function (resolve, reject) {
      var lector = new FileReader();
      lector.onerror = function () { reject(new Error("no se pudo leer el archivo")); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("archivo de imagen no válido")); };
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          var escala = Math.min(1, MAX / Math.max(w, h));
          var lienzo = document.createElement("canvas");
          lienzo.width = Math.max(1, Math.round(w * escala));
          lienzo.height = Math.max(1, Math.round(h * escala));
          var ctx = lienzo.getContext("2d");
          ctx.drawImage(img, 0, 0, lienzo.width, lienzo.height);
          lienzo.toBlob(
            function (blob) {
              if (!blob) return reject(new Error("no se pudo comprimir"));
              var clave = nuevoId("foto");
              idbPoner(clave, blob)
                .then(function () {
                  var ref = "idb:" + clave;
                  urls[ref] = URL.createObjectURL(blob);
                  resolve(ref);
                })
                .catch(reject);
            },
            "image/webp",
            0.86
          );
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function borrarFoto(ref) {
    if (!ref || ref.indexOf("idb:") !== 0) return Promise.resolve();
    var clave = ref.slice(4);
    if (urls[ref]) {
      try { URL.revokeObjectURL(urls[ref]); } catch (e) { /* nada */ }
      delete urls[ref];
    }
    return idbBorrar(clave);
  }

  function fotoADataURL(ref) {
    if (!ref) return Promise.resolve(null);
    if (ref.indexOf("idb:") !== 0) return Promise.resolve(ref);
    return idbSacar(ref.slice(4)).then(function (blob) {
      if (!blob) return null;
      return new Promise(function (resolve) {
        var lector = new FileReader();
        lector.onload = function () { resolve(lector.result); };
        lector.onerror = function () { resolve(null); };
        lector.readAsDataURL(blob);
      });
    });
  }

  function dataURLAFoto(dataURL) {
    return fetch(dataURL)
      .then(function (r) { return r.blob(); })
      .then(function (blob) {
        var clave = nuevoId("foto");
        return idbPoner(clave, blob).then(function () {
          var ref = "idb:" + clave;
          urls[ref] = URL.createObjectURL(blob);
          return ref;
        });
      });
  }

  /* ---------- productos --------------------------------------- */

  function semilla() {
    var b = window.__BRAND__ || {};
    return clon(b.productos || []);
  }

  function productos() {
    var guardados = leerLS(LS_PRODUCTOS, null);
    if (Array.isArray(guardados)) return guardados;
    return semilla();
  }

  function guardarProductos(lista) {
    return escribirLS(LS_PRODUCTOS, lista);
  }

  function producto(id) {
    var lista = productos();
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function anadirProducto(p) {
    var lista = productos();
    p.id = p.id || nuevoId("m93");
    p.creado = Date.now();
    lista.unshift(p);
    guardarProductos(lista);
    return p;
  }

  function actualizarProducto(id, parche) {
    var lista = productos();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) {
        lista[i] = Object.assign({}, lista[i], parche);
        guardarProductos(lista);
        return lista[i];
      }
    }
    return null;
  }

  function borrarProducto(id) {
    var lista = productos();
    var fuera = null;
    var resto = lista.filter(function (p) {
      if (p.id === id) { fuera = p; return false; }
      return true;
    });
    guardarProductos(resto);
    if (fuera && fuera.fotos) fuera.fotos.forEach(borrarFoto);
    return fuera;
  }

  /* ---------- buzón de peticiones ----------------------------- */

  function peticiones() {
    var guardadas = leerLS(LS_PETICIONES, null);
    if (Array.isArray(guardadas)) return guardadas;
    var b = window.__BRAND__ || {};
    return clon(b.peticiones || []);
  }

  function guardarPeticiones(lista) { return escribirLS(LS_PETICIONES, lista); }

  function anadirPeticion(p) {
    var lista = peticiones();
    p.id = nuevoId("q");
    p.fecha = new Date().toISOString().slice(0, 10);
    if (typeof p.publica !== "boolean") p.publica = true;
    lista.unshift(p);
    guardarPeticiones(lista);
    return p;
  }

  function borrarPeticion(id) {
    guardarPeticiones(peticiones().filter(function (p) { return p.id !== id; }));
  }

  function alternarPeticion(id) {
    var lista = peticiones();
    lista.forEach(function (p) { if (p.id === id) p.publica = !p.publica; });
    guardarPeticiones(lista);
  }

  /* ---------- ajustes ----------------------------------------- */

  function config() {
    return leerLS(LS_CONFIG, {});
  }

  function guardarConfig(parche) {
    var actual = config();
    var nuevo = Object.assign({}, actual, parche);
    escribirLS(LS_CONFIG, nuevo);
    return nuevo;
  }

  /* ---------- exportar / importar ------------------------------ */

  function exportar() {
    var lista = productos();
    var trabajos = [];
    var copia = clon(lista);
    copia.forEach(function (p) {
      (p.fotos || []).forEach(function (ref, i) {
        trabajos.push(
          fotoADataURL(ref).then(function (d) { if (d) p.fotos[i] = d; })
        );
      });
    });
    return Promise.all(trabajos).then(function () {
      return {
        marca: "MINUTO 93",
        version: 1,
        exportado: new Date().toISOString(),
        productos: copia,
        peticiones: peticiones()
      };
    });
  }

  function importar(datos) {
    if (!datos || !Array.isArray(datos.productos)) {
      return Promise.reject(new Error("El archivo no tiene el formato esperado."));
    }
    var lista = clon(datos.productos);
    var trabajos = [];
    lista.forEach(function (p) {
      (p.fotos || []).forEach(function (ref, i) {
        if (typeof ref === "string" && ref.indexOf("data:") === 0) {
          trabajos.push(
            dataURLAFoto(ref).then(function (nuevo) { p.fotos[i] = nuevo; })
          );
        }
      });
    });
    return Promise.all(trabajos).then(function () {
      guardarProductos(lista);
      if (Array.isArray(datos.peticiones)) guardarPeticiones(datos.peticiones);
      return lista.length;
    });
  }

  function restaurarSemilla() {
    try {
      localStorage.removeItem(LS_PRODUCTOS);
      localStorage.removeItem(LS_PETICIONES);
    } catch (e) { /* nada */ }
  }

  /* ---------- API pública ------------------------------------- */

  M93.store = {
    hidratar: hidratar,
    urlDeFoto: urlDeFoto,
    guardarFoto: guardarFoto,
    borrarFoto: borrarFoto,

    productos: productos,
    producto: producto,
    guardarProductos: guardarProductos,
    anadirProducto: anadirProducto,
    actualizarProducto: actualizarProducto,
    borrarProducto: borrarProducto,

    peticiones: peticiones,
    anadirPeticion: anadirPeticion,
    borrarPeticion: borrarPeticion,
    alternarPeticion: alternarPeticion,

    config: config,
    guardarConfig: guardarConfig,

    exportar: exportar,
    importar: importar,
    restaurarSemilla: restaurarSemilla,
    nuevoId: nuevoId
  };
})();
