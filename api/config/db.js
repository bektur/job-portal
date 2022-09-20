// setup mongoose connection
const mongoose = require('mongoose');
const ATLAS_URI = "mongodb+srv://root:p6FmOMzF7eBYM9nw@bektur.3rql7.mongodb.net/serverdb?retryWrites=true&w=majority";

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


