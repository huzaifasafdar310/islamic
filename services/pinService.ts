import * as SecureStore from "expo-secure-store";

const PIN_KEY = "guardian_pin";
const DEFAULT_PIN = "1234";

/** Returns the stored PIN, or default "1234" if not yet set. */
export async function getPin(): Promise<string> {
  const pin = await SecureStore.getItemAsync(PIN_KEY);
  return pin ?? DEFAULT_PIN;
}

/** Saves a new PIN securely. */
export async function setPin(newPin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, newPin);
}

/** Returns true if the input matches the stored PIN. */
export async function verifyPin(input: string): Promise<boolean> {
  const pin = await getPin();
  return input === pin;
}
