const express = require("express");
const router = express.Router();
const passport = require("passport");
const authGuard = require("../lib/authguard"); //Chequeo antes de cada peticion

const usuariosController = require("../controllers/usuarios.controller");
const personasController = require("../controllers/personas.controller");

//Realiza un chequeo especial al momento de intentar un login
function checkUser(req, res, next) {
  console.log("Desde la prueba de login:");
  let logged = req.isAuthenticated();
  if (logged) {
    if(req.user.alias == req.body.usuario) {
      //Si está logueado Y el nombre de usuario es el mismo, redirige devolviendo usuario logueado
      res.redirect("isauth");
    } else {
      //Si está logueado PERO el nombre de usuario es distinto, redirige a intentar un nuevo login
      console.log("Intentando nueva sesión... next");
      next();
    }
  } else {
    //Si no está logueado, redirige a intentar un nuevo login
    console.log("Debe Loguear... next");    
    next();
  }
}

//Rutas con passport implementado
router.route("/").get(authGuard, usuariosController.listaUsuarios);
router
  .route("/detalle/:id")
  .get(authGuard, usuariosController.detalleUsuario)
  .put(authGuard, personasController.updatePersona)
  .patch(authGuard, usuariosController.updateUsuario);
  
router.route("/roles").get(authGuard, usuariosController.listaRoles);

router.route("/nuevo").post(authGuard, usuariosController.nuevoUsuarioFull);

router.route("/isauth").get(authGuard, usuariosController.loginSuccess);

router.route("/passportLogin").post(
  checkUser,
  passport.authenticate("local", {
    failureRedirect: "login-failed",
  }),
  function (req, res) {
    let { password, ...userSinPass } = req.user;
    console.log("Desde Passport authenticate:");

    console.log(req.session.id, userSinPass, req.session.cookie);
    res.status(200).json({ logged: true, ...userSinPass });
  }
);

router.route("/login-failed").get(usuariosController.loginFailed);
router.route("/passportLogout").get(usuariosController.logoutUsuario);

// router.route('/q/').get(usuariosController.getUsuarioByAlias);
// router.route('/q/').get(usuariosController.getUsuarioAlias);


module.exports = router;
