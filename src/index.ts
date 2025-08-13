import "reflect-metadata"; 
import express from "express";
import { AppDataSource } from "./data-source";
import app from './app';

AppDataSource.initialize()
  .then(() => {
    console.log('Base de datos conectada');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar la base de datos:', error);
  });

