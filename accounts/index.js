const { ApolloServer, gql } = require("apollo-server");
const mongoFile= require("./config.js");
const {makeExecutableSchema,mergeSchemas} = require('graphql-tools');

const userSchema = makeExecutableSchema({
  typeDefs: gql`
   type Query {
    getUserbyId(uid:String=""): User!
    getUserbyEmail(email:String=""): User!
  }

   type Mutation {
    addUser(uid: String, name: String, email: String, username: String): User!
    updateUserById(uid:String,newName:String,NewEmail:String):User!
    deleteUserbyUid(uid:String):[User]
  }

  type User {
    uid: ID!
    name: String
    email: String
    username: String
  }
`});


const schema = mergeSchemas({
schemas:[userSchema],
 resolvers : {
  Query: {
    getUserbyId(_,args) {
          return returnUserByUid(args.uid);
    },
    getUserbyEmail(_,args){
          return returnUserByEmail(args.email);
    }
  },
  Mutation: {
    addUser(_,args) {
      var myobj = {uid:args.uid, name:args.name, email: args.email, username: args.username};
     return  addUserValues(myobj);
    },
    updateUserById(_,args){
      return updateUserbyUid(args.uid,args.newName,args.NewEmail);
    },
    deleteUserbyUid(_,args){
      return deleteUserbyUid(args.uid);
    }
  }
}

});

const server = new ApolloServer({ schema });


mongoFile.startMongo();


server.listen({ port: 4008 }).then(({ url }) => {
  console.log(` Server ready at ${url}`);
});



// queries and mutation resolvers implementation starts here

async function addUserValues(myobj) {
 
  await db.collection('users').insert(myobj)

  return  myobj;
}

async function returnUserByUid(val) {
 var user = await db.collection('users').findOne({uid:val});
  return user;
}

async function returnUserByEmail(val) {
  var user = await db.collection('users').findOne({email:val});
   return user;
 }

async function deleteUserbyUid(val){
  await db.collection('users').remove({uid:val});
  return await db.collection('users').find().toArray();
}

async function updateUserbyUid(userid,newName,newEmail){
  await db.collection('users').updateOne({uid:userid},{$set:{name:newName,email:newEmail}});
  return returnUserByUid(userid);
}