import { INotificationDocument } from '../interfaces/notification.interface';
import { sequelize } from '../shared/db';
import { DataTypes, ModelDefined, Optional } from 'sequelize';

import { UserModel } from './user';

type NotificationCreationAttributes = Optional<INotificationDocument, 'id' | 'createdAt'>;

const NotificationModel: ModelDefined<INotificationDocument, NotificationCreationAttributes> = sequelize.define(
  'notifications',
  {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: UserModel,
        key: 'id'
      }
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emails: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    }
  },
  {
    indexes: [
      {
        fields: ['userId']
      }
    ]
  }
) as ModelDefined<INotificationDocument, NotificationCreationAttributes>;

export { NotificationModel };
