import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId, role) => {
    return jwt.sign(
        {
            userId,
            role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d",
        }
    );
};