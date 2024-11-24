import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import { MongoModel } from '../models/mongo';
import { mongoMonitor } from '../monitors/mongo.monitor';
import { startSingleJob } from '../utils/jobs';
import { appTimeZone } from '../utils/helpers';
import dayjs from 'dayjs';
import { Model, Op } from 'sequelize';

export const createMongoHeartBeat = async (data: IHeartbeat): Promise<IHeartbeat> => {
  try {
    const result: Model = await MongoModel.create(data);
    return result.dataValues;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const getMongoHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = (dayjs.utc()).toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartbeat[] = await MongoModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          { monitorId },
          {
            timestamp: {
              [Op.gte]: dateTime
            }
          }
        ]
      },
      order: [
        ['timestamp', 'DESC']
      ]
    }) as unknown as IHeartbeat[];
    return heartbeats;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const mongoStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
  const mongoMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () => mongoMonitor.start(mongoMonitorData));
};
