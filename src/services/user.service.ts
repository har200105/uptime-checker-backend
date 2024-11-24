import { IUserDocument } from '../interfaces/user.interface';
import { UserModel } from '../models/user';
import { Model, Op } from 'sequelize';
import { omit, toLower, upperFirst } from 'lodash';

export async function createNewUser(data: IUserDocument): Promise<IUserDocument> {
  try {
    const result: Model = await UserModel.create(data);
    const userData: IUserDocument = omit(result.dataValues, ['password']) as IUserDocument;
    return userData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getUserByUsernameOrEmail(username: string, email: string): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [{ username: upperFirst(username) }, { email: toLower(email) }]
      }
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getUserBySocialId(
  socialId: string,
  email: string,
  type: string
): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          {
            ...(type === 'facebook' && {
              facebookId: socialId
            }),
            ...(type === 'google' && {
              googleId: socialId
            })
          },
          { email: toLower(email) }
        ]
      }
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getUserByProp(prop: string, type: string): Promise<IUserDocument | undefined> {
  try {
    const user: IUserDocument | undefined = (await UserModel.findOne({
      raw: true,
      where: {
        ...(type === 'username' && {
          username: upperFirst(prop)
        }),
        ...(type === 'email' && {
          email: toLower(prop)
        })
      }
    })) as unknown as IUserDocument | undefined;
    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}