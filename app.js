import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBM0JO53foSR1RoDtKJ4CJjnNV0b82c9QU",
    authDomain: "inventario-pernocentro.firebaseapp.com",
    projectId: "inventario-pernocentro",
    storageBucket: "inventario-pernocentro.firebasestorage.app",
    messagingSenderId: "266482197520",
    appId: "1:266482197520:web:63afd6d2918b6f947c1695"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USUARIOS = [
    { usuario: "admin", clave: "1234", rol: "Administrador" },
    { usuario: "empleado", clave: "1111", rol: "Empleado" }
];

let usuarioActivo = null;
let productos = [];
let proveedores = [];
let historial = [];

async function iniciarSesion() {
    const usuario = document.getElementById("usuario").value;
    const clave = document.getElementById("clave").value;

    const encontrado = USUARIOS.find(
        u => u.usuario === usuario && u.clave === clave
    );

    if (!encontrado) {
        mostrarMensaje("Usuario o contraseña incorrectos.", "error");
        return;
    }

    usuarioActivo = encontrado;

    document.getElementById("loginPantalla").style.display = "none";
    document.getElementById("sistema").classList.remove("oculto");

    document.getElementById("rolActivo").textContent = encontrado.rol;
    document.getElementById("usuarioActivoTexto").textContent = encontrado.usuario;
    document.getElementById("rolTexto").textContent = encontrado.rol;

    aplicarPermisos();
    await cargarDatos();

    mostrarMensaje("Inicio de sesión correcto.", "correcto");
}

function aplicarPermisos() {
    if (usuarioActivo.rol === "Empleado") {
        document.querySelectorAll(".admin-only").forEach(e => {
            e.style.display = "none";
        });

        document.querySelectorAll(".admin-only-col").forEach(e => {
            e.style.display = "none";
        });
    }
}

function cerrarSesion() {
    location.reload();
}

async function cargarDatos() {
    await cargarProveedores();
    await cargarProductos();
    await cargarHistorial();

    cargarSelectProveedores();
    actualizarDashboard();
}

async function cargarProductos() {
    productos = [];

    const consulta = await getDocs(collection(db, "productos"));

    consulta.forEach(documento => {
        productos.push({
            id: documento.id,
            ...documento.data()
        });
    });

    renderizarProductos(productos);
    renderizarBajoStock();
}

async function cargarProveedores() {
    proveedores = [];

    const consulta = await getDocs(collection(db, "proveedores"));

    consulta.forEach(documento => {
        proveedores.push({
            id: documento.id,
            ...documento.data()
        });
    });

    renderizarProveedores();
}

async function cargarHistorial() {
    historial = [];

    const consulta = await getDocs(collection(db, "historial"));

    consulta.forEach(documento => {
        historial.push({
            id: documento.id,
            ...documento.data()
        });
    });

    historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    renderizarHistorial();
}

