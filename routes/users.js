const express = require('express'); 
const router = express.Router();  

router.get('/', (req, res) => {
    res.send("User List")
});

router.get('/', (req, res) => {
    res.send("Create User")
});

router
.route('/:id')
.get((req, res) => {
    res.send(`Get User ${req.params.id}`)
})
.put((req, res) => {
    res.send(`Update User ${req.params.id}`)
})
.delete((req, res) => {
    res.send(`Delete User ${req.params.id}`)
})

//middleware
router.param("id", (req, res, next, id)=>{
    console.log(id)
})

module.exports = router;