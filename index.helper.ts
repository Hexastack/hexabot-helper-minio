/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { createReadStream } from 'fs';
import { PassThrough, Readable, Stream } from 'stream';

import { Injectable, OnModuleInit, StreamableFile } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as Minio from 'minio';

import {
  AttachmentCreateDto,
  AttachmentMetadataDto,
} from '@/attachment/dto/attachment.dto';
import { Attachment } from '@/attachment/schemas/attachment.schema';
import { generateUniqueFilename } from '@/attachment/utilities';
import { HelperService } from '@/helper/helper.service';
import BaseStorageHelper from '@/helper/lib/base-storage-helper';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { MINIO_HELPER_NAME } from './settings';

@Injectable()
export default class MinioStorageHelper
  extends BaseStorageHelper<typeof MINIO_HELPER_NAME>
  implements OnModuleInit
{
  private client: Minio.Client;

  constructor(
    settingService: SettingService,
    helperService: HelperService,
    logger: LoggerService,
  ) {
    super(MINIO_HELPER_NAME, settingService, helperService, logger);
  }

  getPath() {
    return __dirname;
  }

  private async initClient() {
    const settings = await this.getSettings();

    // Initializes the MinIO client when the module is initialized,
    // using the configuration values provided in `settings.minio_helper`.
    this.client = new Minio.Client({
      endPoint: settings.endpoint,
      port: parseInt(settings.port),
      useSSL: settings.use_ssl,
      accessKey: settings.access_key,
      secretKey: settings.secret_key,
    });
  }

  async onApplicationBootstrap() {
    await this.initClient();
  }

  @OnEvent('hook:minio_helper:*')
  async handleSettingUpdate() {
    await this.initClient();
  }

  private parseLocation(attachment: Attachment) {
    const [, bucket, objectName] = attachment.location.split('/');
    return { bucket, objectName };
  }

  /**
   * Uploads a file to the MINIO server.
   *
   * @param file - The file
   * @param metadata - The attachment metadata informations.
   * @returns A promise that resolves to a MINIO Object.
   */
  private async upload(
    objectName: string,
    file: Buffer | Stream | Readable | Express.Multer.File,
    metadata: AttachmentMetadataDto,
  ) {
    const settings = await this.getSettings();
    const { bucket } = settings;

    if (file instanceof Buffer || file instanceof Readable) {
      return this.client.putObject(
        bucket,
        objectName,
        file,
        metadata.size,
        metadata,
      );
    }

    if (file instanceof Stream) {
      const passThrough = new PassThrough();
      file.pipe(passThrough);
      return this.client.putObject(
        bucket,
        objectName,
        passThrough,
        metadata.size,
        metadata,
      );
    }

    if ('path' in file && file.path) {
      const fileStream = createReadStream(file.path);
      return this.client.putObject(
        bucket,
        objectName,
        fileStream,
        metadata.size,
        metadata,
      );
    }

    if ('buffer' in file && file.buffer) {
      return this.client.putObject(
        bucket,
        objectName,
        file.buffer,
        metadata.size,
        metadata,
      );
    }

    throw new Error('Unsupported file type');
  }

  /**
   * Stores an attachment file in Minio.
   *
   * @param file - The file
   * @param metadata - The attachment metadata informations.
   * @returns A promise that resolves to the uploaded attachment.
   */
  async store(
    file: Buffer | Stream | Readable | Express.Multer.File,
    metadata: AttachmentMetadataDto,
  ): Promise<AttachmentCreateDto> {
    const settings = await this.getSettings();
    const objectName = generateUniqueFilename(metadata.name);
    await this.upload(objectName, file, metadata);

    return {
      ...metadata,
      location: `/${settings.bucket}/${objectName}`,
    };
  }

  /**
   * Downloads an attachment from Minio.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a StreamableFile representing the downloaded attachment.
   */
  async download(attachment: Attachment): Promise<StreamableFile> {
    const { bucket, objectName } = this.parseLocation(attachment);
    const dataStream = await this.client.getObject(bucket, objectName);

    const disposition = `attachment; filename="${encodeURIComponent(
      attachment.name,
    )}"`;

    return new StreamableFile(dataStream, {
      type: attachment.type,
      length: attachment.size,
      disposition,
    });
  }

  /**
   * Returns an attachment file from Minio as a Buffer.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Buffer representing the attachment file.
   */
  async readAsBuffer(attachment: Attachment): Promise<Buffer | undefined> {
    const { bucket, objectName } = this.parseLocation(attachment);
    const dataStream = await this.client.getObject(bucket, objectName);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      dataStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      dataStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Returns an attachment file from Minio as a Stream.
   *
   * @param attachment - The attachment to download.
   * @returns A promise that resolves to a Stream representing the attachment file.
   */
  async readAsStream(attachment: Attachment): Promise<Stream | undefined> {
    const { bucket, objectName } = this.parseLocation(attachment);
    return await this.client.getObject(bucket, objectName);
  }
}
