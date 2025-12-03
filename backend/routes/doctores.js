const express = require('express');
const { Doctor } = require('../db');

const router = express.Router();

//router.get('/hospitales/:id/doctores', async (req, res) => {
router.get('/doctores', async (req, res) => {
  try {
    const { id } = req.params;
    const { departamento } = req.query;

    const where = { hospital_id: id };
    if (departamento) where.departamento = departamento;

    const doctores = await Doctor.findAll({ where });
    res.json(doctores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
});

router.get('/doctores', async (req, res) => {
  try {
    const docs = await Doctor.findAll({ include: Hospital });
    res.json(docs);
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
    res.json({ message: 'Doctor updated', doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/doctores/:id', async (req, res) => {
  try {
    const doc = await Doctor.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    await doc.destroy();
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

