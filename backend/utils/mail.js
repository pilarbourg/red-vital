const nodemailer = require('nodemailer');
const { URLSearchParams } = require('url');
const fs   = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const templatePath = path.join(__dirname, 'mail-template.html');
const baseTemplate = fs.readFileSync(templatePath, 'utf8');

function buildAppointmentQuery(cita) {
  const params = new URLSearchParams();

  if (cita.id) params.set('citaId', String(cita.id));
  if (cita.nombre_donante) params.set('nombre', cita.nombre_donante);
  if (cita.fecha) params.set('fecha', cita.fecha);
  if (cita.hora) params.set('hora', cita.hora);
  if (cita.hospital_nombre) params.set('hospital', cita.hospital_nombre);
  if (cita.hospital_ciudad) params.set('ciudad', cita.hospital_ciudad);
  if (cita.doctor) params.set('doctor', cita.doctor);
  if (cita.departamento) params.set('departamento', cita.departamento);
  if (cita.hospital_id) params.set('hospitalId', String(cita.hospital_id));

  const mode = cita.es_invitado ? 'guest' : 'registered';
  params.set('mode', mode);

  if (cita.nombre_donante) params.set('nombre_donante', cita.nombre_donante);
  if (cita.email_donante) params.set('email_donante', cita.email_donante);
  if (cita.telefono_donante) params.set('telefono_donante', cita.telefono_donante);
  if (cita.dob_donante) params.set('dob_donante', cita.dob_donante);
  if (cita.genero_donante) params.set('genero_donante', cita.genero_donante);

  return params.toString();
}

function renderTemplate(cita) {
  const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

  const hospitalTexto = cita.hospital_nombre
    ? `${cita.hospital_nombre}$`
    : `Hospital #${cita.hospital_id}`;

  const query = buildAppointmentQuery(cita);
  const baseConfirmUrl = `${baseUrl}/frontend/pages/appointment-confirmation.html?${query}`;

  const urlConfirmar = `${baseConfirmUrl}&action=confirm`;
  const urlCambiar   = `${baseConfirmUrl}&action=change`;
  const urlCancelar  = `${baseConfirmUrl}&action=cancel`;

  let html = baseTemplate;

  html = html.replace(/{{NOMBRE}}/g, cita.nombre_donante || 'donante');
  html = html.replace(/{{FECHA}}/g, cita.fecha || '');
  html = html.replace(/{{HORA}}/g, cita.hora || '');
  html = html.replace(/{{HOSPITAL_TEXTO}}/g, hospitalTexto);
  html = html.replace(/{{DEPARTAMENTO}}/g, cita.departamento || '—');
  html = html.replace(/{{DOCTOR}}/g, cita.doctor || '—');

  html = html.replace(/{{URL_CONFIRMAR}}/g, urlConfirmar);
  html = html.replace(/{{URL_CAMBIAR}}/g, urlCambiar);
  html = html.replace(/{{URL_CANCELAR}}/g, urlCancelar);

  html = html.replace(/{{BASE_URL}}/g, baseUrl);

  return html;
}

async function enviarCorreoConfirmacion(cita) {
  if (!cita.email_donante) {
    console.warn('Cita sin email_donante, no se envía correo.');
    return;
  }

  const html = renderTemplate(cita);

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: cita.email_donante,
    subject: 'Confirmación de tu cita de donación - RedVital',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de confirmación enviado a', cita.email_donante);
  } catch (err) {
    console.error('Error enviando correo de confirmación:', err);
  }
}

module.exports = { enviarCorreoConfirmacion };
