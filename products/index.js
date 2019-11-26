const { ApolloServer, gql } = require("apollo-server");
const mongoFile= require("./config.js");

const typeDefs = gql`
   type Query {
    getSpecificProductByName(name: String=""): Product
  }

   type Mutation {
    addProduct(upc: String, name: String, price: Int, weight: Int): Product!
    deleteProductById(upc:String): [Product]
    updateProductByUPC(upc:String,Newname:String,Newprice:Int,Newweight:Int): Product!
  }

  type Product {
    upc: String!
    name: String!
    price: Int
    weight: Int
  }
`;

const resolvers = {
    Query: {
      getSpecificProductByName(_, args) {
        return getProductByName(args.name);
      }
  },
  Mutation:{
    addProduct(_,args){
    var myobj = {upc:args.upc,name:args.name,price:args.price,weight:args.weight};
    return addProductToDb(myobj);
    },
    updateProductByUPC(_,args){
      return updateProductByUPC(args.upc,args.Newname,args.Newprice,args.Newweight);
    },
    deleteProductById(_,args){
      return deleteProductByIdFromDb(args.upc);
    }
  }
};

mongoFile.startMongo();

const server = new ApolloServer({
      typeDefs,
      resolvers
});

server.listen({ port: 4014 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});


//mutations and products based operations start here

async function addProductToDb(myobj) {
 
  await db.collection('products').insert(myobj);
  return  getProductByName(myobj.name);
}

async function getProductByName(val) {
 var product = await db.collection('products').findOne({name:val});
 console.log(product);
  return product;
  
}

async function getAllProductsInDb(){
  
  var prds =  await db.collection('products').find().toArray();
  var arr = [];
  for(var i=0;i<prds.length;i++){
    var product = {upc:prds[i].upc, name: prds[i].name, price: prds[i].price,weight: prds[i].weight};
    arr.push(product);
  }
  return arr;
}

async function updateProductByUPC(upcval,nameval,priceval,weightval){
  db.collection('products').updateOne({upc:upcval},{$set:{name:nameval,price:priceval,weight:weightval}});
  return getProductByName(nameval);
}

async function deleteProductByIdFromDb(uidval){
  db.collection('products').remove({upc:uidval});
  return getAllProductsInDb();
}