/*Se debe unir a la DB los modelos:
usuario, donante, hospital, admin
*/

//USUARIO:

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { usuario } = require("../db");
//TODO once login is done: const { Usuario, Donante, Hospital, Admin, Doctor } = require('../db');


// Registro
router.post("/auth/register", async (req, res) => {
    const { email, password, rol, direccion, telefono } = req.body;

    try {
        const existe = await usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ mensaje: "El correo ya está registrado" });
        }

        const nuevo = await usuario.create({
            email,
            password,
            rol,
            direccion,
            telefono
        });

        res.json({ mensaje: "Usuario registrado", id: nuevo.id });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Login
router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await usuario.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ mensaje: "Usuario no encontrado" });
        }

        const coincide = await bcrypt.compare(password, user.password);
        if (!coincide) {
            return res.status(400).json({ mensaje: "Contraseña incorrecta" });
        }

        res.json({ mensaje: "Login correcto", rol: user.rol });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

module.exports = router;
