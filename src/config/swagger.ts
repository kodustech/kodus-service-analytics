import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Kodus Engineering Analytics API",
    version: "0.0.1",
    description: "Documentação da API de Engineering Analytics da Kodus.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor de Desenvolvimento",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "Adicione sua API key no header usando x-api-key"
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"], // Caminho para os arquivos com as anotações
};

export const swaggerSpec = swaggerJSDoc(options);
