const express = require("express");
const pug = require("pug");
const session = require('express-session');
const app = express();
const traductor = require("node-google-translate-skidz");
//const fetch = require('node-fetch');
const fs = require('fs/promises');

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

app.set("view engine", "pug");
app.set("views", "./vistas");

async function traducir(texto) {
    const traduccion = await traductor({

        text: texto,
        source: "en",
        target: "es",
    });
    return traduccion.translation;
}

app.get("/", async (req, res) => {
    const response = await fetch('https://fakestoreapi.com/products');
    const productos = await response.json();

    // traducir titulo y descripcion
    for (producto of productos) {
        producto.title = await traducir(producto.title);
        producto.description = await traducir(producto.description);
        producto.category = await traducir(producto.category);
    } // aplicar descuento
    //let descuentos = await fs.readFile("descuentos.json");
    let descuentos = await fs.readFile("descuentos.json", 'utf8');
    descuentos = JSON.parse(descuentos);

    let desc;
    for (producto of productos) {
        desc = descuentos.filter((descuento) => {
            return descuento.id === producto.id;
        });
        if (desc.length > 0) {
            console.log(desc);
            producto.descuento = desc[0].descuento;
        }
    }
    res.render("index", { productos: productos });
});

app.get("/carrito", (req, res) => {
    const carrito = req.session.carrito || [];
    res.render("carrito", { carrito: carrito });
});

app.post("/carrito/agregar/:id", async (req, res) => {
    const productId = parseInt(req.params.id);
    const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
    const producto = await response.json();
    let descuentos = await fs.readFile("descuentos.json", 'utf8');
    descuentos = JSON.parse(descuentos);

    let desc;
    desc = descuentos.filter((descuento) => {
        return descuento.id === producto.id;
    });
    if (desc.length > 0) {
        console.log(desc);
        producto.descuento = desc[0].descuento;
    }
    let carrito = req.session.carrito || [];
    const existingProduct = carrito.find(item => item.id === productId);

    if (existingProduct) {
        existingProduct.cantidad += 1;
    } else {
        producto.cantidad = 1;
        carrito.push(producto);
    }

    req.session.carrito = carrito;
    res.redirect("/carrito");
});

app.post("/carrito/actualizar/:id", (req, res) => {
    const productId = parseInt(req.params.id);
    const cantidad = parseInt(req.body.cantidad);
    let carrito = req.session.carrito || [];
    const product = carrito.find(item => item.id === productId);

    if (product && cantidad > 0) {
        product.cantidad = cantidad;
    }

    req.session.carrito = carrito;
    res.redirect("/carrito");
});

app.post("/carrito/eliminar/:id", (req, res) => {
    const productId = parseInt(req.params.id);
    let carrito = req.session.carrito || [];
    carrito = carrito.filter(item => item.id !== productId);

    req.session.carrito = carrito;
    res.redirect("/carrito");
});

app.post('/comprar', async (req, res) => {
    try {
        const compra = req.session.carrito || [];
        let compras = await fs.readFile('compras.json', 'utf-8');
        compras = JSON.parse(compras);

        const ids = compras.map(compra => compra.id);
        const id = ids.length ? Math.max(...ids) + 1 : 1;

        compras.push({ id: id, productos: compra });
        await fs.writeFile('compras.json', JSON.stringify(compras));

        req.session.carrito = [];
        res.json({ error: false, message: "Se registró la compra" });
    } catch (error) {
        res.json({ error: true, message: error.message });
    }
});

app.listen(3000, () => {
    console.log('servidor corriendo en el puerto 3000');
});
