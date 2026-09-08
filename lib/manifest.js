/* =============================================================
   MINUTO 93 — datos de la marca y catálogo semilla
   Este archivo es el ÚNICO sitio donde tocar el catálogo "de fábrica".
   Lo que añadas desde el modo admin se guarda en el navegador
   (localStorage + IndexedDB) y manda sobre esto.
   ============================================================= */
(function () {
  "use strict";

  window.__BRAND__ = {
    nombre: "MINUTO 93",
    lema: "Camisetas de fútbol con biografía",
    ciudad: "Barcelona",
    email: "hola@minuto93.com",
    instagram: "@minuto93",
    whatsapp: "+34600000000",

    /* Categorías del archivo. La clave es lo que se guarda en cada
       pieza (campo "tipo") y la etiqueta es lo que se ve en la web. */
    categorias: [
      { clave: "local", etiqueta: "Local" },
      { clave: "visitante", etiqueta: "Visitante" },
      { clave: "portero", etiqueta: "Portero" },
      { clave: "entreno", etiqueta: "Entreno" }
    ],

    /* Guía de tallas. Es la misma para todas las camisetas; lo que
       cambia de una pieza a otra se escribe en su campo "notaTalla". */
    guia: {
      titulo: "Tallaje · pecho × largo",
      nota: "Medidas de la prenda en plano, no del cuerpo. El pecho se mide de costura a costura por debajo de la manga y el largo desde el hombro.",
      filas: [
        { talla: "S", cm: "48 × 68 cm" },
        { talla: "M", cm: "52 × 71 cm" },
        { talla: "L", cm: "55 × 74 cm" },
        { talla: "XL", cm: "58 × 77 cm" },
        { talla: "XXL", cm: "61 × 80 cm" }
      ]
    },

    /* Catálogo semilla ------------------------------------------
       tipo:    clave de una de las categorías de arriba
       tallas:  [{ talla, stock }]   stock 0 = agotada (se muestra tachada)
       fotos:   rutas relativas; la primera es la principal
    ------------------------------------------------------------- */
    productos: [
      {
        id: "m93-001",
        tipo: "local",
        nombre: "Roja de local",
        subtitulo: "Temporada 98/99",
        precio: 85,
        estado: "Usada · 9/10",
        minuto: "Minuto 45+2",
        historia: "Del vestuario de un filial del Vallès. La lavaron tantas veces que el escudo se quedó mate, y le sienta bien.",
        descripcion: "Poliéster de los que respiraban poco y aguantaban todo. Rojo profundo, cuello de pico reforzado y escudo bordado punto a punto, no estampado. Ni una rotura, ni un tirón: la prenda de un suplente que jugó poco y la cuidó mucho.",
        fotos: ["assets/img/p-camiseta-c.webp", "assets/img/p-retro-1.webp"],
        tallas: [
          { talla: "S", stock: 0 }, { talla: "M", stock: 1 },
          { talla: "L", stock: 1 }, { talla: "XL", stock: 1 }
        ],
        notaTalla: "Corte de época: más ancha de pecho y más corta de largo que una camiseta actual."
      },
      {
        id: "m93-002",
        tipo: "visitante",
        nombre: "Visitante amarilla",
        subtitulo: "Temporada 02/03",
        precio: 70,
        estado: "Usada · 8/10",
        minuto: "Minuto 63",
        historia: "Apareció en un mercadillo de Sants, doblada dentro de una bolsa de plástico con el ticket de 2003 dentro.",
        descripcion: "Amarillo de bengala, sin dorsal y sin patrocinador en la espalda. Malla perforada con el brillo justo que se apaga con el uso y aquí sigue intacto. Escudo bordado, cuello con ribete verde y costuras laterales sin ceder. Se lleva sola con vaqueros oscuros y sin más explicación.",
        fotos: ["assets/img/p-kit-1.webp"],
        tallas: [
          { talla: "M", stock: 1 }, { talla: "L", stock: 2 }, { talla: "XL", stock: 0 }
        ],
        notaTalla: "Talla como una camiseta actual. Si la quieres holgada, sube una."
      },
      {
        id: "m93-003",
        tipo: "local",
        nombre: "Granate y azul",
        subtitulo: "Temporada 06/07",
        precio: 110,
        estado: "Nueva con etiqueta",
        minuto: "Minuto 90",
        historia: "Stock muerto de una tienda de deportes que cerró en 2011. Cincuenta unidades sin abrir. Nos quedan tres.",
        descripcion: "Tejido pesado, del que cae recto y no se pega al cuerpo. Franja granate sobre azul, escudo aplicado en fieltro cosido y cuello reforzado por dentro. Al ser stock antiguo conserva la etiqueta de cartón y el olor a tienda cerrada. La prenda más nueva del archivo y, a la vez, la más vieja.",
        fotos: ["assets/img/p-camiseta-a.webp", "assets/img/p-retro-1.webp"],
        tallas: [
          { talla: "S", stock: 1 }, { talla: "M", stock: 1 }, { talla: "L", stock: 1 }
        ],
        notaTalla: "Algodón mezclado: puede encoger un dedo de largo en el primer lavado. Agua fría."
      },
      {
        id: "m93-004",
        tipo: "portero",
        nombre: "Portero verde",
        subtitulo: "Manga larga · 96/97",
        precio: 95,
        estado: "Usada · 8/10",
        minuto: "Minuto 93",
        historia: "La camiseta con la que empezó todo esto. Estuvo colgada dos años en casa antes de que existiera la tienda.",
        descripcion: "Verde botella con las cuñas negras en hombros y costados, codos reforzados sin abrir y puño elástico que todavía aprieta. Manga larga y cuello de pico con refuerzo interior. Tiene una marca de hierba en la cadera derecha que no quisimos quitar: es la prueba de que sirvió para algo.",
        fotos: ["assets/img/p-portero-1.webp"],
        tallas: [
          { talla: "M", stock: 1 }, { talla: "L", stock: 1 }, { talla: "XL", stock: 1 }
        ],
        notaTalla: "Camiseta de portero: una talla más ancha de lo normal, a propósito."
      },
      {
        id: "m93-005",
        tipo: "visitante",
        nombre: "Blanca de visitante",
        subtitulo: "Temporada 07/08",
        precio: 90,
        estado: "Usada · 9/10",
        minuto: "Minuto 71",
        historia: "Se la compramos a un utillero jubilado que guardaba tres cajas en el garaje. Ésta era la única de su talla.",
        descripcion: "Blanca con las tres líneas rojas en el hombro y el cuello redondo con ribete a juego. Tejido técnico ligero, todavía tieso, sin amarilleos en las axilas ni bolas en los costados. El escudo lleva el año bordado debajo. Una camiseta que se ensucia con mirarla y que aun así llegó entera hasta aquí.",
        fotos: ["assets/img/p-camiseta-b.webp", "assets/img/p-retro-1.webp"],
        tallas: [
          { talla: "S", stock: 1 }, { talla: "M", stock: 1 },
          { talla: "L", stock: 0 }, { talla: "XL", stock: 1 }
        ],
        notaTalla: "Corte entallado. Si estás entre dos tallas, coge la mayor."
      }
    ],

    /* Peticiones de ejemplo del buzón (el admin puede borrarlas) */
    peticiones: [
      { id: "q-1", nombre: "Nil", tipo: "portero", pieza: "Cualquier camiseta de portero de los 90 con manga larga.", talla: "L", contacto: "", fecha: "2026-08-21", publica: true },
      { id: "q-2", nombre: "Marta", tipo: "visitante", pieza: "Una segunda equipación azul marino, mejor si es sin patrocinador.", talla: "M", contacto: "", fecha: "2026-08-29", publica: true },
      { id: "q-3", nombre: "Edu", tipo: "local", pieza: "Camiseta a rayas de los 90, talla L, con dorsal cosido.", talla: "L", contacto: "", fecha: "2026-09-02", publica: true }
    ]
  };
})();
