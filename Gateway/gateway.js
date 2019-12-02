const GraphQLStitcher = require('graphql-stitcher');
const ApolloServer = require('apollo-server-express').ApolloServer;
const express = require('express');
const { introspectSchema, makeRemoteExecutableSchema, mergeSchemas } = require('graphql-tools');

const fetch = require('node-fetch');

const { createHttpLink } = require('apollo-link-http');

const userEndPoint = 'http://localhost:4008/';
const productEndPoint = 'http://localhost:4014/';
const reviewEndPoint = 'http://localhost:4015/'; 


const app = express();
const port = 3001;


(async () => {

    const stitcher = new GraphQLStitcher();
  
    userSchema =  await stitcher.loadRemoteSchema(userEndPoint);
   
    productSchema = await stitcher.loadRemoteSchema(productEndPoint);

    reviewSchema = await stitcher.loadRemoteSchema(reviewEndPoint);

    schema = stitcher.stitch();

     
    
    const userServiceLink = createHttpLink({
      uri: userEndPoint,
      fetch
    });
  
    const productServiceLink = createHttpLink({
      uri: productEndPoint,
      fetch
    });
  
    const reviewServiceLink = createHttpLink({
        uri: reviewEndPoint,
        fetch
    });

    const createUserServiceSchema = async () => {  
      const schema = await introspectSchema(userServiceLink);
  
      return makeRemoteExecutableSchema({
        schema,
        link: userServiceLink
      });
    }
  
    const createProductServiceSchema = async () => {  
      const schema = await introspectSchema(productServiceLink);
  
      return makeRemoteExecutableSchema({
        schema,
        link: productServiceLink
      });
    }
  

  
    const createReviewServiceSchema = async () => {  
        const schema = await introspectSchema(reviewServiceLink);
    
        return makeRemoteExecutableSchema({
          schema,
          link: reviewServiceLink
        });
      }


    const userServiceSchema = await createUserServiceSchema();
    const productServiceSchema = await createProductServiceSchema();
    const reviewServiceSchema = await createReviewServiceSchema();
  
    

    const linkTypeDefs = `

    extend type Review {
      products: Product
      users: User
    }

    extend type Product{
      UserMutation(uid:ID!, name:String, email:String, username:String): User
      ReviewMutation(rid:String, rating:Int, comments:String, authorId:String): Review
    }

    extend type User{
      GetReviews:[Review]
    }
    
       
  `;
    


  const mergedSchema = mergeSchemas({
        schemas: [
          userServiceSchema,
          productServiceSchema,
          reviewServiceSchema,
          linkTypeDefs,
        ],
        resolvers: {
          User:{
              GetReviews:{
                resolve(user, args , context, info) {                  
                return info.mergeInfo.delegateToSchema({
                  schema: reviewServiceSchema,
                  operation: 'query',
                  fieldName: 'getReviewsByAuthorId',
                  args:{
                    userId: user.uid
                  },
                  context,
                  info,
                });
              },
            },
          },
            Review: {
              products: {
                fragment: `... on Review { productId }`,
                resolve(review, args , context, info) {                  
                  return info.mergeInfo.delegateToSchema({
                    schema: productServiceSchema,
                    operation: 'query',
                    fieldName: 'getSpecificProductByUPC',
                    args: {
                      upc: review.productId,
                    },
                    context,
                    info,
                  });
                },
              },
              users: {
                fragment: `... on Review { authorId }`,
                resolve(review, args , context, info) {
                  return info.mergeInfo.delegateToSchema({
                    schema: userServiceSchema,
                    operation: 'query',
                    fieldName: 'getUserbyId',
                    args: {
                      uid: review.authorId,
                    },
                    context,
                    info,
                  });
                },
              }
            },
        Product:{
          UserMutation:{
            resolve(_,args , context, info) {    
              return info.mergeInfo.delegateToSchema({
                schema: userServiceSchema,
                operation: 'mutation',
                fieldName: 'addUser',
                args:{
                  uid: args.uid,
                  name: args.name,
                  email: args.email,
                  username: args.username,
                },
                context,
                info,
              });
            }
          },
          ReviewMutation: { 
            resolve(product, args , context, info) {
              return info.mergeInfo.delegateToSchema({
                schema: reviewServiceSchema,
                operation: 'mutation',
                fieldName: 'addReview',
                args:{
                  rid: args.rid,
                  rating: args.rating,
                  comments: args.comments,
                  authorID: args.authorId,
                  productId: product.upc,
                },
                context,
                info,
              });
            },
          },  
        },
      },    
    });

    
    const server = new ApolloServer({ schema: mergedSchema });
    server.applyMiddleware({ app, path: '/' });

    app.listen(port, () => console.log(`API Gateway listening on port ${port}!`));
    
})().catch((err) => {
    console.error(err);
  });