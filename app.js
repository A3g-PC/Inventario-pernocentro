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

const STOCK_MINIMO = 10;
const USUARIO = "admin";
const CLAVE = "1234";

let inventario = [];

async function cargarInventario() {
    inventario = [];

    const consulta = await getDocs(collection(db, "productos"));

    consulta.forEach(documento => {
        inventario.push({
            id: documento.id,
            ...documento.data()
        });
    });

    renderizarProductos();
    renderizarBajoStock();

    const total = document.getElementById("totalProductos");
    if (total) {
        total.textContent = inventario.length;
    }
}

function iniciarSesion() {
    const usuario = document.getElementById("usuario").value;
    const clave = document.getElementById("clave").value;

    if (usuario === USUARIO && clave === CLAVE) {
        document.getElementById("loginPantalla").style.display = "none";
        document.getElementById("sistema").classList.remove("oculto");

        mostrarMensaje("Inicio de sesión correcto.", "correcto");
        cargarInventario();
    } else {
        mostrarMensaje("Usuario o contraseña incorrectos.", "error");
    }
}

function cerrarSesion() {
    location.reload();
}

function mostrarSeccion(id) {
    document.querySelectorAll(".section").forEach(seccion => {
        seccion.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");

    document.querySelectorAll(".nav").forEach(nav => {
        nav.classList.remove("active");
    });

    if (id === "inicio") document.querySelectorAll(".nav")[0].classList.add("active");
    if (id === "agregar") document.querySelectorAll(".nav")[1].classList.add("active");
    if (id === "bajoStock") document.querySelectorAll(".nav")[2].classList.add("active");
    if (id === "configuracion") document.querySelectorAll(".nav")[3].classList.add("active");

    renderizarProductos();
    renderizarBajoStock();

    const total = document.getElementById("totalProductos");
    if (total) {
        total.textContent = inventario.length;
    }
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

function validarDatos(nombre, categoria, cantidad) {
    if (nombre.trim() === "" || categoria.trim() === "") {
        mostrarMensaje("Todos los campos son obligatorios.", "error");
        return false;
    }

    if (cantidad === "" || cantidad < 0) {
        mostrarMensaje("Cantidad inválida.", "advertencia");
        return false;
    }

    return true;
}

async function agregarProducto() {
    const nombre = document.getElementById("nombre").value;
    const categoria = document.getElementById("categoria").value;
    const cantidad = Number(document.getElementById("cantidad").value);

    if (!validarDatos(nombre, categoria, cantidad)) return;

    await addDoc(collection(db, "productos"), {
        nombre: nombre.trim(),
        categoria: categoria,
        cantidad: cantidad
    });

    document.getElementById("nombre").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("cantidad").value = "";

    await cargarInventario();

    mostrarMensaje("Producto agregado correctamente.", "correcto");
    mostrarSeccion("inicio");
}

function renderizarProductos(lista = inventario) {
    const tabla = document.getElementById("tablaProductos");

    if (!tabla) return;

    tabla.innerHTML = "";

    lista.forEach((producto, index) => {
        tabla.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${producto.cantidad}</td>
                <td class="acciones">
                    <button onclick="editarProducto(${index})">✎</button>
                    <button onclick="eliminarProducto(${index})">🗑</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("contador").textContent =
        `Mostrando ${lista.length} productos`;
}

function editarProducto(index) {
    const producto = inventario[index];

    document.getElementById("indiceEditar").value = index;
    document.getElementById("editarNombre").value = producto.nombre;
    document.getElementById("editarCategoria").value = producto.categoria;
    document.getElementById("editarCantidad").value = producto.cantidad;

    mostrarSeccion("editar");
}

async function guardarEdicion() {
    const index = document.getElementById("indiceEditar").value;
    const producto = inventario[index];

    const nombre = document.getElementById("editarNombre").value;
    const categoria = document.getElementById("editarCategoria").value;
    const cantidad = Number(document.getElementById("editarCantidad").value);

    if (!validarDatos(nombre, categoria, cantidad)) return;

    await updateDoc(doc(db, "productos", producto.id), {
        nombre: nombre.trim(),
        categoria: categoria,
        cantidad: cantidad
    });

    await cargarInventario();

    mostrarMensaje("Producto actualizado.", "correcto");
    mostrarSeccion("inicio");
}

async function eliminarProducto(index) {
    const confirmar = confirm("¿Desea eliminar este producto?");

    if (confirmar) {
        const producto = inventario[index];

        await deleteDoc(doc(db, "productos", producto.id));

        await cargarInventario();

        mostrarMensaje("Producto eliminado.", "correcto");
    }
}

function renderizarBajoStock() {
    const tabla = document.getElementById("tablaBajoStock");

    if (!tabla) return;

    tabla.innerHTML = "";

    const productos = inventario.filter(producto =>
        producto.cantidad <= STOCK_MINIMO
    );

    if (productos.length === 0) {
        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    No existen productos con bajo stock.
                </td>
            </tr>
        `;
        return;
    }

    productos.forEach(producto => {
        tabla.innerHTML += `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${producto.cantidad}</td>
                <td>${STOCK_MINIMO}</td>
            </tr>
        `;
    });
}

function buscarProducto() {
    const texto = document.getElementById("busqueda").value.toLowerCase();

    const resultados = inventario.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto)
    );

    renderizarProductos(resultados);
}

window.iniciarSesion = iniciarSesion;
window.cerrarSesion = cerrarSesion;
window.mostrarSeccion = mostrarSeccion;
window.agregarProducto = agregarProducto;
window.editarProducto = editarProducto;
window.guardarEdicion = guardarEdicion;
window.eliminarProducto = eliminarProducto;
window.buscarProducto = buscarProducto;
