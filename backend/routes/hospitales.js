const express = require('express');
const router = express.Router();

const { Usuario, Hospital, Solicitud, InventarioSangre, Cita } = require('../db');

router.post('/hospitales/register', async (req, res) => {
  try {
    const { nombre, email, password, direccion, telefono } = req.body;

    const usuario = await Usuario.create({ nombre, email, password, tipo: "hospital" });
    const hospital = await Hospital.create({ usuario_id: usuario.id, direccion, telefono });

    res.status(201).json({ message: "Hospital registered", usuario, hospital });

  } catch (err) {
    res.status(500).json({ error: "Error registering hospital", details: err.message });
  }
});

//get all hospitals
router.get('/hospitales', async (req, res) => {
  try {
    const hospitales = await Hospital.findAll({ include: Usuario });
    res.json(hospitales);

  } catch (err) {
    res.status(500).json({ error: "Error getting hospitals", details: err.message });
  }
});

// get hospital by ID
router.get('/hospitales/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id, {
      include: [Usuario, Solicitud, InventarioSangre, Cita]
    });

    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    res.json(hospital);

  } catch (err) {
    res.status(500).json({ error: "Error fetching hospital", details: err.message });
  }
});

// add blood type to hospital
router.post('/hospitales/:id/inventario', async (req, res) => {
  try {
    const { tipo_sangre, cantidad } = req.body;

    const inventario = await InventarioSangre.create({
      hospital_id: req.params.id,
      tipo_sangre,
      cantidad
    });

    res.json({ message: "Blood stock added", inventario });

  } catch (err) {
    res.status(500).json({ error: "Error adding stock", details: err.message });
  }
});

// get inventory by hospital
router.get('/hospitales/:id/inventario', async (req, res) => {
  try {
    const stock = await InventarioSangre.findAll({
      where: { hospital_id: req.params.id }
    });

    res.json(stock);

  } catch (err) {
    res.status(500).json({ error: "Error retrieving inventory", details: err.message });
  }
});

// create a blood request (solicitud)
router.post('/hospitales/:id/solicitud', async (req, res) => {
  try {
    const { tipo_sangre, cantidad, motivo } = req.body;

    const solicitud = await Solicitud.create({
      hospital_id: req.params.id,
      tipo_sangre,
      cantidad,
      motivo,
      estado: "pendiente"
    });

    res.json({ message: "Solicitud creada", solicitud });

  } catch (err) {
    res.status(500).json({ error: "Error creating solicitud", details: err.message });
  }
});

// view solicitudes by hospital
router.get('/hospitales/:id/solicitudes', async (req, res) => {
  try {
    const solicitudes = await Solicitud.findAll({
      where: { hospital_id: req.params.id }
    });
    res.json(solicitudes);

  } catch (err) {
    res.status(500).json({ error: "Error fetching solicitudes", details: err.message });
  }
});

module.exports = router;
