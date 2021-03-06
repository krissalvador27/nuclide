/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import fs from 'fs';
import os from 'os';
import nuclideUri from 'nuclide-commons/nuclideUri';
import yargs from 'yargs';

type Preset = {
  description: string,
  args: Array<string>,
};

type PresetSummary = {
  name: string,
  description: string,
};

type ConfigFileContents = {
  presets: {
    [string]: Preset,
  },
};

export default class ConfigFile {
  _presets: ConfigFileContents;

  constructor() {
    const configFile = nuclideUri.join(os.homedir(), '.fbdbg', 'config.json');
    try {
      const contents = fs.readFileSync(configFile, 'utf8');
      this._presets = JSON.parse(contents);
    } catch (ex) {
      this._presets = {
        presets: {},
      };
    }
  }

  applyPresets(): Array<string> {
    const name = yargs.argv.preset;
    if (name == null) {
      return process.argv.splice(2);
    }

    const preset = this._presets.presets[name];
    if (preset == null) {
      throw new Error(
        `Preset '${name}' not found -- check ./fbdbg/config.json.`,
      );
    }

    // we want to put the args from the preset first, so the user can override
    // them on the command line.
    // for now, only replace $USER instead of doing a global environment check
    //
    const user = os.userInfo().username;
    const args = preset.args.map(arg => arg.replace(/\$USER/g, user));
    return args.concat(process.argv.splice(2));
  }

  presets(): Array<PresetSummary> {
    const keys = Object.keys(this._presets.presets);
    keys.sort();

    return keys.map(name => ({
      name,
      description: this._presets.presets[name].description,
    }));
  }
}
