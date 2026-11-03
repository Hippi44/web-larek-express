import { model, Schema } from 'mongoose';
import validator from 'validator';

interface IRefreshToken {
  token: string;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  tokens: IRefreshToken[];
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  token: { type: String, required: true },
}, { _id: false });

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    minlength: [2, 'Минимальная длина поля "name" — 2'],
    maxlength: [30, 'Максимальная длина поля "name" — 30'],
    default: 'Ё-мое',
  },
  email: {
    type: String,
    required: [true, 'Поле "email" должно быть заполнено'],
    unique: true,
    validate: {
      validator: (value: string) => validator.isEmail(value),
      message: 'Поле "email" должно содержать корректный адрес',
    },
  },
  password: {
    type: String,
    required: [true, 'Поле "password" должно быть заполнено'],
    minlength: [6, 'Минимальная длина поля "password" — 6'],
    select: false,
  },
  tokens: {
    type: [refreshTokenSchema],
    default: [],
    select: false,
  },
}, { versionKey: false });

export default model<IUser>('user', userSchema);
