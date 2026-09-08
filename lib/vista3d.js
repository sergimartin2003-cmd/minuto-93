/* =============================================================
   MINUTO 93 — vista 3D generada desde las fotos
   Qué hace, sin humo: coge la foto del producto, la analiza pixel
   a pixel y construye un relieve real en tres dimensiones
   (una malla con miles de vértices) que puedes girar con el dedo
   o con el ratón.
     · Separa la pieza del fondo comparando cada pixel con el
       color de los bordes de la foto.
     · Eleva la silueta y añade micro-relieve según la luz de la
       imagen (lo oscuro hunde, lo claro sobresale).
     · Si la foto no permite separar la pieza, cae a un modo de
       relieve por luminancia, que siempre funciona.
   Requiere three.min.js cargado antes que este archivo.
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});

  function disponible() {
    return typeof window.THREE !== "undefined";
  }

  /* ---------- análisis de la imagen ---------------------------- */

  function analizar(img, res) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error("imagen sin dimensiones");

    var escala = res / Math.max(w, h);
    var cw = Math.max(8, Math.round(w * escala));
    var ch = Math.max(8, Math.round(h * escala));

    var lienzo = document.createElement("canvas");
    lienzo.width = cw;
    lienzo.height = ch;
    var ctx = lienzo.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);

    var datos = ctx.getImageData(0, 0, cw, ch).data; // puede lanzar SecurityError en file://

    /* Color de fondo = mediana de los pixeles del borde */
    var rs = [], gs = [], bs = [];
    function tomar(x, y) {
      var i = (y * cw + x) * 4;
      rs.push(datos[i]); gs.push(datos[i + 1]); bs.push(datos[i + 2]);
    }
    for (var x = 0; x < cw; x++) { tomar(x, 0); tomar(x, ch - 1); }
    for (var y = 0; y < ch; y++) { tomar(0, y); tomar(cw - 1, y); }
    function mediana(a) { a.sort(function (p, q) { return p - q; }); return a[Math.floor(a.length / 2)]; }
    var fondo = [mediana(rs), mediana(gs), mediana(bs)];

    /* Mapa de alturas */
    var altura = new Float32Array(cw * ch);
    var lum = new Float32Array(cw * ch);
    var cubiertos = 0;

    for (var j = 0; j < ch; j++) {
      for (var i2 = 0; i2 < cw; i2++) {
        var k = (j * cw + i2) * 4;
        var r = datos[k], g = datos[k + 1], b = datos[k + 2];
        var l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        lum[j * cw + i2] = l;

        var d = Math.sqrt(
          (r - fondo[0]) * (r - fondo[0]) +
          (g - fondo[1]) * (g - fondo[1]) +
          (b - fondo[2]) * (b - fondo[2])
        ) / 441.67;

        var m = (d - 0.10) / 0.16;          // smoothstep manual
        m = m < 0 ? 0 : m > 1 ? 1 : m;
        m = m * m * (3 - 2 * m);
        altura[j * cw + i2] = m;
        if (m > 0.5) cubiertos++;
      }
    }

    var cobertura = cubiertos / (cw * ch);
    var modo = "silueta";

    /* Si la separación no ha funcionado, relieve por luminancia */
    if (cobertura < 0.06 || cobertura > 0.94) {
      modo = "luminancia";
      for (var n = 0; n < altura.length; n++) altura[n] = 1 - lum[n];
    }

    /* Micro-relieve por luz + margen plano en los bordes */
    var margen = Math.max(2, Math.round(Math.min(cw, ch) * 0.03));
    for (var jj = 0; jj < ch; jj++) {
      for (var ii = 0; ii < cw; ii++) {
        var idx = jj * cw + ii;
        var det = modo === "silueta" ? (0.65 + 0.35 * (1 - lum[idx])) : 1;
        altura[idx] *= det;
        var db = Math.min(ii, jj, cw - 1 - ii, ch - 1 - jj);
        if (db < margen) altura[idx] *= db / margen;
      }
    }

    /* Suavizado (media de 3x3) para quitar el ruido del JPG */
    var suave = new Float32Array(altura.length);
    for (var y2 = 0; y2 < ch; y2++) {
      for (var x2 = 0; x2 < cw; x2++) {
        var s = 0, c = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            var xx = x2 + dx, yy = y2 + dy;
            if (xx < 0 || yy < 0 || xx >= cw || yy >= ch) continue;
            s += altura[yy * cw + xx]; c++;
          }
        }
        suave[y2 * cw + x2] = s / c;
      }
    }

    return { ancho: cw, alto: ch, altura: suave, modo: modo, relacion: w / h };
  }

  /* ---------- escena ------------------------------------------- */

  function crear(lienzo) {
    if (!disponible()) return null;

    var THREE = window.THREE;
    var renderer, escena, camara, grupo, malla, base, textura, geom, animId;
    var arrastrando = false, px = 0, py = 0;
    var objetivoX = -0.12, objetivoY = 0.5;
    var actualX = -0.12, actualY = 0.5;
    var vivo = true;

    renderer = new THREE.WebGLRenderer({
      canvas: lienzo,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(lienzo.clientWidth || 600, lienzo.clientHeight || 420, false);
    if (renderer.outputEncoding !== undefined && THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    escena = new THREE.Scene();
    camara = new THREE.PerspectiveCamera(38, 1.4, 0.1, 100);
    camara.position.set(0, 0, 5.2);

    grupo = new THREE.Group();
    escena.add(grupo);

    escena.add(new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 0.85));
    var clave = new THREE.DirectionalLight(0xffffff, 1.35);
    clave.position.set(2.4, 3.2, 3.4);
    escena.add(clave);
    var borde = new THREE.DirectionalLight(0xdfff3a, 0.45);
    borde.position.set(-3.2, -1.4, 1.2);
    escena.add(borde);

    function medir() {
      var w = lienzo.clientWidth || 600;
      var h = lienzo.clientHeight || 420;
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
    }

    function limpiar() {
      if (malla) {
        grupo.remove(malla);
        if (malla.geometry) malla.geometry.dispose();
        if (malla.material) malla.material.dispose();
        malla = null;
      }
      if (base) {
        grupo.remove(base);
        base.geometry.dispose();
        base.material.dispose();
        base = null;
      }
      if (textura) { textura.dispose(); textura = null; }
    }

    /* Construye el relieve a partir de una imagen ya cargada */
    function construir(img) {
      limpiar();

      var relacion = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      var analisis = null;
      var modo = "plano";

      try {
        analisis = analizar(img, 150);
        modo = analisis.modo;
      } catch (e) {
        // Canvas "contaminado": pasa al abrir la web con doble clic (file://).
        console.warn("[3d] sin acceso a los pixeles, muestro volumen plano:", e && e.message);
      }

      var anchoMundo = relacion >= 1 ? 3.2 : 3.2 * relacion;
      var altoMundo = relacion >= 1 ? 3.2 / relacion : 3.2;

      var segX = analisis ? analisis.ancho - 1 : 24;
      var segY = analisis ? analisis.alto - 1 : 24;
      geom = new THREE.PlaneGeometry(anchoMundo, altoMundo, segX, segY);

      if (analisis) {
        var pos = geom.attributes.position;
        var amp = analisis.modo === "silueta" ? 0.42 : 0.26;
        var cw = analisis.ancho, ch = analisis.alto;
        for (var v = 0; v < pos.count; v++) {
          var col = v % (segX + 1);
          var fil = Math.floor(v / (segX + 1));
          var hx = Math.min(cw - 1, col);
          var hy = Math.min(ch - 1, fil);
          pos.setZ(v, analisis.altura[hy * cw + hx] * amp);
        }
        pos.needsUpdate = true;
        geom.computeVertexNormals();
      }

      textura = new THREE.Texture(img);
      textura.needsUpdate = true;
      if (THREE.sRGBEncoding !== undefined) textura.encoding = THREE.sRGBEncoding;
      textura.minFilter = THREE.LinearFilter;
      textura.generateMipmaps = false;

      malla = new THREE.Mesh(
        geom,
        new THREE.MeshStandardMaterial({
          map: textura,
          roughness: 0.78,
          metalness: 0.04
        })
      );
      grupo.add(malla);

      /* Base sólida: convierte el relieve en un objeto con cuerpo */
      base = new THREE.Mesh(
        new THREE.BoxGeometry(anchoMundo, altoMundo, 0.34),
        new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.98, metalness: 0 })
      );
      base.position.z = -0.172;
      grupo.add(base);

      return modo;
    }

    function cargar(url) {
      return new Promise(function (resolve, reject) {
        if (!url) return reject(new Error("sin foto"));
        var img = new Image();
        img.decoding = "async";
        img.onload = function () {
          try {
            var modo = construir(img);
            medir();
            resolve(modo);
          } catch (e) { reject(e); }
        };
        img.onerror = function () { reject(new Error("no se pudo cargar la foto")); };
        img.src = url;
      });
    }

    /* ---------- interacción ---------- */

    function alBajar(e) {
      arrastrando = true;
      px = (e.touches ? e.touches[0].clientX : e.clientX);
      py = (e.touches ? e.touches[0].clientY : e.clientY);
      lienzo.classList.add("is-grabbing");
    }
    function alMover(e) {
      if (!arrastrando) return;
      var cx = (e.touches ? e.touches[0].clientX : e.clientX);
      var cy = (e.touches ? e.touches[0].clientY : e.clientY);
      objetivoY += (cx - px) * 0.008;
      objetivoX += (cy - py) * 0.006;
      objetivoX = Math.max(-0.9, Math.min(0.9, objetivoX));
      px = cx; py = cy;
      if (e.cancelable) e.preventDefault();
    }
    function alSubir() {
      arrastrando = false;
      lienzo.classList.remove("is-grabbing");
    }

    lienzo.addEventListener("mousedown", alBajar);
    window.addEventListener("mousemove", alMover);
    window.addEventListener("mouseup", alSubir);
    lienzo.addEventListener("touchstart", alBajar, { passive: true });
    lienzo.addEventListener("touchmove", alMover, { passive: false });
    lienzo.addEventListener("touchend", alSubir);

    var t0 = performance.now();
    function bucle(t) {
      if (!vivo) return;
      animId = requestAnimationFrame(bucle);
      var dt = (t - t0) / 1000;
      t0 = t;
      if (!arrastrando) {
        objetivoY += dt * 0.22;                       // giro lento continuo
        objetivoX += (Math.sin(t / 2600) * 0.10 - objetivoX) * 0.01;
      }
      actualY += (objetivoY - actualY) * 0.09;
      actualX += (objetivoX - actualX) * 0.09;
      grupo.rotation.y = Math.sin(actualY) * 0.62;
      grupo.rotation.x = actualX * 0.5;
      renderer.render(escena, camara);
    }
    animId = requestAnimationFrame(bucle);

    var alRedimensionar = medir;
    window.addEventListener("resize", alRedimensionar);

    var api = {
      cargar: cargar,
      medir: medir,
      /* Pinta un fotograma suelto: útil cuando el navegador congela el
         rAF (pestaña en segundo plano) y al volver hay que refrescar. */
      pintar: function () { renderer.render(escena, camara); },
      centrar: function () { objetivoX = -0.12; objetivoY = 0.5; },
      destruir: function () {
        vivo = false;
        cancelAnimationFrame(animId);
        window.removeEventListener("resize", alRedimensionar);
        window.removeEventListener("mousemove", alMover);
        window.removeEventListener("mouseup", alSubir);
        limpiar();
        try { renderer.dispose(); } catch (e) { /* nada */ }
        if (M93.vista3d.ultimo === api) M93.vista3d.ultimo = null;
      }
    };

    M93.vista3d.ultimo = api;
    return api;
  }

  M93.vista3d = { crear: crear, disponible: disponible, ultimo: null };
})();
