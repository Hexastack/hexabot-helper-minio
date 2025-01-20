/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const MINIO_HELPER_NAME = 'minio-helper';

export const MINIO_HELPER_NAMESPACE = 'minio_helper';

export default [
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'endpoint',
    value: 'minio',
    type: SettingType.text,
  },
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'port',
    value: '9000',
    type: SettingType.text,
  },
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'use_ssl',
    value: false,
    type: SettingType.checkbox,
  },
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'access_key',
    value: '',
    type: SettingType.secret,
  },
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'secret_key',
    value: '',
    type: SettingType.secret,
  },
  {
    group: MINIO_HELPER_NAMESPACE,
    label: 'bucket',
    value: process.env.MINIO_DEFAULT_BUCKET_NAME || 'hexabot',
    type: SettingType.text,
  },
] as const satisfies HelperSetting<typeof MINIO_HELPER_NAME>[];
