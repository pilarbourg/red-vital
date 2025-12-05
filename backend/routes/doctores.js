const express = require('express');

const { Doctor, Hospital } = require('../db');

const router = express.Router();


router.get('/doctores', async (req, res) => {
  try {
    const { hospitalId, departamento } = req.query;
    const where = {};

    if (hospitalId) where.hospital_id = hospitalId;
    if (departamento) where.departamento = departamento;

    const doctores = await Doctor.findAll({
      where,
      include: Hospital, 
    });

    res.json(doctores);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
});

router.post('/doctores', async (req, res) => {
  try {
    const { nombre, departamento, hospital_id } = req.body;

    if (!nombre || !departamento || !hospital_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const doctor = await Doctor.create({ nombre, departamento, hospital_id });
    res.status(201).json({ message: 'Doctor creado', doctor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/doctores/:id', async (req, res) => {
  try {
    const doc = await Doctor.findByPk(req.params.id, { include: Hospital });
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/doctores/:id', async (req, res) => {
  try {
    const doc = await Doctor.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });

    await doc.update(req.body);

    res.json({ message: 'Doctor actualizado', doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/doctores/:id', async (req, res) => {
  try {
    const doc = await Doctor.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    await doc.destroy();
    res.json({ message: 'Doctor eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

