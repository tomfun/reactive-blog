import express from 'express';
let router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('dashboard/index', {
    title: 'Express'
  });
});
router.get('/login', function (req, res, next) {
  res.render('dashboard/login', {
    title: 'Express'
  });
});

export default router;
