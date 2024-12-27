import { createJazzRNApp } from 'jazz-react-native';
import { PlayerAccount } from '@/schema/accounts';
import { MMKVStore } from './mmkv-store';

export const Jazz = createJazzRNApp({
  kvStore: new MMKVStore(),
  AccountSchema: PlayerAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;
