import { ApiProperty } from '@nestjs/swagger';

export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class LimitOrderRequest<T = Record<string, 'DESC' | 'ASC'>> {
  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  id?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  name?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  description?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  extension?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  width?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  height?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  folder?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  folderId?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  monitor?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  monitorId?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  videoType?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  filesize?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  category?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  duration?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  files?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  monitors?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  playlists?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  parentFolder?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  parentFolderId?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  email?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  surname?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  middleName?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  phoneNumber?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  city?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  country?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  company?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  role?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  verified?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  isDemoUser?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  countUsedSpace?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  address?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  price?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  orientation?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  monitorInfo?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  attached?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  code?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  status?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  longitude?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  latitude?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  renderingStatus?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  fps?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  renderingPercent?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  renderingError?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  renderedFile?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  renderedFileId?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  keepSourceAudio?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  totalDuration?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  videoLayers?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  audioLayers?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  createdAt?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  updatedAt?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  seller?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  buyer?: Order;

  @ApiProperty({
    enum: Order,
    enumName: 'Order',
    required: false,
  })
  playlist?: Order;
}
