import { IMonitorDocument } from '../interfaces/monitor.interface';
import { MonitorModel } from '../models/monitor';
import { Model, Op } from 'sequelize';
import dayjs from 'dayjs';
import { toLower } from 'lodash';
import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { getSingleNotificationGroup } from '../services/notification.service';
import { uptimePercentage } from '../utils/helpers';
import { HttpModel } from '../models/http';
import { MongoModel } from '../models/mongo';
import { RedisModel } from '../models/redis';
import { TcpModel } from '../models/tcp';

import { getHttpHeartBeatsByDuration, httpStatusMonitor } from './http.service';
import { getMongoHeartBeatsByDuration, mongoStatusMonitor } from './mongo.service';
import { getRedisHeartBeatsByDuration, redisStatusMonitor } from './redis.service';
import { getTcpHeartBeatsByDuration, tcpStatusMonitor } from './tcp.service';

const HTTP_TYPE = 'http';
const TCP_TYPE = 'tcp';
const MONGO_TYPE = 'mongodb';
const REDIS_TYPE = 'redis';


export const createMonitor = async (data: IMonitorDocument): Promise<IMonitorDocument> => {
  try {
    const result: Model = await MonitorModel.create(data);
    return result.dataValues;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getUserMonitors = async (userId: number, active?: boolean): Promise<IMonitorDocument[]> => {
  try {
    const monitors: IMonitorDocument[] = (await MonitorModel.findAll({
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
    })) as unknown as IMonitorDocument[];
    return monitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getUserActiveMonitors = async (userId: number): Promise<IMonitorDocument[]> => {
  try {
    let heartbeats: IHeartbeat[] = [];
    const updatedMonitors: IMonitorDocument[] = [];
    const monitors: IMonitorDocument[] = await getUserMonitors(userId, true);
    for (let monitor of monitors) {
      const group = await getSingleNotificationGroup(monitor.notificationId!);
      heartbeats = await getHeartbeats(monitor.type, monitor.id!, 24);
      const uptime: number = uptimePercentage(heartbeats);
      monitor = {
        ...monitor,
        uptime,
        heartbeats: heartbeats.slice(0, 16),
        notifications: group
      };
      updatedMonitors.push(monitor);
    }
    return updatedMonitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getAllUsersActiveMonitors = async (): Promise<IMonitorDocument[]> => {
  try {
    const monitors: IMonitorDocument[] = (await MonitorModel.findAll({
      raw: true,
      where: { active: true },
      order: [['createdAt', 'DESC']]
    })) as unknown as IMonitorDocument[];
    return monitors;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const getMonitorById = async (monitorId: number): Promise<IMonitorDocument> => {
  try {
    const monitor: IMonitorDocument = (await MonitorModel.findOne({
      raw: true,
      where: { id: monitorId }
    })) as unknown as IMonitorDocument;
    let updatedMonitor: IMonitorDocument = { ...monitor };
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


export const toggleMonitor = async (monitorId: number, userId: number, active: boolean): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(
      { active },
      {
        where: {
          [Op.and]: [{ id: monitorId }, { userId }]
        }
      }
    );
    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const updateSingleMonitor = async (monitorId: number, userId: number, data: IMonitorDocument): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(
      data,
      {
        where: { id: monitorId }
      }
    );
    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const updateMonitorStatus = async (monitor: IMonitorDocument, timestamp: number, type: string): Promise<IMonitorDocument> => {
  try {
    const now = timestamp ? dayjs(timestamp).toDate() : dayjs().toDate();
    const { id, status } = monitor;
    const updatedMonitor: IMonitorDocument = {...monitor};
    updatedMonitor.status = type === 'success' ? 0 : 1;
    const isStatus = type === 'success' ? true : false;
    if (isStatus && status === 1) {
      updatedMonitor.lastChanged = now;
    } else if (!isStatus && status === 0) {
      updatedMonitor.lastChanged = now;
    }
    await MonitorModel.update(updatedMonitor, { where: {id }});
    return updatedMonitor;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};


export const deleteSingleMonitor = async (monitorId: number, userId: number, type: string): Promise<IMonitorDocument[]> => {
  try {
    await deleteMonitorTypeHeartbeats(monitorId, type);
    await MonitorModel.destroy({
      where: { id: monitorId }
    });
    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

type MonitorType = 'http' | 'tcp' | 'mongodb' | 'redis';

type HeartbeatFetcher = (monitorId: number, duration: number) => Promise<IHeartbeat[]>;

const heartbeatFetchers: Record<MonitorType, HeartbeatFetcher> = {
  http: getHttpHeartBeatsByDuration,
  tcp: getTcpHeartBeatsByDuration,
  mongodb: getMongoHeartBeatsByDuration,
  redis: getRedisHeartBeatsByDuration,
};

export const getHeartbeats = async (type: string, monitorId: number, duration: number): Promise<IHeartbeat[]> => {
  const fetcher = heartbeatFetchers[type as MonitorType];
  if (fetcher) {
    return await fetcher(monitorId, duration);
  } else {
    console.error(`No heartbeat fetcher found for monitor type: ${type}`);
    return [];
  }
};

const monitorHandlers = {
  'http': (monitor: IMonitorDocument, name: string) => httpStatusMonitor(monitor, toLower(name)),
  'tcp': (monitor: IMonitorDocument, name: string) => tcpStatusMonitor(monitor, toLower(name)),
  'mongodb': (monitor: IMonitorDocument, name: string) => mongoStatusMonitor(monitor, toLower(name)), // Changed 'mongo' to 'mongodb'
  'redis': (monitor: IMonitorDocument, name: string) => redisStatusMonitor(monitor, toLower(name)),
};



export const startCreatedMonitors = (monitor: IMonitorDocument, name: string, type: MonitorType): void => {
  const handler = monitorHandlers[type];
  if (handler) {
    handler(monitor, name);
  } else {
    console.error(`No handler found for monitor type: ${type}`);
  }
};

const deleteMonitorTypeHeartbeats = async (monitorId: number, type: string): Promise<void> => {
  let model = null;
  if (type === HTTP_TYPE) {
    model = HttpModel;
  }
  if (type === MONGO_TYPE) {
    model = MongoModel;
  }
  if (type === REDIS_TYPE) {
    model = RedisModel;
  }
  if (type === TCP_TYPE) {
    model = TcpModel;
  }

  if (model !== null) {
    await model.destroy({
      where: { monitorId }
    });
  }
};
