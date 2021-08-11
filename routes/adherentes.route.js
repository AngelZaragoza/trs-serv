const express = require("express");
const router = express.Router();
// const passport = require("passport");
const authGuard = require("../lib/authguard"); //Chequeo antes de cada peticion

const adherentesController = require("../controllers/adherentes.controller");
const personasController = require("../controllers/personas.controller");

router.route("/").get(authGuard, adherentesController.listaAdherentes);
router
  .route("/detalle/:id")
  .get(authGuard, adherentesController.detalleAdherente)
  .put(authGuard, personasController.updatePersona)
  .patch(authGuard, adherentesController.updateAdherente);

router.route("/nuevo").post(authGuard, adherentesController.nuevoAdherenteFull);

module.exports = router;
