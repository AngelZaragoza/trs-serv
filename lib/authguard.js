function checkAuth(req, res, next) {
  console.log("Auth desde => ", req.baseUrl);  
  if (req.isAuthenticated()) {
    console.log("Logueado =>", req.user['usuario_id'], req.user['alias']);    
    next();
  } else {
    console.log("Debe Loguear... ");
    res
      .status(401)
      .json({ logged: false, message: "Para comenzar debe Iniciar Sesión" });
  }
}

module.exports = checkAuth;