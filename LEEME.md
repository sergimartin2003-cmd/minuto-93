# MINUTO 93 — tu tienda

Web estática de camisetas de fútbol de segunda mano. Sin carrito: cada pieza
tiene ficha, fotos, vista 3D, sus medidas y un botón para pedirla por email o
WhatsApp.

Carpeta: `C:\Users\sergi\minuto93`

---

## 1. Cómo verla

**Opción A — servidor local (recomendada).** En una terminal:

```bash
cd C:\Users\sergi\minuto93 && python -m http.server 8765
```

Y abre `http://localhost:8765`.

**Opción B — doble clic en `index.html`.** Funciona todo menos una cosa: el
relieve del modelo 3D. Al abrir un archivo con `file://` el navegador no deja
leer los píxeles de las fotos que están en el disco, así que la vista 3D muestra
el volumen sin relieve y lo avisa por escrito. Las fotos que subas tú desde el
modo admin **sí** generan relieve completo también con doble clic.

---

## 2. Subirla a internet

El proyecto está en GitHub: <https://github.com/sergimartin2003-cmd/minuto-93>

### Vercel (lo más cómodo)

1. Entra en <https://vercel.com/new> con tu cuenta de GitHub.
2. Elige el repositorio **minuto-93** → *Import*.
3. En *Framework Preset* deja **Other**. No toques *Build Command* ni
   *Output Directory*: no hay nada que compilar.
4. *Deploy*. En menos de un minuto tienes la URL.

A partir de ahí, **cada `git push` publica sola la versión nueva**. Para un
dominio propio: *Settings → Domains* en el proyecto de Vercel.

La configuración ya está puesta en `vercel.json`: cabeceras de seguridad, un día
de caché para las fotos y revalidación en cada visita para el HTML, el CSS y el
JS (así nunca se queda pillada una versión vieja al actualizar). El archivo
`.vercelignore` evita subir las fotos originales sin comprimir, que no hacen
falta en el hosting.

### Hostinger u otro alojamiento clásico

Arrastra **todo el contenido de la carpeta** (incluido el archivo oculto
`.htaccess`) a `public_html`. No hay que instalar ni compilar nada.

Ahí sí hace falta el truco de la caché: cada vez que cambies `styles.css`,
`main.js` o algo de `lib/`, sube el archivo y cambia la fecha del final de las
etiquetas del `index.html` (`?v=20260908` → `?v=20260910`). Eso obliga al
navegador a coger la versión nueva. En Vercel esto no es necesario —lo hace
solo— pero dejarlo puesto no molesta.

> `.htaccess` sólo lo entienden Apache y LiteSpeed (Hostinger). En Vercel se
> ignora: su equivalente es `vercel.json`. En GitHub Pages no hay equivalente.

---

## 3. Modo admin

**Cómo entrar:** botón «Modo admin» en el pie de la web, o `Ctrl + Shift + A`.

**Contraseña inicial: `minuto93`.** Cámbiala en cuanto entres, en la pestaña
*Ajustes*. Es una barrera para que nadie toque el catálogo por accidente desde
tu ordenador; no es una caja fuerte: al ser una web sin servidor, todo pasa en
el navegador.

### ⚠️ Si la web es pública (y el código está en GitHub)

Cambiar la contraseña en *Ajustes* la cambia **sólo en tu navegador**. Cualquiera
que abra la web desde el suyo sigue entrando con la de fábrica, que además está
escrita en `lib/admin.js` y se lee en el repositorio.

Qué puede hacer un desconocido que entre: ver el panel y trastear **su propia
copia** del catálogo, guardada en su navegador. Lo que no puede hacer: cambiar
lo que ve nadie más, ni tocar nada de tu ordenador ni del servidor — no hay
servidor que tocar.

Aun así, para cerrar la puerta de verdad hay que cambiar la constante
`CLAVE_POR_DEFECTO` de `lib/admin.js` (o dejar ahí el hash de tu contraseña) y
volver a subir el archivo. Dímelo y te lo dejo puesto.

Dentro tienes tres pestañas:

- **Piezas** — añadir, editar y borrar. Nombre y precio son obligatorios, y hace
  falta al menos una foto (la ficha y el 3D la necesitan). Cada pieza va en una
  categoría (local, visitante, portero, entreno): los filtros de la web se
  construyen solos con las categorías que tengan piezas. Las tallas se ponen con
  los botones `+ M`, `+ L`, etc., y a cada una le indicas cuántas unidades
  tienes. Talla con 0 unidades sale tachada en la ficha, no desaparece: así el
  cliente ve que existía.
- **Buzón** — todo lo que la gente pide desde la web. Puedes responder por
  email, publicar la petición en el muro público o borrarla.
- **Ajustes** — contraseña, redacción con IA, exportar/importar catálogo.

### ⚠️ Dónde se guardan las piezas que añades

