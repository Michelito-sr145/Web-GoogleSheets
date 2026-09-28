//* ================= CONFIGURACIÓN ================= */
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOBR6L2JMsHg_G9RMg6S4j3ObLRobVm8_sI2NrqkqcU54X9SJgUILwYfnbIxzyWoNXAlM0Zi22q0xp/pubhtml?gid=0&single=true";
// Aquí se almacenarán todos los productos
let ListaProductos = [];
//* ================= PREPARACIÓN ================= */
// Obtiene el gid de la hoja
const gid = (SHEET_URL.match(/gid=(\d+)/) || [0, "0"])[1];
// Convierte el enlace de Google Sheets en CSV
const CSV_URL = SHEET_URL.replace(
    /pubhtml.*$/,
    `pub?gid=${gid}&single=true&output=csv`
);
//* ================= CSV ================= */
// Convierte el CSV en un Array de filas
function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let dentroComillas = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (dentroComillas) {
            if (c === '"' && text[i + 1] === '"') {
                cell += '"';
                i++;
            }
            else if (c === '"') {
                dentroComillas = false;
            }
            else {
                cell += c;
            }
        } 
        else {
            if (c === '"') {
                dentroComillas = true;
            }
            else if (c === ",") {
                row.push(cell);
                cell = "";
            }
            else if (c === "\n" || c === "\r") {
                if (c === "\r" && text[i + 1] === "\n") {
                    i++;
                }
                row.push(cell);
                rows.push(row);
                row = [];
                cell = "";
            }
            else {
                cell += c;
            }
        }
    }
    // Última celda/fila
    if (cell || row.length) {
        row.push(cell);
        rows.push(row);
    }
    // Elimina filas completamente vacías
    return rows.filter(row =>
        row.some(celda => celda.trim() !== "")
    );
}

//* ================= FORMATO DE DATOS ================= */
// Convierte un precio argentino:
// "$2.500,00" → 2500
// "2500"      → 2500
// "null"      → "null"
// "0"         → "0"
function convertirPrecio(valor) {
    valor = valor.trim();
    if (valor === "null" || valor === "0" || valor === "") {
        return valor || "null";
    }
    const numero = Number(
        valor
            .replace(/[^\d.,-]/g, "")
            .replace(/\.(?=\d{3}\b)/g, "")
            .replace(",", ".")
    );
    return isNaN(numero) ? valor : numero;
}

// Convierte:
// "Rojo, Azul, Negro" → ["Rojo", "Azul", "Negro"]
// "null"              → null
function convertirLista(valor) {
    valor = valor.trim();
    if (valor === "null" || valor === "") {
        return null;
    }
    return valor
        .split(/[,;|]/)
        .map(x => x.trim())
        .filter(Boolean);
}

//* ================= CREAR LISTA ================= */
function crearListaProductos(rows) {
    // La primera fila contiene los encabezados
    const encabezados = rows[0];
    console.log("Encabezados:", encabezados);
    // Todas las filas después de los encabezados
    return rows.slice(1)
        // Ignora filas que no tengan producto
        .filter(fila => fila[3] && fila[3].trim() !== "")
        .map(fila => {
            return {
                web: fila[0]?.trim() || "",
                codigo: fila[1]?.trim() || "",
                categoria: fila[2]?.trim() || "",
                producto: fila[3]?.trim() || "",
                pmayor: convertirPrecio(fila[4] || ""),
                pmenor: convertirPrecio(fila[5] || ""),
                promocion: fila[6]?.trim() || "",
                colores: convertirLista(fila[7] || ""),
                descripcion: fila[8]?.trim() === "null" ? null : fila[8]?.trim() || "",
                tipomedida: fila[9]?.trim() === "null" ? null : fila[9]?.trim() || "",
                medidas: convertirLista(fila[10] || ""),
                img: fila[11]?.trim() === "null" ? "null" : fila[11]?.trim() || ""};
        });
}

//* ================= CARGAR PRODUCTOS ================= */
async function cargarProductos() {
    try {
        const respuesta = await fetch(CSV_URL);
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        const csv = await respuesta.text();
        const filas = parseCSV(csv);
        ListaProductos = crearListaProductos(filas);
        console.log("ListaProductos:", ListaProductos);
        console.log("Cantidad de productos:", ListaProductos.length);
    }
    catch (error) {
        console.error(
            "Lo sentimos no se pudieron cargar los productos:",
            error
        );
    }
}
//* ================= INICIO ================= */
cargarProductos();