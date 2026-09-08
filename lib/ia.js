/* =============================================================
   MINUTO 93 — redacción automática de fichas
   Dos motores:
   1) LOCAL (por defecto): funciona sin conexión y sin claves.
      Compone la ficha a partir de los datos de la pieza con un
      banco de frases propio de la marca. Cada pulsación da un
      texto distinto.
   2) CLAUDE (opcional): si el admin guarda una API key de
      Anthropic, la ficha la escribe el modelo claude-opus-5.
      Ojo: la clave queda guardada en este navegador.
   ============================================================= */
(function () {
  "use strict";

  var M93 = (window.M93 = window.M93 || {});

  /* ---------- utilidades de azar ------------------------------ */

  var ultimas = Object.create(null); // evita repetir la misma frase seguida

  function elegir(clave, opciones) {
    if (!opciones || !opciones.length) return "";
    var i = Math.floor(Math.random() * opciones.length);
    if (opciones.length > 1 && opciones[i] === ultimas[clave]) {
      i = (i + 1) % opciones.length;
    }
    ultimas[clave] = opciones[i];
    return opciones[i];
  }

  function contiene(texto, palabras) {
    var t = (texto || "").toLowerCase();
    for (var i = 0; i < palabras.length; i++) {
      if (t.indexOf(palabras[i]) !== -1) return true;
    }
    return false;
  }

  function unir(frases) {
    return frases
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/\s([,.;:])/g, "$1")
      .trim();
  }

  /* ---------- banco de frases --------------------------------- */

  var TEJIDO = {
    algodon: [
      "Algodón peinado, pesado, del que cae recto y no se pega al cuerpo.",
      "Punto de algodón denso, con el cuerpo que tenían las prendas antes de adelgazar el gramaje.",
      "Algodón grueso y mate, sin brillos raros ni tacto de plástico."
    ],
    malla: [
      "Malla perforada de las de verdad, la que se inventó para que corriera el aire y no para el catálogo.",
      "Tejido calado en el pecho y la espalda, ligero, casi sin peso en la mano.",
      "Malla técnica de trama abierta que deja pasar la luz al ponerla a contraluz."
    ],
    poliester: [
      "Poliéster de los que respiraban poco y aguantaban todo.",
      "Tejido sintético de época, con ese brillo justo que se apaga con el uso.",
      "Poliéster ligero pensado para noventa minutos de calor y tres lavados por semana."
    ],
    lana: [
      "Mezcla áspera de las antiguas, con el tacto de lana que ya no fabrica nadie.",
      "Tejido rugoso y cerrado, más de invierno que de campo seco."
    ],
    generico: [
      "Confección de cuando el detalle no era una opción de catálogo.",
      "Fabricación cuidada, de las que se notan al cogerla con la mano.",
      "Materiales de otra época, elegidos cuando la ropa se hacía para durar."
    ]
  };

  var DETALLE = [
    "Escudo bordado punto a punto, no estampado: se nota al pasar el dedo.",
    "Costuras laterales sin ceder y cuello con el canalé todavía firme.",
    "Los números y el ribete están íntegros, sin cuarteos ni despegados.",
    "Sin bolas en las axilas ni transparencias por lavado: se ha usado con cabeza.",
    "El corte de época se nota: más ancho de pecho y más corto de largo que lo de hoy.",
    "Etiqueta interior legible, con la composición y la talla original todavía a la vista.",
    "Puños y bajos revisados uno a uno: ni un hilo suelto, ni un elástico dado de sí."
  ];

  var DETALLE_PORTERO = [
    "Hombreras acolchadas todavía con cuerpo y codos reforzados sin abrir.",
    "Manga larga con puño elástico que aprieta, que es lo primero que se rinde en estas prendas.",
    "Cuello alto de portero antiguo, de los que abrigan de verdad."
  ];

  var ESTADO = {
    nueva: [
      "Nunca se ha puesto: conserva etiqueta y ese olor a tienda cerrada.",
      "Stock antiguo sin estrenar: la prenda más nueva del archivo y, a la vez, la más vieja.",
      "Sale de la bolsa como entró y no ha pisado un campo."
    ],
    buena: [
      "Se ha usado poco y se nota en todas partes menos en el precio.",
      "Un par de puestas, ninguna marca reseñable: pieza casi intacta.",
      "El paso del tiempo se ve en el tono, no en el estado."
    ],
    usada: [
      "Ha vivido, y eso está en las fotos y está escrito: no escondemos nada.",
      "Tiene marcas de uso honestas, de las que cuentan algo en lugar de estorbar.",
      "No es perfecta y no lo pretende: cada señal está fotografiada de cerca."
    ]
  };

  var CIERRE = [
    "Se lleva sola, con vaqueros oscuros y sin más explicación.",
    "Vale para el campo y para la calle, que es donde acaba pasando la mayor parte del tiempo.",
    "Una prenda para llevar puesta, no para enmarcar.",
    "Suficientemente sobria para el día a día y suficientemente rara para que te pregunten.",
    "De las que se ponen un sábado y ya no vuelven al fondo del armario."
  ];

  function tejidoDe(p) {
    var texto = [p.nombre, p.subtitulo, p.historia, p.descripcion].join(" ");
    if (contiene(texto, ["algodón", "algodon", "retro", "reedición", "reedicion", "70", "80"])) return TEJIDO.algodon;
    if (contiene(texto, ["malla", "perforad", "calad"])) return TEJIDO.malla;
    if (contiene(texto, ["lana", "invierno", "felpa"])) return TEJIDO.lana;
    if (contiene(texto, ["poliéster", "poliester", "técnic", "tecnic", "90", "9"])) return TEJIDO.poliester;
    return TEJIDO.generico;
  }

  function estadoDe(p) {
    var e = (p.estado || "").toLowerCase();
    if (contiene(e, ["nueva", "sin estrenar", "etiqueta", "deadstock"])) return ESTADO.nueva;
    if (contiene(e, ["9/10", "10/10", "excelente"])) return ESTADO.buena;
    return ESTADO.usada;
  }

  /* Genera una ficha nueva, distinta cada vez que se pulsa */
  function generarLocal(p) {
    var esPortero = p.tipo === "portero";
    var epoca = "";
    var anos = (p.subtitulo || "").match(/\b(19|20)\d{2}\b|\b\d{2}\/\d{2}\b/);
    if (anos) {
      epoca = elegir("epoca", [
        "De la " + anos[0] + ", y se nota en cada acabado.",
        "Fechada en la " + anos[0] + ": el detalle está en la construcción, no en el logo.",
        "Pieza de la temporada " + anos[0] + ", con todo lo que eso implica."
      ]);
    }

    return unir([
      elegir("tejido", tejidoDe(p)),
      epoca,
      elegir("detalle", esPortero ? DETALLE_PORTERO : DETALLE),
      elegir("estado", estadoDe(p)),
      elegir("cierre", CIERRE)
    ]);
  }

  /* ---------- motor Claude (opcional) -------------------------- */

  var SISTEMA =
    "Eres el redactor de MINUTO 93, una tienda de camisetas de fútbol de segunda mano " +
    "con sede en Barcelona. Escribes fichas de producto en español de España, en tercera persona, " +
    "con tono editorial y seco: frases cortas, cero marketing, cero superlativos, cero palabras como " +
    "'exclusivo', 'icónico', 'imprescindible', 'revolucionario' o 'auténtico'. Describes la prenda: " +
    "tejido, confección, estado real y cómo se lleva. Si algo está gastado, se dice. " +
    "Devuelves un solo párrafo de 45 a 70 palabras, sin titular, sin comillas y sin listas.";

  function generarConClaude(p, clave) {
    var ficha = [
      "Prenda: camiseta de fútbol",
      "Categoría: " + (p.tipo || "—"),
      "Nombre: " + (p.nombre || "sin nombre"),
      "Detalle: " + (p.subtitulo || "—"),
      "Estado: " + (p.estado || "—"),
      "Procedencia: " + (p.historia || "—"),
      "Tallas disponibles: " +
        ((p.tallas || [])
          .filter(function (t) { return t.stock > 0; })
          .map(function (t) { return t.talla; })
          .join(", ") || "—")
    ].join("\n");

    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": clave,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: SISTEMA,
        messages: [
          {
            role: "user",
            content: "Escribe la ficha de esta pieza:\n\n" + ficha
          }
        ]
      })
    })
      .then(function (r) {
        return r.json().then(function (datos) {
          if (!r.ok) {
            var msg = (datos && datos.error && datos.error.message) || ("HTTP " + r.status);
            throw new Error(msg);
          }
          return datos;
        });
      })
      .then(function (datos) {
        if (datos.stop_reason === "refusal") {
          throw new Error("El modelo ha declinado escribir esta ficha.");
        }
        var texto = (datos.content || [])
          .filter(function (b) { return b.type === "text"; })
          .map(function (b) { return b.text; })
          .join("")
          .trim();
        if (!texto) throw new Error("Respuesta vacía del modelo.");
        return texto;
      });
  }

  /* ---------- API pública -------------------------------------- */

  M93.ia = {
    /* Devuelve { texto, motor } */
    generar: function (p) {
      var cfg = (M93.store && M93.store.config()) || {};
      var clave = (cfg.apiKey || "").trim();
      if (!clave) {
        return Promise.resolve({ texto: generarLocal(p), motor: "local" });
      }
      return generarConClaude(p, clave)
        .then(function (texto) { return { texto: texto, motor: "claude" }; })
        .catch(function (e) {
          console.warn("[ia] Claude falló, uso el motor local:", e);
          return {
            texto: generarLocal(p),
            motor: "local",
            aviso: "No se pudo usar Claude (" + e.message + "). Ficha escrita con el motor local."
          };
        });
    },
    generarLocal: generarLocal
  };
})();
