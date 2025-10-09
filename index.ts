import { readFileSync } from "fs";

type CheckResult = {
  success: boolean;
};

type ZoneData = {
  id: string;
  name: string;
};

type GetZoneResult = CheckResult & {
  result: Array<ZoneData>;
};

type DNSRecord = {
  id: string;
  name: string;
  type: string;
  ttl: number;
  content: string;
  proxied: boolean;
};

type DNSRecordResult = CheckResult & {
  result: Array<DNSRecord>;
};

type SetDNSData = {
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
};

enum MSGS {
  START = "Starting update dns: ",
  TIME = "  - Time: ",
  DOMAINS = "  - Domains:",
}

enum ERRORS {
  NO_DNS_RECORD_W_ZONE = "  - Cannot get the dns records with current zond id.",
  NO_DNS_RECORD_W_TOKEN = "  - Cannot get any zone id with current API token.",
  WRONG_TOKEN = '"  - Error: The API access token was wrong."',
}

enum APIS {
  CHECK_API = "https://checkip.amazonaws.com",
  VERIFY_TOKEN = "https://api.cloudflare.com/client/v4/user/tokens/verify",
  GET_ZONE = "https://api.cloudflare.com/client/v4/zones?per_page=50",
}

enum METHODS {
  GET = "GET",
  PUT = "PUT",
}

const token: string = readFileSync("./.token", { encoding: "utf8" });

const headers = {
  Authorization: `Bearer ${token.trim()}`,
  "Content-Type": "application/json",
};

/**
 * waiting time (use async syntax)
 * @param {Number} timeout
 * @returns {Promise<true>}
 */
const sleep = async (timeout: number = 60000): Promise<true> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, timeout);
  });
};

/**
 * Get current client ip from amz
 * @returns {Promise<string>}
 */
const getClientIp = async (): Promise<string> => {
  const response = await fetch(APIS.CHECK_API, {
    method: METHODS.GET,
  });

  const text = await response.text();

  return text.trim();
};

/**
 * Check token is valid or invalid
 * @returns {Promise<CheckResult>}
 */
const verifyToken = async (): Promise<CheckResult> => {
  const response = await fetch(APIS.VERIFY_TOKEN, {
    headers,
    method: METHODS.GET,
  });

  return await response.json();
};

/**
 * List Zones -> V4PagePaginationArray<Zone>
 * @returns {Promise<GetZoneResult>}
 */
const getZones = async (): Promise<GetZoneResult> => {
  const response = await fetch(APIS.GET_ZONE, { headers, method: METHODS.GET });

  return await response.json();
};

/**
 * DNS Record Details -> Envelope<RecordResponse>
 * @param {String} zoneId
 * @returns {Promise<DNSRecordResult>}
 */
const getDNSRecords = async (zoneId: string): Promise<DNSRecordResult> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&per_page=50`,
    { headers, method: METHODS.GET }
  );

  return await response.json();
};

/**
 * Update DNS Record -> Envelope<RecordResponse>
 * @param {String} zoneId
 * @param {String} recordId
 * @param {SetDNSData} data
 * @returns {Promise<CheckResult>}
 */
const setDNSRecords = async (
  zoneId: string,
  recordId: string,
  data: SetDNSData
): Promise<CheckResult> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    { headers, method: METHODS.PUT, body: JSON.stringify(data) }
  );

  return await response.json();
};

while (true) {
  const clientIP = await getClientIp();
  const { success } = await verifyToken();

  console.log(MSGS.START);
  console.log(MSGS.TIME, new Date());

  if (success) {
    console.log(MSGS.DOMAINS);

    const { success, result } = await getZones();

    if (success) {
      for (const { id: zoneId } of result) {
        const { result, success } = await getDNSRecords(zoneId);

        if (success) {
          for (const {
            id: recordId,
            name,
            content,
            proxied,
            ttl,
            type,
          } of result) {
            if (clientIP !== content) {
              const data: SetDNSData = {
                content: clientIP,
                name,
                proxied,
                ttl,
                type,
              };

              const { success } = await setDNSRecords(zoneId, recordId, data);

              if (!success) {
                console.log(`    - Error While updating ${name}`);
              } else {
                console.log(
                  `    - ${name}: successfully updated to ${clientIP}`
                );
              }
            } else {
              console.log(`    - ${name}: no needs to update`);
            }
          }
        } else {
          console.log(ERRORS.NO_DNS_RECORD_W_ZONE);
        }
      }
    } else {
      console.log(ERRORS.NO_DNS_RECORD_W_TOKEN);
    }
  } else {
    console.log(ERRORS.WRONG_TOKEN);
  }

  console.log();

  await sleep(60000);
}
