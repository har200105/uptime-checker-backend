import { Model, Op } from 'sequelize';
import { getSingleNotificationGroup } from '../services/notification.service';
import { ISSLMonitorDocument } from '../interfaces/ssl.interface';
import { SSLModel } from '../models/ssl';
import { startSingleJob } from '../utils/jobs';
import { appTimeZone } from '../utils/helpers';
import { sslMonitor } from '../monitors/ssl.monitor';


export const createSSLMonitor = async (data: ISSLMonitorDocument): Promise<ISSLMonitorDocument> => {
  try {
    const result: Model = await SSLModel.create(data);
    return result.dataValues;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getUserSSLMonitors = async (userId: number, active?: boolean): Promise<ISSLMonitorDocument[]> => {
  try {
    const monitors: ISSLMonitorDocument[] = (await SSLModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          {
            userId,
            ...(active && {
              active: true
            })
          }
        ]
      },
      order: [['createdAt', 'DESC']]
    })) as unknown as ISSLMonitorDocument[];
    return monitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getUserActiveSSLMonitors = async (userId: number): Promise<ISSLMonitorDocument[]> => {
  try {
    const monitors: ISSLMonitorDocument[] = await getUserSSLMonitors(userId, true);
    return monitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getAllUsersActiveSSLMonitors = async (): Promise<ISSLMonitorDocument[]> => {
  try {
    const monitors: ISSLMonitorDocument[] = (await SSLModel.findAll({
      raw: true,
      where: { active: true },
      order: [['createdAt', 'DESC']]
    })) as unknown as ISSLMonitorDocument[];
    return monitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const getSSLMonitorById = async (monitorId: number): Promise<ISSLMonitorDocument> => {
  try {
    const monitor: ISSLMonitorDocument = (await SSLModel.findOne({
      raw: true,
      where: { id: monitorId }
    })) as unknown as ISSLMonitorDocument;
    let updatedMonitor: ISSLMonitorDocument = { ...monitor };
    const notifications = await getSingleNotificationGroup(updatedMonitor.notificationId!);
    updatedMonitor = { ...updatedMonitor, notifications };
    return updatedMonitor;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const toggleSSLMonitor = async (monitorId: number, userId: number, active: boolean): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.update(
      { active },
      {
        where: {
          [Op.and]: [{ id: monitorId }, { userId }]
        }
      }
    );
    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
    return result;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const updateSingleSSLMonitor = async (monitorId: number, userId: number, data: ISSLMonitorDocument): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.update(
      data,
      {
        where: { id: monitorId }
      }
    );
    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
    return result;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const updateSSLMonitorInfo = async (monitorId: number, infoData: string): Promise<void> => {
  try {
    await SSLModel.update(
      { info: infoData },
      {
        where: { id: monitorId }
      }
    );
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const deleteSingleSSLMonitor = async (monitorId: number, userId: number): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.destroy({
      where: { id: monitorId }
    });
    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const sslStatusMonitor = (monitor: ISSLMonitorDocument, name: string): void => {
  const sslData: ISSLMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url
  } as ISSLMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () => sslMonitor.start(sslData));
};
