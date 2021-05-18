const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator');
const validInfo = require('../middleware/validInfo');
const authorization = require('../middleware/authorization');

//register

router.post('/register', validInfo, async (req, res) => {
    try {
        
        const { name, email, password } = req.body;
        
        const user = await pool.query('SELECT * FROM users WHERE user_email = $1', [email]);
        
        if (user.rows.length !== 0) {
            return res.status(401).send('User already exists');
        };
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword =  await bcrypt.hash(password, salt);
        const newUser = await pool.query("INSERT INTO users (user_name, user_email, user_password) VALUES ($1, $2, $3) RETURNING *", [name, email, bcryptPassword]);
        
        const token = jwtGenerator(newUser.rows[0].user_id);

        const userID = newUser.rows[0].user_id;
        const userName = newUser.rows[0].user_name;
        res.json({ token, userID, userName })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

//login

router.post('/login', validInfo, async (req, res) => {
    try {

        const { email, password } = req.body;
        const user  = await pool.query('SELECT * FROM users WHERE user_email = $1', [
            email
        ]);
        if (user.rows.length === 0) {
            return res.status(401).json('Password or email is incorrect');
        }
        const validPassword = await bcrypt.compare(password, user.rows[0].user_password);
        if (!validPassword) {
            return res.status(401).json('Password or email is incorrect'); 
        }
        const token = jwtGenerator(user.rows[0].user_id);
        const userID = user.rows[0].user_id;
        const userName = user.rows[0].user_name;
        res.json({ token, userID, userName })
        

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

//check token after refresh

router.get('/is-verify', authorization, async (req, res) => {
    try {
        res.json(true);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
});

module.exports = router;