const express = require('express');
const router = express.Router();

const { Usuario, Donante, Donacion, Disponibilidad, Cita } = require('../db');

// ===============================
// 🩸 Register a Donante & Usuario
// ===============================
router.post('/donantes/register', async (req, res) => {
  try {
    const { nombre, email, password, apellidos, genero, dob, grupo_sanguineo } = req.body;

    const usuario = await Usuario.create({ nombre, email, password, tipo: "donante" });

    const donante = await Donante.create({
      usuario_id: usuario.id,
      apellidos,
      genero,
      dob,
      grupo_sanguineo
    });

    res.status(201).json({ message: "Donante created", usuario, donante });

  } catch (err) {
    res.status(500).json({ error: "Error registering donante", details: err.message });
  }
});

// 🔐 LOGIN Donante
router.post('/donantes/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email, tipo: "donante" } });
    if (!usuario) return res.status(404).json({ error: "Invalid credentials" });

    // Compare password with bcrypt (assuming hashed)
    const bcrypt = require('bcrypt');
    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(404).json({ error: "Invalid credentials" });

    const donante = await Donante.findOne({ where: { usuario_id: usuario.id } });

    res.json({ message: "Login OK", usuario, donante });

  } catch (err) {
    res.status(500).json({ error: "Error logging in", details: err.message });
  }
});

// 📍 Get all donantes
router.get('/donantes', async (req, res) => {
  try {
    const donantes = await Donante.findAll({ include: Usuario });
    res.json(donantes);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📍 Get donante by ID with donations + citas
router.get('/donantes/:id', async (req, res) => {
  try {
    const donante = await Donante.findByPk(req.params.id, { include: [Usuario, Donacion, Cita] });
    if (!donante) return res.status(404).json({ error: "Donante not found" });

    res.json(donante);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➕ Add disponibilidad
router.post('/donantes/:id/disponibilidad', async (req, res) => {
  try {
    const disp = await Disponibilidad.create({
      donante_id: req.params.id,
      fecha: req.body.fecha
    });
    res.json(disp);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
