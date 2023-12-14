/*
 * Copyright (c) 2018-2023 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { V222DevfileMetadata } from '@devfile/api';

export type DevfileMetadataLike = V222DevfileMetadata & {
  namespace?: string;
  generateName?: string;
};

export type DevfileMetadata = DevfileMetadataLike &
  Required<Pick<DevfileMetadataLike, 'name' | 'namespace'>>;