function mostrarSeccion(id) {
    document.querySelectorAll(".section").forEach(seccion => {
        seccion.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".nav").forEach(nav => {
        nav.classList.remove("active");
    });

    const secciones = [
        "dashboard",
        "inventario",
        "agregar",
        "bajoStock",
        "proveedores",
        "historial",
        "configuracion"
    ];

    const index = secciones.indexOf(id);
    const botones = document.querySelectorAll(".nav");

    if (index >= 0 && botones[index]) {
        botones[index].classList.add("active");
    }

    actualizarDashboard();
}

function mostrarMensaje(texto, tipo) {
    const mensaje = document.getElementById("mensaje");

    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    mensaje.style.display = "block";

    setTimeout(() => {
        mensaje.style.display = "none";
    }, 2500);
}

function validarProducto(nombre, categoria, cantidad, stockMinimo) {
    if (nombre.trim() === "" || categoria.trim() === "") {
        mostrarMensaje("Los campos principales son obligatorios.", "error");
        return false;
    }

    if (cantidad < 0 || stockMinimo < 0) {
        mostrarMensaje("Las cantidades no pueden ser negativas.", "advertencia");
        return false;
    }

    return true;
}

function obtenerEstado(producto) {
    if (Number(producto.cantidad) === 0) {
        return "Agotado";
    }

    if (Number(producto.cantidad) <= Number(producto.stockMinimo)) {
        return "Bajo stock";
    }

    return "Disponible";
}

function obtenerPrioridad(producto) {
    const cantidad = Number(producto.cantidad);
    const minimo = Number(producto.stockMinimo);

    if (cantidad === 0) {
        return "Crítica";
    }

    if (cantidad <= minimo / 2) {
        return "Alta";
    }

    if (cantidad <= minimo) {
        return "Normal";
    }

    return "Sin alerta";
}

function obtenerProveedorNombre(id) {
    const proveedor = proveedores.find(p => p.id === id);
    return proveedor ? proveedor.nombre : "Sin proveedor";
}

async function agregarProducto() {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const nombre = document.getElementById("nombre").value;
    const categoria = document.getElementById("categoria").value;
    const cantidad = Number(document.getElementById("cantidad").value);
    const stockMinimo = Number(document.getElementById("stockMinimo").value);
    const proveedorId = document.getElementById("proveedorProducto").value;

    if (!validarProducto(nombre, categoria, cantidad, stockMinimo)) {
        return;
    }

    const producto = {
        nombre: nombre.trim(),
        categoria,
        cantidad,
        stockMinimo,
        proveedorId
    };

    await addDoc(collection(db, "productos"), producto);

    await registrarMovimiento(
        "Producto agregado",
        `Se agregó el producto ${nombre}.`
    );

    limpiarFormularioProducto();

    await cargarDatos();

    mostrarMensaje("Producto agregado correctamente.", "correcto");
    mostrarSeccion("inventario");
}

function limpiarFormularioProducto() {
    document.getElementById("nombre").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("cantidad").value = "";
    document.getElementById("stockMinimo").value = 10;
    document.getElementById("proveedorProducto").value = "";
}

function renderizarProductos(lista) {
    const tabla = document.getElementById("tablaProductos");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    lista.forEach((producto, index) => {
        const estado = obtenerEstado(producto);
        const prioridad = obtenerPrioridad(producto);

        tabla.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.stockMinimo}</td>
                <td>${obtenerProveedorNombre(producto.proveedorId)}</td>
                <td class="${claseEstado(estado)}">${estado}</td>
                <td class="${clasePrioridad(prioridad)}">${prioridad}</td>
                <td class="admin-only-col">
                    <button onclick="editarProducto(${index})">Editar</button>
                    <button onclick="eliminarProducto(${index})">Eliminar</button>
                </td>
            </tr>
        `;
    });

    if (usuarioActivo && usuarioActivo.rol === "Empleado") {
        document.querySelectorAll(".admin-only-col").forEach(e => {
            e.style.display = "none";
        });
    }
}

function claseEstado(estado) {
    if (estado === "Disponible") {
        return "estado-ok";
    }

    if (estado === "Bajo stock") {
        return "estado-bajo";
    }

    return "estado-agotado";
}

function clasePrioridad(prioridad) {
    if (prioridad === "Crítica") {
        return "prioridad-critica";
    }

    if (prioridad === "Alta") {
        return "prioridad-alta";
    }

    return "prioridad-normal";
}

function editarProducto(index) {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const producto = productos[index];

    document.getElementById("indiceEditar").value = index;
    document.getElementById("editarNombre").value = producto.nombre;
    document.getElementById("editarCategoria").value = producto.categoria;
    document.getElementById("editarCantidad").value = producto.cantidad;
    document.getElementById("editarStockMinimo").value = producto.stockMinimo;
    document.getElementById("editarProveedorProducto").value = producto.proveedorId || "";

    mostrarSeccion("editar");
}

async function guardarEdicion() {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const index = document.getElementById("indiceEditar").value;
    const producto = productos[index];

    const nombre = document.getElementById("editarNombre").value;
    const categoria = document.getElementById("editarCategoria").value;
    const cantidad = Number(document.getElementById("editarCantidad").value);
    const stockMinimo = Number(document.getElementById("editarStockMinimo").value);
    const proveedorId = document.getElementById("editarProveedorProducto").value;

    if (!validarProducto(nombre, categoria, cantidad, stockMinimo)) {
        return;
    }

    await updateDoc(doc(db, "productos", producto.id), {
        nombre: nombre.trim(),
        categoria,
        cantidad,
        stockMinimo,
        proveedorId
    });

    await registrarMovimiento(
        "Producto editado",
        `Se actualizó el producto ${nombre}.`
    );

    await cargarDatos();

    mostrarMensaje("Producto actualizado.", "correcto");
    mostrarSeccion("inventario");
}

async function eliminarProducto(index) {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const producto = productos[index];

    const confirmar = confirm("¿Desea eliminar este producto?");

    if (!confirmar) {
        return;
    }

    await deleteDoc(doc(db, "productos", producto.id));

    await registrarMovimiento(
        "Producto eliminado",
        `Se eliminó el producto ${producto.nombre}.`
    );

    await cargarDatos();

    mostrarMensaje("Producto eliminado.", "correcto");
}

function filtrarProductos() {
    const texto = document.getElementById("busqueda").value.toLowerCase();
    const categoria = document.getElementById("filtroCategoria").value;
    const estado = document.getElementById("filtroEstado").value;
    const proveedor = document.getElementById("filtroProveedor").value;

    const filtrados = productos.filter(producto => {
        const coincideTexto =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.categoria.toLowerCase().includes(texto);

        const coincideCategoria =
            categoria === "" || producto.categoria === categoria;

        const coincideEstado =
            estado === "" || obtenerEstado(producto) === estado;

        const coincideProveedor =
            proveedor === "" || producto.proveedorId === proveedor;

        return coincideTexto &&
               coincideCategoria &&
               coincideEstado &&
               coincideProveedor;
    });

    renderizarProductos(filtrados);
}

function renderizarBajoStock() {
    const tabla = document.getElementById("tablaBajoStock");
    const dashboard = document.getElementById("dashboardBajoStock");

    if (!tabla || !dashboard) {
        return;
    }

    tabla.innerHTML = "";
    dashboard.innerHTML = "";

    const productosBajos = productos.filter(producto =>
        Number(producto.cantidad) <= Number(producto.stockMinimo)
    );

    if (productosBajos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="5">No hay productos con bajo stock.</td>
            </tr>
        `;

        dashboard.innerHTML = `
            <tr>
                <td colspan="4">No hay productos con bajo stock.</td>
            </tr>
        `;

        return;
    }

    productosBajos.forEach(producto => {
        const prioridad = obtenerPrioridad(producto);

        tabla.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.stockMinimo}</td>
                <td>${obtenerProveedorNombre(producto.proveedorId)}</td>
                <td class="${clasePrioridad(prioridad)}">${prioridad}</td>
            </tr>
        `;

        dashboard.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.stockMinimo}</td>
                <td class="${clasePrioridad(prioridad)}">${prioridad}</td>
            </tr>
        `;
    });
}

