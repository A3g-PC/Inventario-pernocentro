const STOCK_MINIMO = 10;

const USUARIO = "admin";
const CLAVE = "1234";

let inventario =
JSON.parse(localStorage.getItem("inventarioPernocentro")) || [

    {
        nombre:"Martillo",
        categoria:"Herramientas",
        cantidad:15
    },

    {
        nombre:"Taladro",
        categoria:"Herramientas",
        cantidad:8
    },

    {
        nombre:"Clavos 2 pulgadas",
        categoria:"Ferretería",
        cantidad:120
    },

    {
        nombre:"Pintura blanca",
        categoria:"Pinturas",
        cantidad:5
    }

];

function iniciarSesion(){

    const usuario =
    document.getElementById("usuario").value;

    const clave =
    document.getElementById("clave").value;

    if(usuario === USUARIO && clave === CLAVE){

        document.getElementById("loginPantalla")
        .style.display = "none";

        document.getElementById("sistema")
        .classList.remove("oculto");

        mostrarMensaje(
            "Inicio de sesión correcto.",
            "correcto"
        );

    }else{

        mostrarMensaje(
            "Usuario o contraseña incorrectos.",
            "error"
        );

    }

}

function cerrarSesion(){

    location.reload();

}

function guardarInventario(){

    localStorage.setItem(
        "inventarioPernocentro",
        JSON.stringify(inventario)
    );

}

function mostrarSeccion(id){

    document.querySelectorAll(".section")
    .forEach(seccion => {

        seccion.classList.remove("active");

    });

    document.getElementById(id)
    .classList.add("active");

    document.querySelectorAll(".nav")
    .forEach(nav => {

        nav.classList.remove("active");

    });

    if(id === "inicio"){
        document.querySelectorAll(".nav")[0]
        .classList.add("active");
    }

    if(id === "agregar"){
        document.querySelectorAll(".nav")[1]
        .classList.add("active");
    }

    if(id === "bajoStock"){
        document.querySelectorAll(".nav")[2]
        .classList.add("active");
    }

    if(id === "configuracion"){
        document.querySelectorAll(".nav")[3]
        .classList.add("active");
    }

    renderizarProductos();
    renderizarBajoStock();

    document.getElementById("totalProductos")
    .textContent = inventario.length;

}

function mostrarMensaje(texto,tipo){

    const mensaje =
    document.getElementById("mensaje");

    mensaje.textContent = texto;

    mensaje.className =
    `mensaje ${tipo}`;

    mensaje.style.display = "block";

    setTimeout(()=>{

        mensaje.style.display = "none";

    },2500);

}

function validarDatos(nombre,categoria,cantidad){

    if(
        nombre.trim() === "" ||
        categoria.trim() === ""
    ){

        mostrarMensaje(
            "Todos los campos son obligatorios.",
            "error"
        );

        return false;

    }

    if(
        cantidad === "" ||
        cantidad < 0
    ){

        mostrarMensaje(
            "Cantidad inválida.",
            "advertencia"
        );

        return false;

    }

    return true;

}

function agregarProducto(){

    const nombre =
    document.getElementById("nombre").value;

    const categoria =
    document.getElementById("categoria").value;

    const cantidad =
    Number(document.getElementById("cantidad").value);

    if(
        !validarDatos(
            nombre,
            categoria,
            cantidad
        )
    ){
        return;
    }

    const producto = {

        nombre:nombre.trim(),
        categoria:categoria,
        cantidad:cantidad

    };

    inventario.push(producto);

    guardarInventario();

    document.getElementById("nombre").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("cantidad").value = "";

    mostrarMensaje(
        "Producto agregado correctamente.",
        "correcto"
    );

    mostrarSeccion("inicio");

}

function renderizarProductos(lista = inventario){

    const tabla =
    document.getElementById("tablaProductos");

    tabla.innerHTML = "";

    lista.forEach((producto,index)=>{

        tabla.innerHTML += `

        <tr>

            <td>${producto.nombre}</td>

            <td>${producto.categoria}</td>

            <td>${producto.cantidad}</td>

            <td class="acciones">

                <button onclick="editarProducto(${index})">
                    ✎
                </button>

                <button onclick="eliminarProducto(${index})">
                    🗑
                </button>

            </td>

        </tr>

        `;

    });

    document.getElementById("contador")
    .textContent =
    `Mostrando ${lista.length} productos`;

}

function editarProducto(index){

    const producto = inventario[index];

    document.getElementById("indiceEditar")
    .value = index;

    document.getElementById("editarNombre")
    .value = producto.nombre;

    document.getElementById("editarCategoria")
    .value = producto.categoria;

    document.getElementById("editarCantidad")
    .value = producto.cantidad;

    mostrarSeccion("editar");

}

function guardarEdicion(){

    const index =
    document.getElementById("indiceEditar").value;

    const nombre =
    document.getElementById("editarNombre").value;

    const categoria =
    document.getElementById("editarCategoria").value;

    const cantidad =
    Number(
        document.getElementById("editarCantidad").value
    );

    if(
        !validarDatos(
            nombre,
            categoria,
            cantidad
        )
    ){
        return;
    }

    inventario[index] = {

        nombre:nombre.trim(),
        categoria:categoria,
        cantidad:cantidad

    };

    guardarInventario();

    mostrarMensaje(
        "Producto actualizado.",
        "correcto"
    );

    mostrarSeccion("inicio");

}

function eliminarProducto(index){

    const confirmar =
    confirm(
        "¿Desea eliminar este producto?"
    );

    if(confirmar){

        inventario.splice(index,1);

        guardarInventario();

        renderizarProductos();
        renderizarBajoStock();

        mostrarMensaje(
            "Producto eliminado.",
            "correcto"
        );

    }

}

function renderizarBajoStock(){

    const tabla =
    document.getElementById("tablaBajoStock");

    tabla.innerHTML = "";

    const productos =
    inventario.filter(producto =>

        producto.cantidad <= STOCK_MINIMO

    );

    if(productos.length === 0){

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

function buscarProducto(){

    const texto =
    document.getElementById("busqueda")
    .value
    .toLowerCase();

    const resultados =
    inventario.filter(producto =>

        producto.nombre.toLowerCase()
        .includes(texto)

        ||

        producto.categoria.toLowerCase()
        .includes(texto)

    );

    renderizarProductos(resultados);

}

renderizarProductos();
renderizarBajoStock();