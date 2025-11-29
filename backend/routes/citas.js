const express = require('express');
const { Cita } = require('../db');

const router = express.Router();

// Obtener todas las citas (con filtros opcionales)
router.get('/citas', async (req, res) => {
  try {
    const { donanteId, hospitalId, fecha } = req.query;
    const where = {};

    if (donanteId) where.donante_id = donanteId;
    if (hospitalId) where.hospital_id = hospitalId;
    if (fecha) where.fecha = fecha;

    const citas = await Cita.findAll({
      where,
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
    });

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo citas' });
  }
});

// Obtener citas de un donante concreto
router.get('/donantes/:id/citas', async (req, res) => {
  try {
    const donanteId = req.params.id;

    const citas = await Cita.findAll({
      where: { donante_id: donanteId },
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
    });

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo citas del donante' });
  }
});

// Obtener citas de un hospital concreto
router.get('/hospitales/:id/citas', async (req, res) => {
  try {
    const hospitalId = req.params.id;

    const citas = await Cita.findAll({
      where: { hospital_id: hospitalId },
      order: [['fecha', 'ASC'], ['hora', 'ASC']],
    });

    res.json(citas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo citas del hospital' });
  }
});

// Crear una nueva cita
router.post('/citas', async (req, res) => {
  try {
    const {
        donante_id,
        hospital_id,
        fecha,
        hora,
        departamento,
        mensaje,
        doctor,
    } = req.body;


    if (!donante_id || !hospital_id || !fecha || !departamento) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const cita = await Cita.create({ 
        donante_id,
        hospital_id,
        fecha,
        hora,
        departamento,
        mensaje,
        doctor,
        status: 'PENDIENTE',
    });


    res.status(201).json(cita);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando cita' });
  }
});

// Actualizar una cita (estado, fecha/hora, mensaje)
router.patch('/citas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { fecha, hora, departamento, mensaje, status } = req.body;

    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (fecha) cita.fecha = fecha;
    if (hora) cita.hora = hora;
    if (departamento) cita.departamento = departamento;
    if (mensaje) cita.mensaje = mensaje;
    if (status) cita.status = status;

    await cita.save();
    res.json(cita);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando cita' });
  }
});

// Eliminar una cita (cancelarla definitivamente)
router.delete('/citas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await cita.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando cita' });
  }
});

module.exports = router;
