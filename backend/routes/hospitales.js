const express = require('express');
const router = express.Router();

const { Usuario, Hospital, Donante, Solicitud, InventarioSangre, Cita, Notificacion, Donacion } = require('../db');

router.post('/hospitales/register', async (req, res) => { //tested
  try {
    const { email, password, direccion, telefono } = req.body;

    const usuario = await Usuario.create({ 
        email, 
        password, 
        rol: "HOSPITAL",
        direccion,
        telefono
    });

    res.status(201).json({ message: "Hospital registrado", usuario });

  } catch (err) {
    res.status(500).json({ error: "Error registering hospital", details: err.message });
  }
});


//get all hospitals
router.get('/hospitales', async (req, res) => { //tested
  try {
    const hospitales = await Hospital.findAll({ include: Usuario });
    res.json(hospitales);

  } catch (err) {
    res.status(500).json({ error: "Error getting hospitals", details: err.message });
  }
});

// get hospital by ID
router.get('/hospitales/:id', async (req, res) => { //tested
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
router.post('/hospitales/:id/inventario', async (req, res) => {  //tested
  try {
    const { grupo_sanguineo, cantidad_unidades } = req.body;

    const inventario = await InventarioSangre.create({
      hospital_id: req.params.id,
      grupo_sanguineo,
      cantidad_unidades
    });

    res.json({ message: "Blood stock added", inventario });

  } catch (err) {
    res.status(500).json({ error: "Error adding stock", details: err.message });
  }
});

// get inventory by hospital
router.get('/hospitales/:id/inventario', async (req, res) => { //tested
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
router.post('/hospitales/:id/solicitud', async (req, res) => { //tested
  try {
    const { grupo_sanguineo, cantidad_unidades, comentarios, urgencia } = req.body;

    const solicitud = await Solicitud.create({
      hospital_id: req.params.id,
      grupo_sanguineo,
      cantidad_unidades,
      comentarios,
      urgencia,
      estado: "PENDIENTE"
    });

    res.json({ message: "Solicitud creada correctamente", solicitud });

  } catch (err) {
    res.status(500).json({ error: "Error creating solicitud", details: err.message });
  }
});


// view solicitudes by hospital
router.get('/hospitales/:id/solicitudes', async (req, res) => { //tested
  try {
    const solicitudes = await Solicitud.findAll({
      where: { hospital_id: req.params.id }
    });
    res.json(solicitudes);

  } catch (err) {
    res.status(500).json({ error: "Error fetching solicitudes", details: err.message });
  }
});

//view compatible donors
router.get('/hospitales/donantes/compatibles', async (req, res) => { //tested
  try {
    const { grupo } = req.query;

    if (!grupo) return res.status(400).json({ error:"Missing grupo parameter → use ?grupo=O+" });

    const donantes = await Donante.findAll({
      where: { grupo_sanguineo: grupo }
    });

    res.json(donantes);

  } catch (err) {
    res.status(500).json({ error:"Error searching donors", details:err.message });
  }
});



//send a notification to a donor 
router.post('/donantes/notificar', async (req, res) => { //tested
  try {
    const { usuario_id, grupo_sanguineo } = req.body;

    const notificacion = await Notificacion.create({
      usuario_id,
      grupo_sanguineo,
      mensaje:`Se requiere donación urgente del tipo ${grupo_sanguineo}`,
      tipo:"HOSPITAL",
      status:"ENVIADA"
    });

    res.json({ message:"Notificación enviada", notificacion });

  } catch (err) {
    res.status(500).json({ error:"Error sending notification", details:err.message });
  }
});

//update state of request 
router.put('/solicitud/:id', async (req, res) => { //tested
  try {
    await Solicitud.update(req.body,{ where:{ id:req.params.id }});
    res.json({ message:"Solicitud actualizada" });

  } catch (err) {
    res.status(500).json({ error:"Error updating", details:err.message });
  }
});

//register donation's results
router.post('/donaciones', async (req, res) => {//tested
  try {
    const result = await Donacion.create(req.body);
    res.json({ message:"Resultado registrado", result });

  } catch (err) {
    res.status(500).json({ error:"Error saving donation", details:err.message });
  }
});


module.exports = router;
