const express = require('express');
const { Doctor } = require('../db');

const router = express.Router();

router.get('/hospitales/:id/doctores', async (req, res) => {
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

module.exports = router;
