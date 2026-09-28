/* ================= CONFIGURACIÓN (lo único que normalmente cambiarás) ================= */

// Enlace de tu hoja publicada en la web
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOBR6L2JMsHg_G9RMg6S4j3ObLRobVm8_sI2NrqkqcU54X9SJgUILwYfnbIxzyWoNXAlM0Zi22q0xp/pubhtml?gid=0&single=true";
// Símbolo que se antepone a los precios
const MONEDA = "$";
// Valores de la columna "Web" que se muestran (en minúsculas). Agrega "faltan fotos" si quieres verlos
const ESTADOS_VISIBLES = ["mostrar"];
// true = muestra el precio mayorista, false = lo oculta
const MOSTRAR_MAYORISTA = true;

/* ================= PREPARACIÓN ================= */

// Busca el número de hoja (gid) dentro del enlace; si no lo encuentra usa "0"
const gid = (SHEET_URL.match(/gid=(\d+)/) || [0, "0"])[1];
// Convierte el enlace "pubhtml" en el enlace que descarga la hoja como CSV
const CSV_URL = SHEET_URL.replace(/pubhtml.*$/, `pub?gid=${gid}&single=true&output=csv`);
// Atajo para buscar elementos del HTML por su id
const $ = id => document.getElementById(id);
// Aquí se guardará la lista de productos ya procesada
let products = [];

/* ================= LECTURA DEL CSV ================= */

// Convierte el texto CSV en una tabla (lista de filas, cada fila es una lista de celdas)
function parseCSV(text){
    const rows = [];            // todas las filas
    let row = [], cell = "";    // fila actual y celda actual
    let q = false;              // ¿estamos dentro de comillas?
    for (let i = 0; i < text.length; i++){
        const c = text[i];        // carácter actual
        if (q){                   // dentro de comillas...
            if (c === '"' && text[i+1] === '"'){ cell += '"'; i++; }  // "" = una comilla escrita
            else if (c === '"') q = false;                            // cierra las comillas
            else cell += c;                                           // texto normal (puede incluir comas)
        } else if (c === '"') q = true;                             // abre comillas
        else if (c === ",") { row.push(cell); cell = ""; }          // coma = termina la celda
        else if (c === "\n" || c === "\r"){                         // salto de línea = termina la fila
        if (c === "\r" && text[i+1] === "\n") i++;                // trata "\r\n" como un solo salto
        row.push(cell); rows.push(row); row = []; cell = "";
        } else cell += c;                                           // cualquier otro carácter
    }
    if (cell || row.length){ row.push(cell); rows.push(row); }    // guarda la última fila
    return rows.filter(r => r.some(x => x.trim()));               // descarta filas vacías
}

// Pasa a minúsculas y quita tildes y espacios de los bordes ("Categoría " -> "categoria")
const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
// Igual que norm, pero además quita espacios, puntos, guiones ("P.Mayor" -> "pmayor")
const hn = s => norm(s).replace(/[\s._-]/g, "");

// Nombres de encabezado aceptados para cada dato (ya normalizados con hn)
const ALIAS = {
    web:    ["Web", "web", "paginaweb", "estado"],
    code:   ["id", "codigo", "sku"],
    cat:    ["Categoria", "categoria", "clase"],
    name:   ["Producto", "producto", "nombre"],
    mayor:  ["P.Mayor", "pmayor", "preciomayor", "mayorista"],
    menor:  ["P.Menor", "pmenor", "preciomenor", "minorista", "precio"],
    promo:  ["Promocion", "promocion", "promo"],
    colors: ["Colores", "colores", "color"],
    desc:   ["Descripcion", "descripcion", "detalle"],
    medida: ["TipoMedida", "tipomedida", "tipodemedida", "medida"],
    sizes:  ["Talles", "talles", "talle", "medidas"],
    img:    ["Imagen", "imagen", "foto", "fotos", "img", "urlimagen", "linkimagen"]
};

// Convierte "Rojo, Azul; Negro" en ["Rojo","Azul","Negro"] (separa por coma , ; o |)
const toList = s => s.split(/[,;|]/).map(x => x.trim()).filter(Boolean);

// Convierte la tabla del CSV en una lista de productos
function build(rows){

    const head = rows[0].map(hn);

    console.log("ENCABEZADOS:", head);

    const idx = {};

    for (const k in ALIAS) {
        idx[k] = head.findIndex(h => ALIAS[k].includes(h));
    }

    console.log("INDICES:", idx);
    console.log("PRIMERA FILA:", rows[1]);

    const resultado = rows.slice(1).map(r => {

        const g = k => idx[k] >= 0 ? (r[idx[k]] || "").trim() : "";

        const producto = {
            web: g("web"), 
            code: g("code"), 
            cat: g("cat"), 
            name: g("name"),
            mayor: g("mayor"), 
            menor: g("menor"), 
            promo: g("promo"),
            colors: toList(g("colors")), 
            desc: g("desc"), 
            medida: g("medida"),
            sizes: toList(g("sizes")), 
            img: g("img")
        };

        console.log("PRODUCTO CREADO:", producto);

        return producto;

    });

    console.log("ANTES DEL FILTRO:", resultado);
    console.log("CANTIDAD ANTES DEL FILTRO:", resultado.length);

    const filtrados = resultado.filter(p => {

        const tieneNombre = !!p.name;

        const estadoVisible =
            idx.web < 0 ||
            ESTADOS_VISIBLES.includes(norm(p.web));

        console.log(
            "Producto:",
            p.name,
            "| name:",
            tieneNombre,
            "| web:",
            p.web,
            "| visible:",
            estadoVisible
        );

        return tieneNombre && estadoVisible;
    });

    console.log("DESPUÉS DEL FILTRO:", filtrados);
    console.log("CANTIDAD FINAL:", filtrados.length);

    return filtrados;
}
/* ================= FORMATO Y DIBUJO ================= */

