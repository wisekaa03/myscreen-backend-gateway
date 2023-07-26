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

export class StorageSpaceResponse {
  @ApiProperty({
    description: 'Добавленные медиа',
    type: 'number',
  })
  used!: number;

  @ApiProperty({
    description: 'Максимальное место',
    type: 'number',
  })
  unused!: number;
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
    description: 'Дисковое пространство',
    type: () => StorageSpaceResponse,
  })
  storageSpace!: StorageSpaceResponse;
}
