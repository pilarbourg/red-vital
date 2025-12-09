const express = require('express');
const { Cita, Donante, Usuario, Hospital } = require('../db');
const { enviarCorreoConfirmacion } = require('../utils/mail');


const router = express.Router();

function calcularEdad(fechaISO) {
  const hoy = new Date();
  const fn = new Date(fechaISO);
  let edad = hoy.getFullYear() - fn.getFullYear();
  const mes = hoy.getMonth() - fn.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < fn.getDate())) {
    edad--;
  }
  return edad;
}


// Obtener todas las citas (con filtros opcionales)
router.get('/cita', async (req, res) => {
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
router.get('/donantes/:id/cita', async (req, res) => {
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
router.get('/hospitales/:id/cita', async (req, res) => {
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
router.post('/cita', async (req, res) => {
  try {
    const {
      donante_id,         
      es_invitado,        
      nombre_donante,
      email_donante,
      telefono_donante,
      genero_donante,     
      dob_donante,       

      hospital_id,
      fecha,              
      hora,
      departamento,
      mensaje,
      doctor,
    } = req.body;

    // Validaciones comunes
    if (!hospital_id || !fecha || !departamento) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de la cita' });
    }

    if (donante_id && es_invitado) {
      return res.status(400).json({
        error: 'Una cita no puede ser a la vez de donante registrado e invitado',
      });
    }

    // Objeto base que iremos rellenando
    const dataCita = {
      hospital_id,
      fecha,
      hora,
      departamento,
      mensaje,
      doctor,
      status: 'PENDIENTE',
    };

    //CASO 1: donante registrado (con login)
    if (donante_id) {
      const donante = await Donante.findByPk(donante_id, {
        include: [{ model: Usuario, as: 'usuario' }],
      });

      if (!donante) {
        return res.status(400).json({ error: 'Donante no encontrado' });
      }
      
      const dob = donante.dob;
      if (!dob) {
        return res.status(400).json({ error: 'El donante no tiene fecha de nacimiento registrada' });
      }

      const edad = calcularEdad(dob);
      if (edad < 18) {
        return res.status(400).json({ error: 'El donante debe ser mayor de 18 años' });
      }

      dataCita.donante_id    = donante_id;
      dataCita.es_invitado   = false;
      dataCita.nombre_donante   = `${donante.nombre} ${donante.apellidos || ''}`.trim();
      dataCita.email_donante    = donante.usuario?.email || null;
      dataCita.telefono_donante = donante.usuario?.telefono || null;
      dataCita.genero_donante   = donante.genero || null; 
      dataCita.dob_donante      = dob;

    //CASO 2: invitado (sin login)
    } else {
      if (!es_invitado) {
        return res.status(400).json({
          error: 'Si no hay donante_id, es_invitado debe ser true',
        });
      }

      if (!nombre_donante || !email_donante || !dob_donante) {
        return res.status(400).json({
          error: 'Faltan datos del invitado: nombre, email o fecha de nacimiento',
        });
      }

      const edad = calcularEdad(dob_donante);
      if (edad < 18) {
        return res.status(400).json({ error: 'El invitado debe ser mayor de 18 años' });
      }

      dataCita.donante_id       = null;
      dataCita.es_invitado      = true;
      dataCita.nombre_donante   = nombre_donante;
      dataCita.email_donante    = email_donante;
      dataCita.telefono_donante = telefono_donante || null;
      dataCita.genero_donante   = genero_donante || null;
      dataCita.dob_donante      = dob_donante;
    }

    const cita = await Cita.create(dataCita);
    res.status(201).json(cita);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando cita' });
  }
});



// Actualizar una cita (estado, fecha/hora, mensaje)
router.patch('/cita/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { fecha, hora, departamento, mensaje, status } = req.body;

    const cita = await Cita.findByPk(id);
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    const prevStatus = cita.status;

    if (fecha) cita.fecha = fecha;
    if (hora) cita.hora = hora;
    if (departamento) cita.departamento = departamento;
    if (mensaje) cita.mensaje = mensaje;
    if (status) cita.status = status;

    await cita.save();

    if (status === 'CONFIRMADA' && prevStatus !== 'CONFIRMADA') {
      //cita.hospital_nombre = hospital.nombre || null;
      //cita.hospital_ciudad = hospital.ciudad || null;

      const hosp = await Hospital.findByPk(cita.hospital_id);
      cita.hospital_nombre = hosp ? hosp.nombre : null;
      cita.hospital_ciudad = hosp ? hosp.ciudad : null;

      await enviarCorreoConfirmacion(cita);
    }

    res.json(cita);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando cita' });
  }
});

// Eliminar una cita (cancelarla definitivamente)
router.delete('/cita/:id', async (req, res) => {
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