async function guardarProveedor() {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const index = document.getElementById("indiceProveedor").value;

    const proveedor = {
        nombre: document.getElementById("nombreProveedor").value.trim(),
        telefono: document.getElementById("telefonoProveedor").value.trim(),
        correo: document.getElementById("correoProveedor").value.trim(),
        direccion: document.getElementById("direccionProveedor").value.trim(),
        productos: document.getElementById("productosProveedor").value.trim(),
        estado: document.getElementById("estadoProveedor").value
    };

    if (proveedor.nombre === "") {
        mostrarMensaje("El nombre del proveedor es obligatorio.", "error");
        return;
    }

    if (index === "") {
        await addDoc(collection(db, "proveedores"), proveedor);

        await registrarMovimiento(
            "Proveedor agregado",
            `Se agregó el proveedor ${proveedor.nombre}.`
        );
    } else {
        await updateDoc(doc(db, "proveedores", proveedores[index].id), proveedor);

        await registrarMovimiento(
            "Proveedor editado",
            `Se actualizó el proveedor ${proveedor.nombre}.`
        );
    }

    limpiarProveedor();

    await cargarDatos();

    mostrarMensaje("Proveedor guardado.", "correcto");
}

function renderizarProveedores() {
    const tabla = document.getElementById("tablaProveedores");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    proveedores.forEach((proveedor, index) => {
        tabla.innerHTML += `
            <tr>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.telefono}</td>
                <td>${proveedor.correo}</td>
                <td>${proveedor.productos}</td>
                <td>${proveedor.estado}</td>
                <td>
                    <button onclick="editarProveedor(${index})">Editar</button>
                    <button onclick="eliminarProveedor(${index})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

function editarProveedor(index) {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const proveedor = proveedores[index];

    document.getElementById("indiceProveedor").value = index;
    document.getElementById("nombreProveedor").value = proveedor.nombre;
    document.getElementById("telefonoProveedor").value = proveedor.telefono;
    document.getElementById("correoProveedor").value = proveedor.correo;
    document.getElementById("direccionProveedor").value = proveedor.direccion;
    document.getElementById("productosProveedor").value = proveedor.productos;
    document.getElementById("estadoProveedor").value = proveedor.estado;
}

async function eliminarProveedor(index) {
    if (usuarioActivo.rol !== "Administrador") {
        return;
    }

    const proveedor = proveedores[index];

    const confirmar = confirm("¿Desea eliminar este proveedor?");

    if (!confirmar) {
        return;
    }

    await deleteDoc(doc(db, "proveedores", proveedor.id));

    await registrarMovimiento(
        "Proveedor eliminado",
        `Se eliminó el proveedor ${proveedor.nombre}.`
    );

    await cargarDatos();

    mostrarMensaje("Proveedor eliminado.", "correcto");
}

function limpiarProveedor() {
    document.getElementById("indiceProveedor").value = "";
    document.getElementById("nombreProveedor").value = "";
    document.getElementById("telefonoProveedor").value = "";
    document.getElementById("correoProveedor").value = "";
    document.getElementById("direccionProveedor").value = "";
    document.getElementById("productosProveedor").value = "";
    document.getElementById("estadoProveedor").value = "Activo";
}

function cargarSelectProveedores() {
    const selects = [
        document.getElementById("proveedorProducto"),
        document.getElementById("editarProveedorProducto"),
        document.getElementById("filtroProveedor")
    ];

    selects.forEach(select => {
        if (!select) {
            return;
        }

        select.innerHTML = `<option value="">Sin proveedor / Todos</option>`;

        proveedores.forEach(proveedor => {
            if (proveedor.estado === "Activo") {
                select.innerHTML += `
                    <option value="${proveedor.id}">
                        ${proveedor.nombre}
                    </option>
                `;
            }
        });
    });
}

async function registrarMovimiento(tipo, descripcion) {
    await addDoc(collection(db, "historial"), {
        fecha: new Date().toISOString(),
        tipo,
        descripcion,
        usuario: usuarioActivo.usuario
    });
}

function renderizarHistorial() {
    const tabla = document.getElementById("tablaHistorial");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    historial.forEach(movimiento => {
        tabla.innerHTML += `
            <tr>
                <td>${new Date(movimiento.fecha).toLocaleString()}</td>
                <td>${movimiento.tipo}</td>
                <td>${movimiento.descripcion}</td>
                <td>${movimiento.usuario}</td>
            </tr>
        `;
    });
}

function actualizarDashboard() {
    const totalProductos = document.getElementById("totalProductos");
    const totalUnidades = document.getElementById("totalUnidades");
    const totalBajoStock = document.getElementById("totalBajoStock");
    const totalProveedores = document.getElementById("totalProveedores");

    if (!totalProductos || !totalUnidades || !totalBajoStock || !totalProveedores) {
        return;
    }

    totalProductos.textContent = productos.length;

    const unidades = productos.reduce(
        (total, producto) => total + Number(producto.cantidad),
        0
    );

    totalUnidades.textContent = unidades;

    const bajoStock = productos.filter(producto =>
        Number(producto.cantidad) <= Number(producto.stockMinimo)
    ).length;

    totalBajoStock.textContent = bajoStock;

    const activos = proveedores.filter(proveedor =>
        proveedor.estado === "Activo"
    ).length;

    totalProveedores.textContent = activos;
}

function exportarCSV() {
    let csv = "Nombre;Categoría;Cantidad;Stock mínimo;Proveedor;Estado\n";

    productos.forEach(producto => {
        csv += `${producto.nombre};${producto.categoria};${producto.cantidad};${producto.stockMinimo};${obtenerProveedorNombre(producto.proveedorId)};${obtenerEstado(producto)}\n`;
    });

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "inventario_pernocentro.csv";
    enlace.click();
}

window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.mostrarSeccion = mostrarSeccion;
window.agregarProducto = agregarProducto;
window.editarProducto = editarProducto;
window.guardarEdicion = guardarEdicion;
window.eliminarProducto = eliminarProducto;
window.filtrarProductos = filtrarProductos;
window.guardarProveedor = guardarProveedor;
window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.limpiarProveedor = limpiarProveedor;
window.exportarCSV = exportarCSV;
