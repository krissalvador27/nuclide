/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {NuclideDebuggerProvider} from 'nuclide-debugger-common';

import createPackage from 'nuclide-commons-atom/createPackage';
import passesGK from '../../commons-node/passesGK';
import AutoGenLaunchAttachProvider from 'nuclide-debugger-common/AutoGenLaunchAttachProvider';
import HhvmLaunchAttachProvider from './HhvmLaunchAttachProvider';
import ReactNativeLaunchAttachProvider from './ReactNativeLaunchAttachProvider';
import NativeLaunchAttachProvider from './NativeLaunchAttachProvider';
import UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import fsPromise from 'nuclide-commons/fsPromise';
import {
  listenToRemoteDebugCommands,
  getPythonAutoGenConfig,
  getOCamlAutoGenConfig,
  getPrepackAutoGenConfig,
} from './utils';
// eslint-disable-next-line rulesdir/prefer-nuclide-uri
import path from 'path';

class Activation {
  _subscriptions: UniversalDisposable;

  constructor() {
    this._subscriptions = new UniversalDisposable(
      listenToRemoteDebugCommands(),
    );

    fsPromise.exists(path.join(__dirname, 'fb-marker')).then(exists => {
      const isOpenSource = !exists;
      this._registerPythonDebugProvider();
      this._registerReactNativeDebugProvider(isOpenSource);
      this._registerPrepackDebugProvider(isOpenSource);
      this._registerOcamlDebugProvider();
      this._registerNativeVspProvider();
      this._registerHHVMDebugProvider();
    });
  }

  _registerPythonDebugProvider(): void {
    this._registerDebugProvider({
      name: 'Python',
      getLaunchAttachProvider: connection => {
        return new AutoGenLaunchAttachProvider(
          'Python',
          connection,
          getPythonAutoGenConfig(),
        );
      },
    });
  }

  _registerDebugProvider(provider: NuclideDebuggerProvider): void {
    this._subscriptions.add(
      atom.packages.serviceHub.provide('debugger.provider', '0.0.0', provider),
    );
  }

  async _registerReactNativeDebugProvider(
    isOpenSource: boolean,
  ): Promise<void> {
    if ((await passesGK('nuclide_debugger_reactnative')) || isOpenSource) {
      this._registerDebugProvider({
        name: 'React Native',
        getLaunchAttachProvider: connection => {
          return new ReactNativeLaunchAttachProvider(connection);
        },
      });
    }
  }

  async _registerPrepackDebugProvider(isOpenSource: boolean): Promise<void> {
    if ((await passesGK('nuclide_debugger_prepack')) || isOpenSource) {
      this._registerDebugProvider({
        name: 'Prepack',
        getLaunchAttachProvider: connection => {
          return new AutoGenLaunchAttachProvider(
            'Prepack',
            connection,
            getPrepackAutoGenConfig(),
          );
        },
      });
    }
  }

  async _registerOcamlDebugProvider(): Promise<void> {
    if (await passesGK('nuclide_debugger_ocaml')) {
      this._registerDebugProvider({
        name: 'OCaml',
        getLaunchAttachProvider: connection => {
          return new AutoGenLaunchAttachProvider(
            'OCaml',
            connection,
            getOCamlAutoGenConfig(),
          );
        },
      });
    }
  }

  async _registerNativeVspProvider(): Promise<void> {
    this._registerDebugProvider({
      name: 'Native (C/C++)',
      getLaunchAttachProvider: connection => {
        return new NativeLaunchAttachProvider(connection);
      },
    });
  }

  async _registerHHVMDebugProvider(): Promise<void> {
    this._registerDebugProvider({
      name: 'Hack / PHP',
      getLaunchAttachProvider: connection => {
        return new HhvmLaunchAttachProvider('Hack / PHP', connection);
      },
    });
  }

  dispose(): void {
    this._subscriptions.dispose();
  }
}

createPackage(module.exports, Activation);
