const { ApolloServer, gql } = require("apollo-server");
const mongofile = require("./config.js");
const { buildFederatedSchema } = require('@apollo/federation');

const typeDefs = gql`
   type Review @key(fields:"rid")  {
    rid: ID!
    rating: Int
    comments: String
    authorId: String
    productId: String
  }



   extend type Query{
    getReviewsByAuthorId(userId: String=""): [Review]!
    getReviewsByProductId(productId: String=""): [Review]!
    
  }

   extend type Mutation{
    addReview(rid:String, rating:Int, comments:String, authorID:String, productId:String) : Review!
    deleteReviewByAuthorId(userId:String=""): [Review]
    updateReviewByAuthorId(userId:String="",newRating:Int=0,newComment:String=""): Review!
  }

  extend type Product @key(fields:"upc"){
    upc: String! @external
    addreview(rid:ID!,rating:Int,comments:String,authorId:String): Review @requires(fields: "upc")
  }
`;

const resolvers = {
  Product:{
    addreview:({upc},args) => {
      var obj={rid:args.rid,rating:args.rating,comments:args.comments, authorId:args.authorId, productId:upc};
      console.log("mututation object is :",obj);
      return addReviewToDB(obj);
    },
  },
  Query:{
    getReviewsByAuthorId(_,args){
      return getReviewsByAuthorIdFromDb(args.userId);
    },
    getReviewsByProductId(_,args){
      return getReviewsByProductIdFromDb(args.productId);
    }
  },
  Mutation:{
    addReview(_,args){
        var obj={rid:args.rid,rating:args.rating,comments:args.comments, authorId:args.authorID,
        productId:args.productId};
        return addReviewToDB(obj);
    }, 
    deleteReviewByAuthorId(_,args){
        return deleteReviewByAuthorIdFromDb(args.userId);
    },
    updateReviewByAuthorId(_,args){
        return  updateReviewForUserId(args.userId,args.newRating,args.newComment);
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([
    {
      typeDefs,
      resolvers
    },
  ]),
});



//start mongodb connection here
mongofile.startMongo();

server.listen({ port: 4015 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});


// implementations to mutations and queries begin here

async function getReviewsByAuthorIdFromDb(val){
  const review = await db.collection('review').find({authorId:val}).toArray();
  return review;
}

async function getReviewsByProductIdFromDb(val){
  const review = await db.collection('review').find({productId:val}).toArray();
  return review;
}

async function addReviewToDB(myobj){
  await db.collection('review').insert(myobj);
  return  myobj;
}

async function updateReviewForUserId(authorIdval,ratingval,commentsval){
  await db.collection('review').updateOne({authorId:authorIdval},
  {$set:{rating:ratingval,comments:commentsval}});

  return getReviewsByAuthorIdFromDb(authorIdval);
}

async function deleteReviewByAuthorIdFromDb(authorId){
  await db.collection('review').remove({'authorId':authorId});
  return await db.collection('review').find().toArray();
}