En **este navegador y este ordenador** (localStorage para los datos, IndexedDB
para las fotos). No viajan solas a la web publicada. Por eso:

- **Exporta** el catálogo desde *Ajustes* → se descarga un `.json` con todo,
  fotos incluidas. Es tu copia de seguridad.
- **Importa** ese `.json` en otro navegador u ordenador para tenerlo allí.
- Si quieres que unas piezas vengan de fábrica en la web (que las vea cualquiera
  que entre, sin importar nada), hay que escribirlas en `lib/manifest.js`. Pásame
  el `.json` exportado y te lo dejo fijo ahí.

---

## 4. Las descripciones «con IA»

Hay dos motores y el botón es el mismo:

1. **Local (por defecto).** Va incluido en `lib/ia.js`. Escribe la ficha
   combinando los datos de la pieza (tipo, material que deduce del nombre, año,
   estado, tallas) con un banco de frases escrito en la voz de la tienda. No
   necesita internet, no cuesta nada y cada pulsación da un texto distinto.
2. **Claude (opcional).** Si pegas una API key de Anthropic en *Ajustes*, la
   ficha la escribe el modelo `claude-opus-5` con el tono de la marca. Ojo: la
   clave se guarda en tu navegador, así que úsala sólo en tu ordenador y nunca en
   uno compartido. Si la llamada falla, cae solo al motor local y te avisa.

Las fichas se pueden editar a mano siempre: lo que escribe la IA es un borrador.

---

## 5. La vista 3D

El botón «Ver en 3D» de cada ficha **no** es un vídeo ni un truco de CSS: coge la
foto, la analiza píxel a píxel y construye una malla real de miles de vértices
que se gira con el dedo o el ratón.

- Separa la pieza del fondo comparando cada píxel con el color de los bordes de
  la foto, levanta esa silueta y le añade micro-relieve según la luz de la imagen.
- Si la foto no permite separar la pieza (fondo del mismo color que el producto),
  cambia solo a un relieve por luminancia, y lo dice debajo del visor.
- Funciona mejor con **fotos de producto sobre fondo liso**. Es el mismo consejo
  que para vender: fondo neutro, luz plana, pieza centrada.

Cambiando de miniatura mientras estás en 3D, se reconstruye el modelo con esa
otra foto.

---

## 6. Cambiar textos, contacto y colores

- **Email, WhatsApp, ciudad, tallajes generales y catálogo de fábrica:**
  `lib/manifest.js`. Está comentado y es el único sitio con datos.
- **Textos de la web** (manifiesto, storytelling, secciones): `index.html`.
- **Colores y tipografía:** al principio de `styles.css`, en el bloque
  `:root`. La paleta es papel `#f1f0ec`, tinta `#0b0b0b` y un solo acento lima
  `#ddff2e`. Si cambias el lima, cambia toda la web de golpe.

---

## 7. Las fotos de ejemplo

Las piezas del catálogo de muestra usan fotos de **Openverse** con licencia
Creative Commons. La atribución de cada una está en `assets/credits.json` y hay
un enlace en el pie de la web.

**Sustitúyelas por tus fotos reales antes de vender.** Es lo normal: tus piezas
son únicas, esas fotos no son tuyas y algunas licencias obligan a citar al autor.
Cuando subas tus fotos desde el modo admin, esos créditos dejan de aplicar a las
piezas nuevas.

---

## 8. Qué hay en cada archivo

```
index.html          La web entera (una sola página)
vercel.json         Configuración para desplegar en Vercel
.vercelignore       Lo que no hace falta subir a Vercel
styles.css          Todo el diseño
main.js             Arranque: monta el archivo, el tallaje, el buzón y los efectos
lib/manifest.js     TUS DATOS: marca, contacto, tallajes y catálogo de fábrica
lib/store.js        Guardado en el navegador (localStorage + IndexedDB)
lib/ia.js           Redactor de fichas (local + Claude opcional)
lib/vista3d.js      Generación del modelo 3D desde la foto
lib/ficha.js        La ficha de producto
lib/admin.js        El panel de administración
lib/gsap*.js        Animaciones (librería)
lib/three.min.js    Motor 3D (librería)
assets/img/         Fotos optimizadas en WebP
assets/photos/source/  Fotos originales sin comprimir (no hace falta subirlas)
assets/credits.json Créditos de las fotos de ejemplo
.htaccess           Evita que el hosting sirva versiones viejas al actualizar
```

---

## 9. Cosas que quizá quieras después

- Que el buzón te llegue al correo automáticamente (ahora se guarda en el
  navegador y respondes desde el panel).
- Que el catálogo sea el mismo para todos los visitantes sin exportar/importar
  a mano: eso ya pide una base de datos y deja de ser una web estática.
- Página de aviso legal y política de privacidad si vas a vender de forma
  habitual.

Dímelo y lo montamos.
