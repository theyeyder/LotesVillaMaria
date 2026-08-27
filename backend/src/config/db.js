import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI no está definida en el archivo .env"
      );
    }

    const conexion = await mongoose.connect(mongoUri);

    console.log(
      `MongoDB conectado: ${conexion.connection.name}`
    );
  } catch (error) {
    console.error(
      "Error conectando a MongoDB:",
      error.message
    );

    process.exit(1);
  }
};