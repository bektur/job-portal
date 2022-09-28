// setup mongoose connection
const mongoose = require('mongoose');
const ATLAS_URI = process.env.ATLAS_URI;
const InitiateMongoServer = async () => {
    try {
        await mongoose.connect(ATLAS_URI, {
            useNewUrlParser: true, 
            useUnifiedTopology: true
        }); 
        console.log('Databse connected successfully');
    } catch (e) {
        console.log(e);
        throw e;
    }
}

module.exports = InitiateMongoServer;


