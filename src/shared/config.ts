
import dotenv from 'dotenv';

dotenv.config({});


export const POSTGRES_DB = process.env.POSTGRES_DB as string;
export const NODE_ENV = process.env.NODE_ENV as string;
export const SECRET_KEY_ONE = process.env.SECRET_KEY_ONE as string;
export const SECRET_KEY_TWO = process.env.SECRET_KEY_TWO as string;
export const JWT_TOKEN = process.env.JWT_TOKEN as string;
export const SENDER_EMAIL = process.env.SENDER_EMAIL as string;
export const SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD as string;
export const CLIENT_URL = process.env.CLIENT_URL as string;
export const PORT = process.env.PORT;
