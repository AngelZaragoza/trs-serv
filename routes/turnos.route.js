const express = require("express");
const router = express.Router();
const authGuard = require("../lib/authguard"); //Chequeo antes de cada peticion

const turnosController = require("../controllers/turnos.controller");

//Listados
// router.route("/fechas").get(turnosController.pruebaConsultaFecha);
router.route("/estado-fechas").get(authGuard, turnosController.estadoTurnosFechas);
router.route("/ultimos").get(authGuard, turnosController.ultimosNTurnos);

//Operaciones
router
  .route("/inout")
  .get(authGuard, turnosController.getTurnoActivo)
  .post(authGuard, turnosController.getTurnoActivo, turnosController.inicioTurno)
  .patch(authGuard, turnosController.cierreTurno);

module.exports = router;
