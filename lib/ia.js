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

  var MATERIAL = {
    piel: [
      "Piel gruesa, de poro visible, con la pátina que sólo dan los años en un armario.",
      "Piel de verdad: pesa, huele y se marca con el uso, como se supone que debe hacerlo.",
      "El cuero ha cogido temperatura con el tiempo y ya no vuelve a ser plano."
    ],
    lona: [
      "Lona reblandecida por el uso, de las que se doblan solas por donde toca.",
      "Algodón encerado que ha perdido rigidez y ha ganado carácter.",
      "Lona con la trama abierta por el lavado, sin un solo roto."
    ],
    malla: [
      "Malla técnica que respira y deja ver la costura interior, sin amarilleos.",
      "Tejido de malla ligero, con refuerzos laterales que aguantan el pie en su sitio.",
      "Malla fina sobre base sintética, esa mezcla que ahora imitan todas."
    ],
    algodon: [
      "Algodón peinado, pesado, del que cae recto y no se pega al cuerpo.",
      "Punto de algodón denso, con el cuerpo que tenían las prendas antes de adelgazar el gramaje.",
      "Algodón grueso, mate, sin brillos raros ni tacto de plástico."
    ],
    poliester: [
      "Poliéster de los que respiraban poco y aguantaban todo.",
      "Tejido sintético de época, con ese brillo justo que se apaga con el uso.",
      "Poliéster ligero de trama abierta, pensado para noventa minutos de calor."
    ],
    generico: [
      "Materiales de otra época, elegidos cuando la ropa se hacía para durar.",
      "Fabricación cuidada, de las que se notan al cogerla con la mano.",
      "Confección de cuando el detalle no era una opción de catálogo."
    ]
  };

  var DETALLE_ZAPAS = [
    "La suela conserva el dibujo completo y la entresuela responde firme al apretarla.",
    "Los ojales están enteros, los cordones son los originales y el forro interior no tiene hundimientos.",
    "El desgaste del talón es simétrico, señal de pisada neutra y de un dueño que las cuidó.",
    "Costuras revisadas una a una: ni una suelta, ni un pespunte fuera de sitio.",
    "La puntera aguanta sin arrugas profundas y el cambrillón sigue haciendo su trabajo."
  ];

  var DETALLE_CAMISETA = [
    "Escudo bordado punto a punto, no estampado: se nota al pasar el dedo.",
    "Costuras laterales sin ceder y cuello con el canalé todavía firme.",
    "Los números y el ribete están íntegros, sin cuarteos ni despegados.",
    "Sin bolas en las axilas ni transparencias por lavado: se ha usado con cabeza.",
    "El corte de época se nota: más ancho de pecho y más corto de largo que lo de hoy."
  ];

  var ESTADO = {
    nueva: [
      "Sale de la caja como entró y no ha pisado la calle.",
      "Stock antiguo sin estrenar: la prenda más nueva del archivo y, a la vez, la más vieja.",
      "Nunca se ha puesto. Conserva etiqueta y ese olor a tienda cerrada."
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

  var CIERRE_ZAPAS = [
    "Un par para llevar a diario, no para guardar en una vitrina.",
    "Combinan con lo que ya tienes y no piden permiso.",
    "Van con vaquero ancho y con pantalón de vestir, sin cambiar de idea.",
    "De las que mejoran cuando llevas seis meses poniéndotelas."
  ];

  var CIERRE_CAMISETA = [
    "Se lleva sola, con vaqueros oscuros y sin más explicación.",
    "Vale para el campo y para la calle, que es donde acaba pasando la mayor parte del tiempo.",
    "Una prenda para llevar puesta, no para enmarcar.",
    "Suficientemente sobria para el día a día y suficientemente rara para que te pregunten."
  ];

  function materialDe(p) {
    var texto = [p.nombre, p.subtitulo, p.historia].join(" ");
    if (contiene(texto, ["piel", "cuero", "ante", "napa", "canguro"])) return MATERIAL.piel;
    if (contiene(texto, ["lona", "canvas"])) return MATERIAL.lona;
    if (contiene(texto, ["malla", "mesh", "runner", "técnic"])) return MATERIAL.malla;
    if (p.tipo === "camiseta" && contiene(texto, ["algodón", "algodon", "retro", "reedición", "reedicion", "89", "80"])) return MATERIAL.algodon;
    if (p.tipo === "camiseta") return MATERIAL.poliester;
    return MATERIAL.generico;
  }

  function estadoDe(p) {
    var e = (p.estado || "").toLowerCase();
    if (contiene(e, ["nueva", "sin estrenar", "etiqueta", "deadstock"])) return ESTADO.nueva;
    if (contiene(e, ["9/10", "10/10", "excelente"])) return ESTADO.buena;
    return ESTADO.usada;
  }

  /* Genera una ficha nueva, distinta cada vez que se pulsa */
  function generarLocal(p) {
    var esZapa = p.tipo !== "camiseta";
    var epoca = "";
    var anos = (p.subtitulo || "").match(/\b(19|20)\d{2}\b|\b\d{2}\/\d{2}\b/);
    if (anos) {
      epoca = elegir("epoca", [
        "De " + anos[0] + ", y se nota en cada acabado.",
        "Fechada en " + anos[0] + ": el detalle está en la construcción, no en el logo.",
        "Pieza de " + anos[0] + ", con todo lo que eso implica."
      ]);
    }

    return unir([
      elegir("material", materialDe(p)),
      epoca,
      elegir("detalle", esZapa ? DETALLE_ZAPAS : DETALLE_CAMISETA),
      elegir("estado", estadoDe(p)),
      elegir("cierre", esZapa ? CIERRE_ZAPAS : CIERRE_CAMISETA)
    ]);
  }

  /* ---------- motor Claude (opcional) -------------------------- */

  var SISTEMA =
    "Eres el redactor de MINUTO 93, una tienda de zapatillas y camisetas de fútbol de segunda mano " +
    "con sede en Barcelona. Escribes fichas de producto en español de España, en tercera persona, " +
    "con tono editorial y seco: frases cortas, cero marketing, cero superlativos, cero palabras como " +
    "'exclusivo', 'icónico', 'imprescindible', 'revolucionario' o 'auténtico'. Describes el objeto: " +
    "material, construcción, estado real y cómo se lleva. Si algo está gastado, se dice. " +
    "Devuelves un solo párrafo de 45 a 70 palabras, sin titular, sin comillas y sin listas.";

  function generarConClaude(p, clave) {
    var ficha = [
      "Tipo: " + (p.tipo === "camiseta" ? "camiseta de fútbol" : "zapatillas"),
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
