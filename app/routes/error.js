const express = require('express');
const router = express.Router();

router.get('/error', (req, res) => {
    res.render('error', {
        title: 'Error',
        message: "Page not found."
    });
});

router.use(next => {
    let err = {
        message: 'Page not found.',
        status: 404
    };
    next(err);
});

router.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error', {
        pageID: 'error',
        title: 'Error 500',
        message: 'Page not found.'
    });
    next();
});

module.exports = router;
