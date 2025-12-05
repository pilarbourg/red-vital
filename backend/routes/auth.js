/* Se debe unir a la DB los modelos:
Usuario, Donante, Hospital, Admin
*/

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { Usuario } = require("../db");  
// TODO cuando esté todo implementado:
// const { Usuario, Donante, Hospital, Admin, Doctor } = require('../db');


// REGISTRO
router.post("/auth/register", async (req, res) => {
  const { email, password, rol, direccion, telefono } = req.body;

  try {
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    const nuevo = await Usuario.create({
      email,
      password,
      rol,
      direccion,
      telefono
    });

    res.json({
      mensaje: "Usuario registrado",
      id: nuevo.id,
      rol: nuevo.rol
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// LOGIN
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Usuario.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const coincide = await bcrypt.compare(password, user.password);
    if (!coincide) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    //devolver id y rol para guardar en localStorage
    res.json({
      mensaje: "Login correcto",
      id: user.id,
      rol: user.rol,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
