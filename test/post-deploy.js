/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
const assert = require('assert');
const openwhisk = require('openwhisk');
const pkgJson = require('../package.json');

require('dotenv').config();

describe('Post-Deploy Tests', () => {
  const namespace = process.env.WSK_NAMESPACE;
  let wskOpts = {};
  let actionName;
  let { version } = pkgJson;

  before(() => {
    wskOpts = {
      api_key: process.env.WSK_AUTH,
      apihost: process.env.WSK_APIHOST || 'https://adobeioruntime.net',
    };
    if (process.env.CIRCLE_BUILD_NUM && process.env.CIRCLE_BRANCH !== 'master') {
      version = `ci${process.env.CIRCLE_BUILD_NUM}`;
    }
    // eslint-disable-next-line no-template-curly-in-string
    actionName = pkgJson.wsk.name.replace('${version}', version);
  });

  it('Service responds to healthcheck', async () => {
    const ow = openwhisk(wskOpts);
    const ret = await ow.actions.invoke({
      namespace,
      actionName,
      blocking: true,
      result: false,
      params: {
        __ow_path: '/_status_check/healthcheck.json',
      },
    });
    delete ret.response.result.body.response_time;
    assert.deepEqual(ret.response.result, {
      body: {
        process: {
          activation: ret.activationId,
        },
        status: 'OK',
        version,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Version': version,
      },
      statusCode: 200,
    });
  });
});
