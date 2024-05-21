const btnsAgrgar = document.querySelectorAll(".btn-agregar");
btnsAgregar.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const carrito = JSON.parse(localStorage.getItem("carrito"));
        localStorage.setItem("carrito", JSON.stringify(carrito));
    });
});