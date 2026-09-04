import User from "../models/User.js";
import { hashPassword, generateToken, comparePassword } from "../utils/auth.js";
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Name, email, password and role are required",
            });
        }

        if (!["FRONT_DESK", "PROVIDER"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User with this email already exists",
            });
        }

        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role,
        });

        const token = generateToken(user._id, user.role);

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Register error:", error.message);

        return res.status(500).json({
            message: "Server error during registration",
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordCorrect = await comparePassword(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user._id, user.role);

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Server error during login",
        });
    }
};