// Da formato al precio: "15000" -> "$15.000". Si no es un número, lo muestra tal cual
function fmt(p){
    if (!p) return "";
    const n = Number(p.replace(/[^\d.,-]/g, "")          // deja solo números, puntos y comas
                      .replace(/\.(?=\d{3}\b)/g, "")     // quita puntos de miles ("15.000" -> "15000")
                      .replace(",", "."));               // coma decimal -> punto decimal
    return isNaN(n) ? p : MONEDA + n.toLocaleString("es-AR");
}

// Escapa caracteres especiales para que el texto de la hoja no rompa el HTML (seguridad)
const esc = s => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// Crea el bloque "Etiqueta: chip chip chip" (colores, talles). Si la lista está vacía no dibuja nada
const chips = (label, arr) => arr.length
    ? `<div class="opts"><b>${esc(label)}:</b>${arr.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>`
    : "";

// Dibuja las tarjetas según el buscador y los filtros
function render(){
    const q = norm($("q").value);    // texto del buscador
    const c = $("cat").value;        // categoría elegida
    const pr = $("promo").value;     // promoción elegida
    // Se queda con los productos que cumplen categoría, promoción y búsqueda
    const list = products.filter(p =>
        (!c || p.cat === c) && (!pr || p.promo === pr) &&
        (!q || norm(`${p.name} ${p.desc} ${p.code}`).includes(q)));
    // Convierte cada producto en HTML y lo inserta en la grilla
    $("grid").innerHTML = list.map(p => {
      const pk = norm(p.promo);      // promoción normalizada, se usa para el color de la etiqueta
        return `
        <article class="card ${pk === "agotado" ? "out" : ""}">
            ${p.promo ? `<span class="tag t-${esc(pk)}">${esc(p.promo)}</span>` : ""}
            ${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML='<div class=noimg>Sin imagen</div>'">`
                    : `<div class="noimg">Sin imagen</div>`}
            <div class="body">
                ${p.cat ? `<span class="cat">${esc(p.cat)}</span>` : ""}
                <span class="name">${esc(p.name)}</span>
                ${p.code ? `<span class="code">Cód: ${esc(p.code)}</span>` : ""}
                ${p.desc ? `<span class="desc">${esc(p.desc)}</span>` : ""}
                ${chips("Colores", p.colors)}
                ${chips(p.medida || "Medidas", p.sizes)}
                <div class="prices">
                ${p.menor ? `<span class="menor">${esc(fmt(p.menor))}</span>` : ""}
                ${MOSTRAR_MAYORISTA && p.mayor ? `<span class="mayor">Mayorista: ${esc(fmt(p.mayor))}</span>` : ""}
                </div>
            </div>
        </article>`;
    }).join("");
    // Si no hay resultados muestra un aviso; si hay, borra el mensaje
    $("msg").textContent = list.length ? "" : "No se encontraron productos.";
}

// Llena un desplegable (categorías o promociones) con los valores únicos y ordenados
function fillSelect(id, key){
    [...new Set(products.map(p => p[key]).filter(Boolean))].sort().forEach(v => {
    const o = document.createElement("option");   // crea una opción
    o.value = o.textContent = v;                  // valor y texto visible
    $(id).appendChild(o);                         // la agrega al desplegable
    });
}

/* ================= INICIO ================= */

// Descarga la hoja, la procesa y dibuja la página
async function init(){
  try{
    const res = await fetch(CSV_URL);                  // pide el CSV a Google
    if (!res.ok) throw new Error(res.status);          // si falla, salta al catch
    products = build(parseCSV(await res.text()));      // texto -> tabla -> productos
    fillSelect("cat", "cat");                          // llena el filtro de categorías
    fillSelect("promo", "promo");                      // llena el filtro de promociones
    render();                                          // dibuja las tarjetas
  }catch(e){
    $("msg").textContent = "No se pudieron cargar los productos. Revisa que la hoja esté publicada en la web.";
    console.error(e);                                  // detalle del error en la consola del navegador
  }
}

// Cada vez que escribes o cambias un filtro, se vuelven a dibujar las tarjetas
["input", "change"].forEach(ev => {
  $("q").addEventListener(ev, render);
  $("cat").addEventListener(ev, render);
  $("promo").addEventListener(ev, render);
});

init();   // arranca todo al abrir la página

[
    {
        web: "", // 
        codigo: "", // 
        categoria: "", // 
        producto: "", // 
        pmayor: 123, // Numero o texto si el resultado es "null" o "0"
        pmenor: 123, // Numero o texto si el resultado es "null" o "0"
        promocion: "", // 
        colores: [""], // Si el valor es "null" se coloca null
        descripcion: "", // 
        tipomedida: "", // Si el valor es "null" se coloca null
        medidas: [""], // Si el valor es "null" se coloca null
        img: "", // 
    }
]