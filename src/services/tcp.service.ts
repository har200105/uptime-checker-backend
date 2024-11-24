import { IHeartbeat } from '../interfaces/heartbeat.interface';
import { IMonitorDocument } from '../interfaces/monitor.interface';
import { TcpModel } from '../models/tcp';
import { tcpMonitor } from '../monitors/tcp.monitor';
import { startSingleJob } from '../utils/jobs';
import { appTimeZone } from '../utils/helpers';
import dayjs from 'dayjs';
import { Model, Op } from 'sequelize';

export const createTcpHeartBeat = async (data: IHeartbeat): Promise<IHeartbeat> => {
  try {
    const result: Model = await TcpModel.create(data);
    return result.dataValues;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error('An unknown error occurred');
    }
  }
};

export const getTcpHeartBeatsByDuration = async (monitorId: number, duration = 24): Promise<IHeartbeat[]> => {
  try {
    const dateTime: Date = (dayjs.utc()).toDate();
    dateTime.setHours(dateTime.getHours() - duration);
    const heartbeats: IHeartbeat[] = await TcpModel.findAll({
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

export const tcpStatusMonitor = (monitor: IMonitorDocument, name: string): void => {
  const tcpMonitorData: IMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
    port: monitor.port,
    timeout: monitor.timeout
  } as IMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () => tcpMonitor.start(tcpMonitorData));
};
