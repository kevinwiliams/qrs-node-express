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
// Set up session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Custom middleware to make session object available globally
app.use((req, res, next) => {
    // Attach session object to res.locals
    res.locals.session = req.session;
    next();
});

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
        formatTimeDate: function(date) {
            return moment(date).format('DD-MMM-YYYY h:mmA');
        },
        eq: function(arg1, arg2, options) {
            return Handlebars.helpers.eq(arg1, arg2, options);
        },
        ne: function(arg1, arg2, options) {
            return Handlebars.helpers.ne(arg1, arg2, options);
        },
        and: function(arg1, arg2, options) {
            return Handlebars.helpers.and(arg1, arg2, options);
        },
        or: function(arg1, arg2, options) {
            return Handlebars.helpers.or(arg1, arg2, options);
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
        },
        isAuthenticated : function(){
            const session = this.session; // Assuming session is available in res.locals
            if(session)
                return session.isAuthenticated;
        },
        isInRole : (role) => {
            const session = this.session; // Assuming session is available in res.locals
            if (session && session.user && session.user.role === role) {
                return true; // Render the block if the user is in the specified role
            } else {
                return false; // Render the else block if the user is not in the specified role
            }
        }
    }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');


// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Connect to database
connectDB();

// Define routes
app.get('/', (req, res) => {
    res.redirect('/auth/login');
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
