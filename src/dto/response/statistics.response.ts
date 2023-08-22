import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';

export class StatisticsPlaylistResponse {
  @ApiProperty({
    description: 'Добавленные',
    type: 'number',
  })
  added!: number;

  @ApiProperty({
    description: 'Запущенные',
    type: 'number',
  })
  played!: number;
}

export class StatisticsMonitorsResponse {
  @ApiProperty({
    description: 'Кол-во устройств с заявками на трансляции',
    type: 'number',
  })
  online!: number;

  @ApiProperty({
    description: 'Кол-во устройств с заявками, но выключенные',
    type: 'number',
  })
  offline!: number;

  @ApiProperty({
    description: 'Кол-во устройств без заявок',
    type: 'number',
  })
  empty!: number;
}

export class StorageSpaceResponse {
  @ApiProperty({
    description: 'Занятое место',
    type: 'number',
  })
  used!: number;

  @ApiProperty({
    description: 'Максимальное место',
    type: 'number',
  })
  total!: number;
}

export class StatisticsResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Количество устройств',
    type: 'number',
  })
  countDevices!: number;

  @ApiProperty({
    description: 'Плейлисты',
    type: () => StatisticsPlaylistResponse,
  })
  playlists!: StatisticsPlaylistResponse;

  @ApiProperty({
    description: 'Статистика мониторов',
    type: () => StatisticsMonitorsResponse,
  })
  monitors!: StatisticsMonitorsResponse;

  @ApiProperty({
    description: 'Дисковое пространство',
    type: () => StorageSpaceResponse,
  })
  storageSpace!: StorageSpaceResponse;
}
