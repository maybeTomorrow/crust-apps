// Copyright 2017-2021 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AppProps as Props } from '@polkadot/react-components/types';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { Route, Switch } from 'react-router';

import { useTranslation } from '@polkadot/apps/translate';
import { HelpOverlay, Tabs } from '@polkadot/react-components';
import { useAccounts, useApi } from '@polkadot/react-hooks';
import VersionQuery from './versionQuery';
import basicMd from './md/basic.md';
import basicMd_zh from './md/basic_zh.md';
import Summary, { PKInfo } from './SummaryInfo';
import { BlockAuthorsContext } from '@polkadot/react-query';
import { SworkerVersion } from './VersionInfo';
import { versionsRecord, versionsStartBlockRecord } from './versionQuery/VersionsState';
import _ from 'lodash';

const HIDDEN_ACC = ['vanity'];

function getSum (total: string, num: string) {
  return total + num;
}

const getNumber = (str: string) => {
  return Number(str.split(',').reduce(getSum));
};

function BridgeApp ({ basePath, onStatusChange }: Props): React.ReactElement<Props> {
  const { t, i18n } = useTranslation();
  const { hasAccounts } = useAccounts();
  const { lastBlockNumber } = useContext(BlockAuthorsContext);
  const [current, setCurrent] = useState<number>(0);
  const { api } = useApi();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [summaryInfo, setSummaryInfo] = useState<SworkerVersion[]>([]);
  const [pkInfos, setPkInfos] = useState<PKInfo[]>([]);

  const itemsRef = useRef([
    {
      isRoot: true,
      name: 'sworkerVersion',
      text: t<string>('sWorker Version')
    }
  ]);

  useEffect(() => {
    if (lastBlockNumber) {
      setCurrent(getNumber(lastBlockNumber))
    }

  }, [lastBlockNumber])

  const getVersionSummaryInfo = () => {
    let unsub: (() => void) | undefined;
    const fns: any[] = [
      [api.query.swork.pubKeys.entries]
    ];
    const sv: SworkerVersion[] = [];
    const pkInfos: PKInfo[] = [];

    api.combineLatest<any[]>(fns, ([pubkyes]): void => {
      const availabeCode: any[] = []
      if (Array.isArray(pubkyes)) {
        pubkyes.forEach(([{ args: [_] }, value]) => {
          if (versionsRecord[value.code]) {
            availabeCode.push(value)
          }
          pkInfos.push(value)
        });
        const codeGroup = _.groupBy(availabeCode, 'code');
        const total = availabeCode.length
        Object.entries(codeGroup).forEach(([code, entries]) => {
          api.query.swork.codes(code).then(res => {
            const codeInfo = JSON.parse(JSON.stringify(res));
            sv.push({
              version: code,
              start: versionsStartBlockRecord[code],
              end: codeInfo,
              proportion: _.divide(entries.length, total)
            })
          })
        });
        setPkInfos(pkInfos);
        setSummaryInfo(sv);
        setIsLoading(false);
      }
    }).then((_unsub): void => {
      unsub = _unsub;
    }).catch(console.error);

    return (): void => {
      unsub && unsub();
    };
  };

  useEffect(() => {
    getVersionSummaryInfo()
  }, [])

  return (
    
        <main className='accounts--App'>
          <header>
            <Tabs
              basePath={basePath}
              hidden={(hasAccounts) ? undefined : HIDDEN_ACC}
              items={itemsRef.current}
            />
          </header>
          <HelpOverlay md={i18n.language == 'zh' ? basicMd_zh as string : basicMd as string} />
          <Summary current={current} summaryInfo={summaryInfo} isLoading={isLoading} />
          <Switch>
            <Route basePath={basePath}
              onStatusChange={onStatusChange}>
                <VersionQuery current={current} pkInfos={pkInfos} isLoading={isLoading} />
            </Route>
          </Switch>
        </main>

  );
}

export default React.memo(BridgeApp);
