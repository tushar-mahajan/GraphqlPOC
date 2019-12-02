const { ApolloServer, gql } = require("apollo-server");
const mongofile = require("./config.js");
const {makeExecutableSchema,mergeSchemas} = require('graphql-tools');

const reviewSchema = makeExecutableSchema({
  typeDefs : gql`
  type Review  {
    rid: ID!
    rating: Int
    comments: String
    authorId: String
    productId: String
  }

   type Query{
    getReviewsByAuthorId(userId: String=""): [Review]
    getReviewsByProductId(productId: String=""): [Review]
    
  }

   type Mutation{
    addReview(rid:String, rating:Int, comments:String, authorID:String, productId:String) : Review!
    deleteReviewByAuthorId(userId:String=""): [Review]
    updateReviewByAuthorId(userId:String="",newRating:Int=0,newComment:String=""): Review!
  }
`});

const schema = mergeSchemas({
  schemas:[reviewSchema],
  resolvers : {
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
}
})


const server = new ApolloServer({
      schema
});


//start mongodb connection here
mongofile.startMongo();

server.listen({ port: 4015 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});


// implementations to mutations and queries begin here

async function getReviewsByAuthorIdFromDb(val){
  console.log(val + "is value of author ID ");
  return await db.collection('review').find({authorId:val}).toArray();
  
}

async function getReviewsByProductIdFromDb(val){
  return await db.collection('review').find({productId:val}).toArray();
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