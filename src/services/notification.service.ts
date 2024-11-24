import { INotificationDocument } from '../interfaces/notification.interface';
import { NotificationModel } from '../models/notification';
import { Model } from 'sequelize';

export async function createNotificationGroup(data: INotificationDocument): Promise<INotificationDocument> {
  try {
    const result: Model = await NotificationModel.create(data);
    return result.dataValues;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getSingleNotificationGroup(notificationId: number): Promise<INotificationDocument> {
  try {
    const notifications: INotificationDocument = (await NotificationModel.findOne({
      raw: true,
      where: {
        id: notificationId
      },
      order: [['createdAt', 'DESC']]
    })) as unknown as INotificationDocument;
    return notifications;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function getAllNotificationGroups(userId: number): Promise<INotificationDocument[]> {
  try {
    const notifications: INotificationDocument[] = (await NotificationModel.findAll({
      raw: true,
      where: {
        userId
      },
      order: [['createdAt', 'DESC']]
    })) as unknown as INotificationDocument[];
    return notifications;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function updateNotificationGroup(notificationId: number, data: INotificationDocument): Promise<void> {
  try {
    await NotificationModel.update(data, {
      where: { id: notificationId }
    });
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}

export async function deleteNotificationGroup(notificationId: number): Promise<void> {
  try {
    await NotificationModel.destroy({
      where: { id: notificationId }
    });
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
}
