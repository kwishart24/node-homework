const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node Homework API",
      version: "1.0.0",
      description: "API documentation for users, tasks, and analytics",
    },
    servers: [
      {
        url: "https://node-homework-xzxs.onrender.com",
      },
    ],
  },
  apis: ["./routes/*.js"], // where your route files live
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
