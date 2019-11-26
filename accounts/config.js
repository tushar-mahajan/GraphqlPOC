const { MongoClient } = require('mongodb');

async function startMongo() {  
    const MONGO_DB = "mongodb://localhost:27017/GraphqlPOC";
  
  try {
    const client = await MongoClient.connect(MONGO_DB, { useNewUrlParser: true })
    db = client.db()
  } catch (error) {
    console.log(`
    
      Mongo DB Host not found!
      please add DB_HOST environment variable to .env file
  
      exiting...
       
    `)
    process.exit(1)
  }
  }


module.exports = {
    startMongo:startMongo
} 