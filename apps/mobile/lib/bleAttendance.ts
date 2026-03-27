import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import * as BLEAdvertiser from 'react-native-ble-advertiser';

const COMPANY_ID = 0x23ab;

const toManufacturerData = (code: string): number[] => {
  const normalized = code.replace(/\D/g, '').slice(0, 12);
  if (!normalized) return [1, 2, 3, 4];
  return normalized.split('').map((c) => Number(c) & 0xff);
};

export const ensureBlePermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ] as const;

  const result = await PermissionsAndroid.requestMultiple([...permissions]);
  return permissions.every((p) => result[p as keyof typeof result] === PermissionsAndroid.RESULTS.GRANTED);
};

export const startTeacherBleAdvertising = async (bleServiceUuid: string, bluetoothCode: string): Promise<void> => {
  BLEAdvertiser.setCompanyId(COMPANY_ID);
  await BLEAdvertiser.broadcast(bleServiceUuid, toManufacturerData(bluetoothCode), {
    includeDeviceName: true,
    connectable: false,
    includeTxPowerLevel: true,
  });
};

export const stopTeacherBleAdvertising = async (): Promise<void> => {
  try {
    await BLEAdvertiser.stopBroadcast();
  } catch {
    // ignore when no active broadcast exists
  }
};

export const scanForTeacherBleSession = async (
  bleServiceUuid: string,
  onFound: () => void
): Promise<() => Promise<void>> => {
  let found = false;
  const emitter = new NativeEventEmitter((NativeModules as any).BLEAdvertiser);

  const subscription = emitter.addListener('onDeviceFound', (deviceData: any) => {
    if (found) return;
    const services = Array.isArray(deviceData?.serviceUuids) ? deviceData.serviceUuids : [];
    const hasMatch = services.some((u: string) => String(u).toLowerCase() === bleServiceUuid.toLowerCase());
    if (!hasMatch) return;

    found = true;
    onFound();
  });

  BLEAdvertiser.setCompanyId(COMPANY_ID);
  await BLEAdvertiser.scanByService(bleServiceUuid, {
    scanMode: 2,
    matchMode: 1,
  });

  return async () => {
    subscription.remove();
    try {
      await BLEAdvertiser.stopScan();
    } catch {
      // ignore when no active scan exists
    }
  };
};
