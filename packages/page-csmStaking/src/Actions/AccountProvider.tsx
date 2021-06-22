// Copyright 2017-2021 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */

import BN from 'bn.js';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { AddressSmall, Button, Menu, Popup, StatusContext } from '@polkadot/react-components';
import { useApi, useCall, useToggle } from '@polkadot/react-hooks';
import { BN_ZERO } from '@polkadot/util';
import { useTranslation } from '@polkadot/apps/translate';
import { ProviderState } from './partials/types';
import Guarantee from './Guarantee';
import GuaranteePref from './GuaranteePref';
import UnbondFounds from './UnbondFounds';
import { FormatCsmBalance, FormatBalance } from '@polkadot/react-query';
import GuarantorStake from './GuarantorStake';

interface Props {
    className?: string;
    isDisabled?: boolean;
    info: ProviderState;
    accounts: any[];
    providers: string[];
}

const UNIT = new BN(1_000_000_00_000);

function Account({ className = '', info: { account, totalRewards, pendingRewards, guarantors }, isDisabled, providers }: Props): React.ReactElement<Props> {
    const { t } = useTranslation();
    const { api } = useApi();
    const [isSetPrefOpen, toggleSetPref] = useToggle();
    const [isGuaranteeOpen, toggleGuarantee] = useToggle();
    const [isSettingsOpen, toggleSettings] = useToggle();
    const [isUnbondOpen, toggleUnbond] = useToggle();
    const { queueExtrinsic } = useContext(StatusContext);
    const [totalCSM, setTotalCSM] = useState<BN>(BN_ZERO);
    const query = guarantors.concat(account);
    const multiQuery = useCall<any[]>(api.query.csmLocking.ledger.multi, [query]);

    useEffect(() => {
        const tmp = multiQuery && JSON.parse(JSON.stringify(multiQuery))
        let total = BN_ZERO
        if (tmp && tmp.length) {
            for (const ledger of tmp) {
                total = total.add(new BN(Number(ledger.active).toString()))
            }
            setTotalCSM(total)
        }

    }, [multiQuery])

    const withdrawFunds = useCallback(
        () => {
            queueExtrinsic({
                accountId: account,
                extrinsic: api.tx.csmLocking.withdrawUnbonded()
            });
        },
        [api, account, queueExtrinsic]
    );

    return (
        <tr className={className}>
            {isGuaranteeOpen && account && (
                <Guarantee
                    accountId={account}
                    onClose={toggleGuarantee}
                    providers={providers}
                />
            )}
            {isSetPrefOpen && account && (
                <GuaranteePref
                    accountId={account}
                    onClose={toggleSetPref}
                />
            )}
            {isUnbondOpen && account && (
                <UnbondFounds
                    accountId={account}
                    onClose={toggleUnbond}
                />
            )}
            <td className='address'>
                <AddressSmall value={account} />
            </td>
            <GuarantorStake account={account} guarantors={guarantors} />
            <td className='number'>
                <FormatCsmBalance value={totalCSM} />
            </td>
            <td className='number'>
                <FormatBalance value={UNIT.muln(totalRewards)} />
            </td>
            <td className='number'>
                <FormatBalance value={UNIT.muln(pendingRewards)} />
            </td>

            <td className='button'>
                {
                    <>
                        {
                            (
                                <Button.Group>
                                    <Button
                                        icon='certificate'
                                        isDisabled={isDisabled}
                                        key='validate'
                                        label={t<string>('Guarantee fee')}
                                        onClick={toggleSetPref}
                                    />
                                    <Button
                                        icon='hand-paper'
                                        isDisabled={isDisabled}
                                        key='nominate'
                                        label={t<string>('Guarantee')}
                                        onClick={toggleGuarantee}
                                    />
                                </Button.Group>
                            )
                        }
                        <Popup
                            isOpen={isSettingsOpen}
                            key='settings'
                            onClose={toggleSettings}
                            trigger={
                                <Button
                                    icon='ellipsis-v'
                                    isDisabled={isDisabled}
                                    onClick={toggleSettings}
                                />
                            }
                        >
                            <Menu
                                onClick={toggleSettings}
                                text
                                vertical
                            >
                                <Menu.Item onClick={toggleUnbond}>
                                    {t<string>('Unbond founds')}
                                </Menu.Item>
                                <Menu.Item
                                    onClick={withdrawFunds}
                                >
                                    {t<string>('Withdraw unbonded funds')}
                                </Menu.Item>
                            </Menu>
                        </Popup>
                    </>
                }
            </td>
        </tr>
    );
}

export default React.memo(styled(Account)`
  .ui--Button-Group {
    display: inline-block;
    margin-right: 0.25rem;
    vertical-align: inherit;
  }
`);
