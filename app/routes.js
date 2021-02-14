const router = require('express').Router();
const homeC = require("../src/controllers/HomeController");

router.get("/test",function(req,res,next){
    res.send("test");
});

router.get("/",homeC.index);

module.exports = router;