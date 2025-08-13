"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_source_1 = require("../data-source");
const user_1 = require("../entities/user");
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_secreto';
const userRepository = data_source_1.AppDataSource.getRepository(user_1.User);
class AuthController {
    static async login(req, res) {
        const { identifier, password } = req.body;
        if (!(identifier && password)) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }
        try {
            const user = await userRepository.findOne({
                where: [{ email: identifier }, { phoneNumber: identifier }]
            });
            if (!user) {
                return res.status(401).json({ message: 'Usuario no encontrado' });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token });
        }
        catch (error) {
            res.status(500).json({ message: 'Error interno' });
        }
    }
}
exports.AuthController = AuthController;
