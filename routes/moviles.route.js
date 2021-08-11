const express = require("express");
const router = express.Router();
const authGuard = require("../lib/authguard"); //Chequeo antes de cada peticion

const movilesController = require("../controllers/moviles.controller");

router.route("/").get(authGuard, movilesController.listaMoviles);
router.route("/tipos").get(authGuard, movilesController.listaTipos);
router
  .route("/detalle/:id")
  .get(authGuard, movilesController.detalleMovil)
  .patch(authGuard, movilesController.updateMovil);

router.route("/nuevo").post(authGuard, movilesController.nuevoMovilFull);

module.exports = router;
