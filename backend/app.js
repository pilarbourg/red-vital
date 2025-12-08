const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const rootDir = path.join(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(rootDir));

app.get("/", (req, res) => res.sendFile(path.join(rootDir, "index.html")));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", require("./routes/cita"));
app.use("/api", require("./routes/donantes"));
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/hospitales"));
app.use("/api", require("./routes/doctores"));
app.use("/api", require("./routes/admin"));

module.exports = app;