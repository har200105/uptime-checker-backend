import { IHeartbeat, IHeartBeatArgs } from "../../interfaces/heartbeat.interface";
import { AppContext } from "../../interfaces/monitor.interface";
import { getHeartbeats as getHeartbeatsNew } from "../../services/monitor.service";
import { authenticateGraphQLRoute } from "../../utils/helpers";


export const HeartbeatResolver = {
  Query: {
    async getHeartbeats(_: undefined, args: IHeartBeatArgs, contextValue: AppContext) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      const { type, monitorId, duration } = args;
      const heartbeats: IHeartbeat[] = await getHeartbeatsNew(type, parseInt(monitorId), parseInt(duration));
      return {
        heartbeats
      };
    }
  },
  HeartBeat: {
    timestamp: (heartbeat: IHeartbeat) => JSON.stringify(heartbeat.timestamp)
  }
};
