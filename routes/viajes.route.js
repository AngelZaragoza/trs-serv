const express = require("express");
const router = express.Router();
const authGuard = require("../lib/authguard"); //Chequeo antes de cada peticion

const viajesController = require("../controllers/viajes.controller");

//Listados
router.route("/tipos").get(authGuard, viajesController.tiposViaje);
router.route("/estados").get(authGuard, viajesController.estadosViaje);
router.route("/turno/:turno_id").get(authGuard, viajesController.viajesTurnoActivo);
router.route("/pendientes/activos").get(authGuard, viajesController.pendientesActivos)
router.route("/hist-fechas").get(authGuard, viajesController.viajesEntreFechas)

//Creación
router.route("/normal").post(authGuard, viajesController.nuevoViajeNormal);
router.route("/pendiente").post(authGuard, viajesController.nuevoViajePendiente);

//Edición o Anulación
router.route("/pendiente/:viaje_pendiente_id").post(authGuard, viajesController.asignaPendiente);


module.exports = router;