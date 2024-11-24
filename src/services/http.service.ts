
import dayjs from 'dayjs';
import { Model, Op } from 'sequelize';
import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { HttpModel } from '../models/http';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import { appTimeZone } from '../utils/helpers';
import { startSingleJob } from '../utils/jobs';
import { httpMonitor } from '../monitors/http.monitor';

export const createHttpHeartBeat = async (data: IHeartbeat): Promise<IHeartbeat> => {
  try {
    const result: Model = await HttpModel.create(data);
    return result.dataValues;
  } catch (error) {
     if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const getHttpHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = (dayjs.utc()).toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartbeat[] = await HttpModel.findAll({
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

export const httpStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
  const httpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    httpAuthMethod: monitor.httpAuthMethod,
    basicAuthUser: monitor.basicAuthUser,
    basicAuthPass: monitor.basicAuthPass,
    url: monitor.url,
    method: monitor.method,
    headers: monitor.headers,
    body: monitor.body,
    timeout: monitor.timeout,
    redirects: monitor.redirects,
    bearerToken: monitor.bearerToken
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () => httpMonitor.start(httpMonitorData));
};
