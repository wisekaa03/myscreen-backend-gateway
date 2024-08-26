import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
} from 'typeorm';

import { UserExtView } from './user-ext.view';
import { UserPlanEnum } from '@/enums';
import dayjs from 'dayjs';

@EventSubscriber()
export class UserExtSubscriber
  implements EntitySubscriberInterface<UserExtView>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return UserExtView;
  }

  entity(entity: UserExtView): UserExtView {
    const {
      surname,
      name,
      middleName,
      onlineMonitors,
      offlineMonitors,
      emptyMonitors,
      countMonitors,
      playlistAdded,
      playlistBroadcast,
      countUsedSpace,
      storageSpace,
      monthlyPayment,
      walletSum,
      refreshTokenLastLoginUpdatedAt,
      refreshTokenLastLoginUserAgent,
      createdAt = Date.now(),
    } = entity;

    entity.fullName = [surname, name, middleName].filter((x) => x).join(' ');
    entity.fullNameEmail = `${entity.fullName} <${entity.email}>`;

    entity.lastEntry = {
      userAgent: refreshTokenLastLoginUserAgent,
      at: refreshTokenLastLoginUpdatedAt,
    };

    delete entity.refreshTokenLastLoginUpdatedAt;
    delete entity.refreshTokenLastLoginUserAgent;

    entity.metrics = {
      monitors: {
        online: parseInt(onlineMonitors ?? '0', 10),
        offline: parseInt(offlineMonitors ?? '0', 10),
        empty: parseInt(emptyMonitors ?? '0', 10),
        user: parseInt(countMonitors ?? '0', 10),
      },
      playlists: {
        added: parseInt(playlistAdded ?? '0', 10),
        played: parseInt(playlistBroadcast ?? '0', 10),
      },
      storageSpace: {
        storage:
          typeof countUsedSpace === 'string' ||
          typeof countUsedSpace === 'number'
            ? parseFloat(`${countUsedSpace}`)
            : null,
        total: parseFloat(`${storageSpace}`),
      },
    };

    delete entity.onlineMonitors;
    delete entity.offlineMonitors;
    delete entity.emptyMonitors;
    delete entity.countMonitors;

    delete entity.playlistAdded;
    delete entity.playlistBroadcast;

    delete entity.countUsedSpace;

    if (entity.plan === UserPlanEnum.Demo) {
      const end = dayjs(Date.now()).subtract(14, 'days');
      const duration = dayjs(createdAt).diff(end, 'days');
      entity.planValidityPeriod = duration > 0 ? duration : 0;
    } else if (monthlyPayment) {
      const end = dayjs(Date.now()).subtract(28, 'days');
      const duration = dayjs(monthlyPayment).diff(end, 'days');
      entity.planValidityPeriod = duration > 0 ? duration : 0;
    } else {
      entity.planValidityPeriod = 0;
    }

    delete entity.monthlyPayment;

    entity.wallet = {
      total: parseFloat(walletSum ?? '0'),
    };

    delete entity.walletSum;

    return entity;
  }

  afterLoad(entity: UserExtView) {
    this.entity(entity);
  }
}
