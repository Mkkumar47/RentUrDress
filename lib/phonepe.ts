import crypto from "crypto";

type PhonePeConfig = {
  hostUrl: string;
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  appBaseUrl: string;
};

export type PhonePePayRequestInput = {
  merchantTransactionId: string;
  merchantUserId: string;
  amountInPaise: number;
  mobileNumber?: string;
};

function getRequiredValue(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is required for PhonePe integration.`);
  }
  return value;
}

export function getPhonePeConfig(): PhonePeConfig {
  return {
    hostUrl: getRequiredValue(
      process.env.PHONEPE_HOST_URL ?? process.env.NEXT_PUBLIC_PHONE_PAY_HOST_URL,
      "PHONEPE_HOST_URL",
    ),
    merchantId: getRequiredValue(
      process.env.PHONEPE_MERCHANT_ID ?? process.env.NEXT_PUBLIC_MERCHANT_ID,
      "PHONEPE_MERCHANT_ID",
    ),
    saltKey: getRequiredValue(
      process.env.PHONEPE_SALT_KEY ?? process.env.NEXT_PUBLIC_SALT_KEY,
      "PHONEPE_SALT_KEY",
    ),
    saltIndex: getRequiredValue(
      process.env.PHONEPE_SALT_INDEX ?? process.env.NEXT_PUBLIC_SALT_INDEX,
      "PHONEPE_SALT_INDEX",
    ),
    appBaseUrl:
      process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000",
  };
}

export function createXVerifyFromPayload(
  base64Payload: string,
  apiPath: string,
  saltKey: string,
  saltIndex: string,
) {
  const checksum = crypto
    .createHash("sha256")
    .update(base64Payload + apiPath + saltKey)
    .digest("hex");
  return `${checksum}###${saltIndex}`;
}

export function createXVerifyForStatus(
  apiPath: string,
  saltKey: string,
  saltIndex: string,
) {
  const checksum = crypto.createHash("sha256").update(apiPath + saltKey).digest("hex");
  return `${checksum}###${saltIndex}`;
}

export function createPhonePePayRequest(input: PhonePePayRequestInput) {
  const config = getPhonePeConfig();
  const apiPath = "/pg/v1/pay";
  const callbackUrl = `${config.appBaseUrl}/api/checkout/phonepe/callback`;
  const redirectUrl = `${config.appBaseUrl}/dashboard?phonepe=return`;

  const payload = {
    merchantId: config.merchantId,
    merchantTransactionId: input.merchantTransactionId,
    merchantUserId: input.merchantUserId,
    amount: input.amountInPaise,
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl,
    mobileNumber: input.mobileNumber,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const xVerify = createXVerifyFromPayload(
    base64Payload,
    apiPath,
    config.saltKey,
    config.saltIndex,
  );

  return {
    config,
    apiPath,
    payload,
    base64Payload,
    xVerify,
  };
}
