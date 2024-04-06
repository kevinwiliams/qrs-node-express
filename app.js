require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const { sql, connectDB } = require('./config/db');
const moment = require('moment'); // Import moment for date formatting

const app = express();
// app.enable('view cache');
const port = process.env.PORT || 3000;

const reduceOp = function(args, reducer){
    args = Array.from(args);
    args.pop(); // => options
    var first = args.shift();
    return args.reduce(reducer, first);
  };

Handlebars.registerHelper({
    eq  : function(){ return reduceOp(arguments, (a,b) => a === b); },
    ne  : function(){ return reduceOp(arguments, (a,b) => a !== b); },
    lt  : function(){ return reduceOp(arguments, (a,b) => a  <  b); },
    gt  : function(){ return reduceOp(arguments, (a,b) => a  >  b); },
    lte : function(){ return reduceOp(arguments, (a,b) => a  <= b); },
    gte : function(){ return reduceOp(arguments, (a,b) => a  >= b); },
    and : function(){ return reduceOp(arguments, (a,b) => a  && b); },
    or  : function(){ return reduceOp(arguments, (a,b) => a  || b); },
});
// Set up Handlebars engine
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        formatListDate: function(date) {
            return moment(date).format('DD-MMM-YYYY');
        },
        formatHistDate: function(date) {
            return moment(date).format('DD-MM-YYYY');
        },
        formatPubDate: function(date) {
            return moment(date).format('DD/MM/YYYY');
        },
        formatDBDate: function(date) {
            return moment(date).format('YYYY-MM-DD');
        },
        eq: function(arg1, arg2, options) {
            return Handlebars.helpers.eq(arg1, arg2, options);
        },
        ne: function(arg1, arg2, options) {
            return Handlebars.helpers.ne(arg1, arg2, options);
        },
        validationMessage : function(field, errors) {
            let errorMessage = '';
            if (errors) {
                errors.forEach(error => {
                    if (error.field === field) {
                        errorMessage = error.msg;
                    }
                });
            }
            return new Handlebars.SafeString(`<p class="invalid-feedback">${errorMessage}</p>`);
        }
    }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');


// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Connect to database
connectDB();

// Define routes
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layout',
        pageTitle: 'Home Page',
        text: 'World'
    });
});

// Import and use route handlers
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

const userRouter = require('./routes/users')
app.use('/users', userRouter)

const retailerRouter = require('./routes/retailer')
app.use('/retailer', retailerRouter)

const distributionRouter = require('./routes/distribution')
app.use('/distribution', distributionRouter)

const activityRouter = require('./routes/activity')
app.use('/activity', activityRouter)

const reportRouter = require('./routes/report')
app.use('/report', reportRouter)
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
