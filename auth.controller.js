"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const data_source_1 = require("../data-source");
const user_1 = require("../entities/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_aqui';
const userRepository = data_source_1.AppDataSource.getRepository(user_1.User);
class authController {
    static async register(req, res) {
        try {
            const { email, password, phoneNumber, fullName } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email y password son requeridos' });
            }
            const existingUser = await userRepository.findOne({ where: [{ email }, { phoneNumber }] });
            if (existingUser) {
                return res.status(409).json({ message: 'Usuario ya registrado' });
            }
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            const user = userRepository.create({
                email,
                password: hashedPassword,
                phoneNumber,
                fullName,
            });
            await userRepository.save(user);
            res.status(201).json({ message: 'Usuario registrado' });
        }
        catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    static async login(req, res) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                return res.status(400).json({ message: 'Identificador y password son requeridos' });
            }
            const user = await userRepository.findOne({
                where: [{ email: identifier }, { phoneNumber: identifier }],
            });
            if (!user)
                return res.status(401).json({ message: 'Usuario no encontrado' });
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid)
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token });
        }
        catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
exports.authController = authController;
